import OpenAI from 'openai';
import { getSystemPrompt, getUserPrompt } from '@/lib/prompts';

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
 * @returns {Promise<Object>} Reconstructed and validated JSON data.
 */
async function executeGenerationAttempt(model, resumeText, jobDescription, tone, length) {
  const systemPrompt = getSystemPrompt(tone, length);
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

  if (typeof reconstructed.atsScore !== 'number' || reconstructed.atsScore < 0 || reconstructed.atsScore > 100) {
    reconstructed.atsScore = Math.min(100, Math.max(0, Number(reconstructed.atsScore) || 0));
  }

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

  return reconstructed;
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
  const primaryModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  try {
    console.log(`Attempting tailored generation using primary model: ${primaryModel}`);
    return await executeGenerationAttempt(primaryModel, resumeText, jobDescription, tone, length);
  } catch (primaryError) {
    console.warn(`Primary model ${primaryModel} failed or returned truncated output: ${primaryError.message}`);

    // If primary was not the fallback model, retry once then try the fallback
    if (primaryModel !== 'llama-3.3-70b-versatile') {
      // Retry primary once (transient failures)
      try {
        console.log(`Retrying primary model ${primaryModel} once...`);
        return await executeGenerationAttempt(primaryModel, resumeText, jobDescription, tone, length);
      } catch (retryError) {
        console.warn(`Primary model retry also failed: ${retryError.message}`);
      }

      console.log('Automatically falling back to Llama-3.3-70b-versatile to ensure seamless service delivery.');
      try {
        return await executeGenerationAttempt('llama-3.3-70b-versatile', resumeText, jobDescription, tone, length);
      } catch (fallbackError) {
        console.error('Fallback model also failed:', fallbackError.message);
        throw new Error(`AI service failed on fallback: ${fallbackError.message}`);
      }
    }
    throw primaryError;
  }
}
