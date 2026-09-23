import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy Google Gen AI client helper
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Explore Circuit Simulator',
    version: '1.0.0',
    aiAvailable: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    timestamp: new Date().toISOString()
  });
});

// AI Electronics Assistant endpoint (Explore AI)
app.post('/api/ai/assist', async (req, res) => {
  try {
    const { prompt, circuitState, currentCode, language, board } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ai = getAIClient();
    if (!ai) {
      // Graceful fallback response when API key is not yet configured
      return res.json({
        analysis: `[Explore AI Local Assistant]
I analyzed your circuit configuration for **${board || 'Microcontroller'}**:
- Total components: ${circuitState?.components?.length || 0}
- Total wired connections: ${circuitState?.wires?.length || 0}

*Tip*: To enable full live Gemini AI circuit reasoning, ensure GEMINI_API_KEY is configured in your project settings. In the meantime, the offline simulator rules and compiler are 100% active!`,
        suggestions: [
          'Verify that digital pins match your pinMode declarations in code.',
          'Always use a 220Ω–330Ω current-limiting resistor with LEDs.',
          'Check that VCC (3.3V/5V) and GND rails are properly tied.'
        ],
        suggestedCode: null,
        suggestedWires: null
      });
    }

    const systemInstruction = `You are "Explore AI", an expert electronics and embedded software engineer embedded inside "Explore Circuit Simulator".
Your job is to analyze the user's circuit and code, identify bugs, propose wire connections, generate working embedded C++ / Arduino / MicroPython code, and answer questions.

Circuit Context:
- Target Board: ${board || 'ESP32 DevKit V1'}
- Language: ${language || 'cpp'}
- Existing Components: ${JSON.stringify(circuitState?.components?.map((c: any) => ({ id: c.id, type: c.type, name: c.name, pins: c.pins })) || [])}
- Existing Wires: ${JSON.stringify(circuitState?.wires?.map((w: any) => ({ from: w.fromPinId, to: w.toPinId, color: w.color })) || [])}
- Existing Code:
\`\`\`
${currentCode || ''}
\`\`\`

Respond concisely and professionally in structured JSON with:
{
  "analysis": "Markdown explanation or answer to user prompt",
  "suggestions": ["list of actionable bullet points"],
  "suggestedCode": "full updated or replacement code snippet if code was requested or needed, else null",
  "suggestedWires": [ optional list of new wires { "from": "componentId:pinName", "to": "componentId:pinName", "color": "#hex" } if wiring was requested, else null ]
}
Return ONLY valid raw JSON with no wrapping markdown ticks if possible, or json block.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.3,
      }
    });

    const text = response.text || '';
    let parsed: any;
    try {
      const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        analysis: text,
        suggestions: [],
        suggestedCode: null,
        suggestedWires: null
      };
    }

    res.json(parsed);
  } catch (error: any) {
    console.error('Error in AI assistant route:', error);
    res.status(500).json({
      error: 'Failed to process AI assistant request',
      details: error.message
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
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
    console.log(`Explore Circuit Simulator server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
