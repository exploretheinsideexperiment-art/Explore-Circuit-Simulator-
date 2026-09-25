var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "10mb" }));
var aiClient = null;
function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  if (!aiClient) {
    aiClient = new import_genai.GoogleGenAI({ apiKey });
  }
  return aiClient;
}
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "Explore Circuit Simulator",
    version: "1.0.0",
    aiAvailable: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"),
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.post("/api/ai/assist", async (req, res) => {
  try {
    const { prompt, circuitState, currentCode, language, board } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }
    const ai = getAIClient();
    if (!ai) {
      return res.json({
        analysis: `[Explore AI Local Assistant]
I analyzed your circuit configuration for **${board || "Microcontroller"}**:
- Total components: ${circuitState?.components?.length || 0}
- Total wired connections: ${circuitState?.wires?.length || 0}

*Tip*: To enable full live Gemini AI circuit reasoning, ensure GEMINI_API_KEY is configured in your project settings. In the meantime, the offline simulator rules and compiler are 100% active!`,
        suggestions: [
          "Verify that digital pins match your pinMode declarations in code.",
          "Always use a 220\u03A9\u2013330\u03A9 current-limiting resistor with LEDs.",
          "Check that VCC (3.3V/5V) and GND rails are properly tied."
        ],
        suggestedCode: null,
        suggestedWires: null
      });
    }
    const systemInstruction = `You are "Explore AI", an expert electronics and embedded software engineer embedded inside "Explore Circuit Simulator".
Your job is to analyze the user's circuit and code, identify bugs, propose wire connections, generate working embedded C++ / Arduino / MicroPython code, and answer questions.

Circuit Context:
- Target Board: ${board || "ESP32 DevKit V1"}
- Language: ${language || "cpp"}
- Existing Components: ${JSON.stringify(circuitState?.components?.map((c) => ({ id: c.id, type: c.type, name: c.name, pins: c.pins })) || [])}
- Existing Wires: ${JSON.stringify(circuitState?.wires?.map((w) => ({ from: w.fromPinId, to: w.toPinId, color: w.color })) || [])}
- Existing Code:
\`\`\`
${currentCode || ""}
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
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.3
      }
    });
    const text = response.text || "";
    let parsed;
    try {
      const cleaned = text.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
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
  } catch (error) {
    console.error("Error in AI assistant route:", error);
    res.status(500).json({
      error: "Failed to process AI assistant request",
      details: error.message
    });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Explore Circuit Simulator server running on http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
//# sourceMappingURL=server.cjs.map
