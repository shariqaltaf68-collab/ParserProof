import OpenAI from 'openai';
import { getSystemPrompt, getUserPrompt } from '@/lib/prompts';
import { retrieveContext } from '@/lib/rag';

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

/**
 * Executes a single generation attempt for a given model.
 *
 * @param {string} model - The model to use.
 * @param {string} resumeText - Raw resume text.
 * @param {string} jobDescription - Target job description.
 * @param {string} tone - Desired tone.
 * @param {string} length - Desired length.
 * @returns {Promise<Object>} Reconstructed and validated JSON data with RAG telemetry.
 */
async function executeGenerationAttempt(model, resumeText, jobDescription, tone, length) {
  // 1. Perform Hybrid RAG Retrieval to retrieve corporate & ATS-safe guidelines
  const searchQuery = `${jobDescription} ${resumeText} ${tone}`;
  const ragResult = retrieveContext(searchQuery);

  // 2. Format retrieved guidelines context for prompt injection
  const formattedContext = ragResult.chunks
    .map(
      (chunk, index) => `[TRUSTED SOURCE #${index + 1}]
Title: ${chunk.title}
Category: ${chunk.category}
Relevance Match: ${chunk.relevanceScore}%
Grounded Rules:
${chunk.content}`
    )
    .join('\n\n');

  // 3. Construct system prompt augmented with the retrieved context
  const baseSystemPrompt = getSystemPrompt(tone, length);
  const systemPrompt = `${baseSystemPrompt}

=========================================
TRUSTED RETRIEVED CONTEXT (GROUNDING CORE)
=========================================
You MUST ground your resume optimization, ATS score estimates, and skill recommendations strictly in the following retrieved guidelines. Do NOT formulate fictional rules, fake features, or ungrounded statistics.

${formattedContext}

STRICT ANTI-HALLUCINATION ENFORCEMENT:
- Refuse to fabricate user experience, achievements, tools, degrees, or certifications.
- If the user's resume is missing required details, append bracketed placeholders (e.g. "[quantify]" or "[add tool]") so the user can populate them. Never inject fake metrics.
- Do not invent ATS behaviors or guarantee perfect success. Keep evaluations realistic, blunt, and highly direct.`;

  const userPrompt = getUserPrompt(resumeText, jobDescription);

  let completion;
  try {
    completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });
  } catch (apiError) {
    if (apiError.status === 429) {
      throw new Error('AI service is currently rate-limited. Please try again in a few moments.');
    }
    if (apiError.status === 401) {
      throw new Error('AI service authentication failed. Please check the API key configuration.');
    }
    throw new Error(`AI service request failed: ${apiError.message}`);
  }

  const content = completion.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('AI service returned an empty response. Please try again.');
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    console.error('Raw AI response content failed to parse as JSON:', content);
    throw new Error('AI service returned an invalid response format. Please try again.');
  }

  // Normalize parsed keys to handle case-insensitivity and snake_case vs camelCase
  const normalized = {};
  for (const key of Object.keys(parsed)) {
    const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    normalized[normKey] = parsed[key];
  }

  const fieldMappings = {
    atsScore: ['atsscore', 'score', 'ats'],
    keywordMatch: ['keywordmatch', 'keywords', 'keyword'],
    improvedResume: ['improvedresume', 'resume', 'improved_resume'],
    coverLetter: ['coverletter', 'letter', 'cover_letter'],
    interviewQuestions: ['interviewquestions', 'questions', 'interview_questions'],
    skillGap: ['skillgap', 'gaps', 'skill_gap', 'skillsgap']
  };

  const reconstructed = {};
  for (const [targetField, aliases] of Object.entries(fieldMappings)) {
    let value = null;
    for (const alias of aliases) {
      if (normalized[alias] !== undefined && normalized[alias] !== null) {
        value = normalized[alias];
        break;
      }
    }
    
    if (value === null || value === undefined) {
      console.error(`AI parsed keys on model "${model}":`, Object.keys(parsed));
      console.error(`Full raw AI content on model "${model}":`, content);
      throw new Error(`AI service response is missing the "${targetField}" field. Please try again.`);
    }
    reconstructed[targetField] = value;
  }

  // Normalize keywordMatch array structures early
  if (!reconstructed.keywordMatch || typeof reconstructed.keywordMatch !== 'object') {
    reconstructed.keywordMatch = { matched: [], missing: [] };
  }
  if (!Array.isArray(reconstructed.keywordMatch.matched)) {
    reconstructed.keywordMatch.matched = [];
  }
  if (!Array.isArray(reconstructed.keywordMatch.missing)) {
    reconstructed.keywordMatch.missing = [];
  }

  if (!Array.isArray(reconstructed.interviewQuestions)) {
    reconstructed.interviewQuestions = [];
  }

  // Calculate mathematically grounded, highly realistic ATS score
  const rawLlmScore = typeof reconstructed.atsScore === 'number'
    ? reconstructed.atsScore
    : (Number(reconstructed.atsScore) || 70);

  reconstructed.atsScore = calculateProgrammaticAtsScore(
    reconstructed.improvedResume,
    reconstructed.keywordMatch,
    rawLlmScore
  );

  // Append RAG Grounding stats to the payload
  reconstructed.ragSources = JSON.stringify(
    ragResult.chunks.map(chunk => ({
      id: chunk.id,
      title: chunk.title,
      category: chunk.category,
      relevance: chunk.relevanceScore,
    }))
  );
  reconstructed.ragConfidence = ragResult.averageConfidence;

  return reconstructed;
}

