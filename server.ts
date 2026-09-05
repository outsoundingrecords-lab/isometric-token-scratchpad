import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini SDK only when needed
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
  });
});

// Gemini streaming endpoint with SSE
app.post('/api/gemini/stream', async (req, res) => {
  const { prompt, maxTokens = 128, temperature = 0.7 } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'Prompt is required' });
    return;
  }

  // Secure error handling - never leak stack traces or internal environment details
  const sanitizedPrompt = typeof prompt === 'string' ? prompt.slice(0, 3000) : '';
  const safeTokens = Math.min(Math.max(1, Number(maxTokens) || 128), 512);
  const safeTemp = Math.min(Math.max(0, Number(temperature) || 0.7), 2.0);

  const ai = getGenAI();
  if (!ai) {
    res.status(503).json({
      error: 'GEMINI_API_KEY is not configured in settings. Local simulated engine will run seamlessly.',
      isSimulatedAvailable: true,
    });
    return;
  }

  // Setup Server-Sent Events with safe headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.flushHeaders?.();

  try {
    const stream = await ai.models.generateContentStream({
      model: 'gemini-3.8-flash',
      contents: sanitizedPrompt,
      config: {
        maxOutputTokens: safeTokens,
        temperature: safeTemp,
      },
    });

    let tokenIndex = 0;
    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        tokenIndex++;
        res.write(`data: ${JSON.stringify({
          token: text,
          index: tokenIndex,
          done: false,
        })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true, totalTokens: tokenIndex })}\n\n`);
    res.end();
  } catch (error: any) {
    // Sanitize error message to prevent accidental secret or system path leakage
    const isAuthError = error?.status === 401 || error?.status === 403;
    const safeErrorMsg = isAuthError
      ? 'Authentication error: please check your Gemini API key in Settings > Secrets.'
      : 'Model generation request failed. Falling back to simulated token engine.';

    res.write(`data: ${JSON.stringify({ error: safeErrorMsg, done: true })}\n\n`);
    res.end();
  }
});

async function startServer() {
  // Mount Vite middleware in development, static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Minimalist Agent Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
