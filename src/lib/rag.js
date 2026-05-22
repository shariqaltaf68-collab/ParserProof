import { KNOWLEDGE_BASE_CHUNKS } from './knowledgeBase';

/**
 * Stopwords to filter out during tokenization to improve retrieval matching precision.
 */
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'arent', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'cant', 'cannot', 'could',
  'did', 'didnt', 'do', 'does', 'doesnt', 'doing', 'dont', 'down', 'during', 'each', 'few', 'for', 'from', 'further',
  'had', 'hadnt', 'has', 'hasnt', 'have', 'havent', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself',
  'his', 'how', 'i', 'if', 'in', 'into', 'is', 'isnt', 'it', 'its', 'itself', 'just', 'more', 'most', 'my', 'myself',
  'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  'same', 'she', 'should', 'shouldnt', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves',
  'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasnt',
  'we', 'were', 'werent', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'wont', 'would', 'you',
  'your', 'yours', 'yourself', 'yourselves'
]);

/**
 * Tokenizes and cleans a text input into an array of relevant search terms.
 * 
 * @param {string} text - Raw input string
 * @returns {string[]} Filtered lowercase tokens
 */
function tokenize(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/[\s_]+/)
    .filter(token => token.length > 1 && !STOP_WORDS.has(token));
}

/**
 * Calculates a Hybrid TF-IDF / Jaccard keyword retrieval match score between search tokens and a knowledge base chunk.
 * 
 * @param {string[]} queryTokens - Tokenized user search query
 * @param {Object} chunk - Knowledge base chunk object
 * @returns {number} Normalized score between 0 and 100
 */
function calculateMatchScore(queryTokens, chunk) {
  if (queryTokens.length === 0) return 0;

  const contentTokens = tokenize(chunk.content);
  const titleTokens = tokenize(chunk.title);
  const keywordSet = new Set(chunk.keywords.map(k => k.toLowerCase()));

  // Count frequencies in content
  const contentFreq = {};
  for (const token of contentTokens) {
    contentFreq[token] = (contentFreq[token] || 0) + 1;
  }

  let totalScore = 0;
  let matches = 0;

  for (const token of queryTokens) {
    let tokenScore = 0;

    // 1. Direct match in targeted chunk keywords (highest priority)
    if (keywordSet.has(token)) {
      tokenScore += 25; // Large boost for exact keyword hits
      matches++;
    }

    // 2. Direct match in title
    if (titleTokens.includes(token)) {
      tokenScore += 15;
      matches++;
    }

    // 3. TF-IDF style frequency match in body
    if (contentFreq[token]) {
      // Logarithmic term frequency scaling to avoid spamming single words
      const tf = 1 + Math.log(contentFreq[token]);
      tokenScore += tf * 8;
      matches++;
    }

    totalScore += tokenScore;
  }

  // Jaccard similarity coefficient to reward comprehensive overlaps
  const uniqueQueryTokens = new Set(queryTokens);
  const uniqueChunkTokens = new Set([...contentTokens, ...titleTokens]);
  let intersectionCount = 0;
  for (const q of uniqueQueryTokens) {
    if (uniqueChunkTokens.has(q) || keywordSet.has(q)) {
      intersectionCount++;
    }
  }
  
  const unionCount = uniqueQueryTokens.size + uniqueChunkTokens.size - intersectionCount;
  const jaccard = unionCount > 0 ? intersectionCount / unionCount : 0;

  // Combine scores and amplify
  const rawScore = totalScore * (1 + jaccard * 2);

  // Normalize to 0-100 scale using logarithmic ceiling mapping
  const normalized = Math.min(100, Math.round((rawScore / (queryTokens.length * 15)) * 100));

  return isNaN(normalized) ? 0 : normalized;
}

/**
 * Retrieves the Top-K most relevant knowledge chunks grounded in the query text.
 * 
 * @param {string} query - The search query (e.g. job description, user resume, user prompt)
 * @param {number} topK - Maximum number of chunks to return
 * @returns {Object} Search results including matching chunks, average confidence, and warning status
 */
export function retrieveContext(query, topK = 4) {
  const queryTokens = tokenize(query);
  
  if (queryTokens.length === 0) {
    console.warn('[RAG Engine] Empty query tokenization. Returning fallback context.');
    // Return high level default guidelines if query is empty or failed
    const defaults = KNOWLEDGE_BASE_CHUNKS.slice(0, topK).map(chunk => ({
      ...chunk,
      relevanceScore: 50
    }));
    return {
      chunks: defaults,
      averageConfidence: 50,
      isWeakRetrieval: false,
      emptyQuery: true
    };
  }

  console.log(`[RAG Engine] Tokenized search query into ${queryTokens.length} active search tokens.`);

  const scoredChunks = KNOWLEDGE_BASE_CHUNKS.map(chunk => {
    const score = calculateMatchScore(queryTokens, chunk);
    return {
      ...chunk,
      relevanceScore: score
    };
  })
  .filter(chunk => chunk.relevanceScore > 5) // Ignore irrelevant matches
  .sort((a, b) => b.relevanceScore - a.relevanceScore); // Sort by highest score descending

  const retrieved = scoredChunks.slice(0, topK);

  // If we got fewer matches than requested, fill with general default sections
  if (retrieved.length < topK) {
    const existingIds = new Set(retrieved.map(c => c.id));
    for (const chunk of KNOWLEDGE_BASE_CHUNKS) {
      if (retrieved.length >= topK) break;
      if (!existingIds.has(chunk.id)) {
        retrieved.push({
          ...chunk,
          relevanceScore: 15 // Low placeholder relevance score
        });
      }
    }
  }

  // Calculate overall confidence (average of retrieved top-3 scores, capped at 100)
  const scoreSum = retrieved.slice(0, 3).reduce((sum, chunk) => sum + chunk.relevanceScore, 0);
  const averageConfidence = Math.min(100, Math.max(5, Math.round(scoreSum / 3)));

  // If confidence is extremely low (< 25), flag it so UI can show grounding alerts
  const isWeakRetrieval = averageConfidence < 25;

  console.log(`[RAG Engine] Retrieval complete. Average Grounding Confidence: ${averageConfidence}%. Weak Retrieval: ${isWeakRetrieval}`);

  return {
    chunks: retrieved,
    averageConfidence,
    isWeakRetrieval,
    emptyQuery: false
  };
}
