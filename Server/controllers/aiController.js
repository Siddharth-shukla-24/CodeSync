const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?key=${GEMINI_API_KEY}`;

const buildReviewPrompt = (code, language) => `
You are a senior software engineer reviewing code in a live pair-programming session.
Review the following ${language} code.

Respond in this exact structure using markdown:

## Summary
One sentence overall verdict.

## Issues
- List bugs, logic errors, or edge cases missed. If none, say "No critical issues found."

## Suggestions
- List style, readability, or performance improvements. Be specific with line references where possible.

## Complexity
State time and space complexity if applicable.

Keep the entire response under 250 words. Be direct, not verbose.

CODE:
\`\`\`${language}
${code}
\`\`\`
`;

const reviewCode = async (req, res) => {
  const { code, language } = req.body;

  // Input validation
  if (!code || typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({ success: false, message: 'Code is required' });
  }
  if (code.length > 20000) {
    return res.status(400).json({ success: false, message: 'Code too long (max 20,000 chars)' });
  }
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ success: false, message: 'AI service not configured' });
  }

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const prompt = buildReviewPrompt(code, language || 'javascript');

    const geminiRes = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 600 },
      }),
    });

    if (!geminiRes.ok || !geminiRes.body) {
      const errText = await geminiRes.text().catch(() => 'Unknown error');
      res.write(`data: ${JSON.stringify({ error: 'Gemini API error', detail: errText })}\n\n`);
      return res.end();
    }

    // Gemini streams back a JSON array in chunks. We read raw bytes,
    // extract text fragments, and forward them as SSE events.
    const reader = geminiRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Gemini's streaming JSON has objects separated by commas inside an array.
      // We extract any "text": "..." fields we can find as they arrive.
      const textMatches = buffer.matchAll(/"text":\s*"((?:[^"\\]|\\.)*)"/g);
      for (const match of textMatches) {
        const chunk = match[1]
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }
      // Reset buffer to avoid re-matching the same text repeatedly
      buffer = '';
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error('AI review error:', err.message);
    res.write(`data: ${JSON.stringify({ error: 'Failed to generate review' })}\n\n`);
    res.end();
  }
};

module.exports = { reviewCode };