/**
 * Calculates a highly realistic, mathematically grounded ATS score.
 * Combines keyword match rate (50%), structural verification (25%), and metric density (25%).
 * Averaged with the LLM's semantic score to prevent overprediction.
 */
export function calculateProgrammaticAtsScore(improvedResume, keywordMatch, llmScore) {
  // 1. Keyword Match Score (50% weight)
  const matched = Array.isArray(keywordMatch?.matched) ? keywordMatch.matched : [];
  const missing = Array.isArray(keywordMatch?.missing) ? keywordMatch.missing : [];
  const totalKeywords = matched.length + missing.length;
  const keywordScore = totalKeywords > 0 ? (matched.length / totalKeywords) * 100 : 70;

  // 2. Structural Parser-Safe Verification (25% weight)
  const resumeText = typeof improvedResume === 'string' ? improvedResume : '';
  const sections = [
    /##\s*(Summary|Professional\s+Summary|Profile|Career\s+Objective)/i,
    /##\s*(Experience|Professional\s+Experience|Work\s+Experience|Employment|History)/i,
    /##\s*(Education|Academic\s+Background|Academic)/i,
    /##\s*(Skills|Technical\s+Skills|Core\s+Competencies|Expertise)/i
  ];
  let sectionsFound = 0;
  for (const rx of sections) {
    if (rx.test(resumeText)) {
      sectionsFound++;
    }
  }
  const structuralScore = (sectionsFound / sections.length) * 100;

  // 3. Metric Quantification Density (25% weight)
  const lines = resumeText.split('\n');
  const bulletLines = lines.filter(line => /^\s*-\s+/.test(line));
  const totalBullets = bulletLines.length;

  // Detect percentages, currencies, scales (k, million, etc.), plus symbols, years, or metric placeholders
  const metricRegex = /(\b\d+(?:[.,\d]*\d)?\s*%|\$\s*\d+|\b\d+\s*k\b|\b\d+\s*million\b|\b\d+\s*billion\b|₹\s*\d+|\b\d+\+\s*|\[quantify|\[add\s+metric)/i;

  let quantifiedBullets = 0;
  for (const bullet of bulletLines) {
    if (metricRegex.test(bullet)) {
      quantifiedBullets++;
    }
  }
  const metricScore = totalBullets > 0 ? (quantifiedBullets / totalBullets) * 100 : 60;

  // Compute final combined programmatic score
  const programmaticScore = (keywordScore * 0.50) + (structuralScore * 0.25) + (metricScore * 0.25);

  // Average with LLM semantic score for extreme recruiters-grade realism
  const finalScore = Math.round((programmaticScore + llmScore) / 2);

  return Math.min(100, Math.max(0, finalScore));
}

/**
 * Generates tailored resume content by calling the Groq API (OpenAI-compatible).
 * Safely falls back to a highly stable model if the primary model fails or is truncated.
 *
 * @param {string} resumeText - The candidate's raw resume text.
 * @param {string} jobDescription - The target job description.
 * @param {string} tone - The desired tone (professional, confident, concise, fresh-graduate).
 * @param {string} length - The desired length (short, standard, detailed).
 * @returns {Promise<Object>} Parsed JSON with atsScore, keywordMatch, improvedResume, coverLetter, interviewQuestions, skillGap.
 * @throws {Error} If the API call fails or the response cannot be parsed.
 */
export async function generateTailoredContent(resumeText, jobDescription, tone = 'professional', length = 'standard') {
  const modelsToTry = [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'qwen/qwen3-32b',
    'meta-llama/llama-4-scout-17b-16e-instruct'
  ];

  let lastError = null;
  for (const modelName of modelsToTry) {
    try {
      console.log(`Attempting tailored generation using model: ${modelName}`);
      return await executeGenerationAttempt(modelName, resumeText, jobDescription, tone, length);
    } catch (apiError) {
      lastError = apiError;
      console.warn(`Model ${modelName} failed in generation (status: ${apiError?.status}): ${apiError?.message}`);
      // If it's a structural or authorization/authentication error (401/403), throw immediately.
      if (apiError.status === 401 || apiError.status === 403) {
        throw apiError;
      }
      // Try the next model for all other errors (429 rate limit, 400 decommissioned, 500 server error, etc.)
      continue;
    }
  }

  if (lastError) {
    throw lastError;
  }
}
