import pdfParse from 'pdf-parse';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/rtf',
];

/**
 * Extracts text content from an uploaded resume file.
 *
 * @param {Buffer} buffer - The file contents as a Buffer.
 * @param {string} mimeType - The MIME type of the uploaded file.
 * @returns {Promise<{ text: string | null, error: string | null }>}
 */
export async function parseResume(buffer, mimeType) {
  if (!buffer || buffer.length === 0) {
    return { text: null, error: 'File is empty' };
  }

  if (buffer.length > MAX_FILE_SIZE) {
    return {
      text: null,
      error: `File size exceeds the maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    };
  }

  const normalizedMime = mimeType.toLowerCase().split(';')[0].trim();
  if (!ALLOWED_MIME_TYPES.includes(normalizedMime)) {
    return {
      text: null,
      error: `Unsupported file type "${normalizedMime}". Allowed types: PDF, plain text, markdown`,
    };
  }

  if (normalizedMime === 'application/pdf') {
    return parsePDF(buffer);
  }

  return parseText(buffer);
}

/**
 * Parses a PDF buffer and extracts text content.
 * @param {Buffer} buffer
 * @returns {Promise<{ text: string | null, error: string | null }>}
 */
async function parsePDF(buffer) {
  try {
    const data = await pdfParse(buffer, {
      max: 20,
    });

    const text = data.text?.trim();
    if (!text || text.length < 10) {
      return {
        text: null,
        error: 'Could not extract meaningful text from the PDF. The file may be image-based or empty. Please paste your resume text instead.',
      };
    }

    return { text, error: null };
  } catch (err) {
    const message = err.message || '';
    if (message.includes('encrypted') || message.includes('password')) {
      return {
        text: null,
        error: 'The PDF is password-protected. Please remove the password and try again, or paste your resume text instead.',
      };
    }
    return {
      text: null,
      error: 'Failed to parse the PDF file. The file may be corrupted or in an unsupported format. Please paste your resume text instead.',
    };
  }
}

/**
 * Parses a plain text buffer.
 * @param {Buffer} buffer
 * @returns {{ text: string | null, error: string | null }}
 */
function parseText(buffer) {
  try {
    const text = buffer.toString('utf-8').trim();
    if (!text || text.length < 10) {
      return {
        text: null,
        error: 'The file appears to be empty or contains very little text.',
      };
    }
    return { text, error: null };
  } catch {
    return {
      text: null,
      error: 'Failed to read the text file. Please ensure it is UTF-8 encoded.',
    };
  }
}
