export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body);

    const prompt = `
You are an expert game mode designer for Magic: The Gathering.
Your task is to transform a legendary creature into a BOSS for the Boss Planechase mode.

You must READ and ANALYZE the creature's original oracle text and generate boss abilities that:
- Maintain the mechanical identity of the card
- Preserve its style, theme, and synergies
- Do NOT copy the original text literally
- Scale its power for a multiplayer boss fight
- Are clear, balanced, and playable
- Fit a multi-phase boss encounter

Use the oracle text as DIRECT INSPIRATION for the abilities.

CARD DATA:
Oracle: {{oracle}}
Colors: {{colors}}
Type: {{type}}
Power/Toughness: {{power}}/{{toughness}}
CMC: {{cmc}}
Players: {{players}}

RETURN ONLY STRICT JSON in this format:

{
  "pasivas": [
    Passive ability 1 based on the oracle text"
  ],
  "turno": [
    "Ability the boss performs automatically at the start of its turn inspired by the original text"
  ],
  "caos": [
    "Powerful thematic effect when a player rolls CHAOS"
  ],
  "fase50": "Transformation or upgrade when the boss reaches 25% life, inspired by its original mechanics"
}

Do NOT add explanations.
Do NOT add text outside the JSON.
Do NOT repeat the original card text.
`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        //model: "deepseek-r1:free",
        // model: "llama3-8b",
        model: "openrouter/free",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      })
    });

    const data = await response.json();
    console.log("OpenRouter raw:", data);

    if (!data.choices || !data.choices[0]) {
      console.error("OpenRouter error:", data);
      return res.status(500).json({ error: "Respuesta inválida de OpenRouter" });
    }

    const content = data.choices[0].message.content.trim();
    console.log("OpenRouter content:", content);
    
    // Strip code fences
    let clean = content
      .replace(/^```json/i, "")
      .replace(/^```/, "")
      .replace(/```$/, "")
      .trim();
    
    try {
      const parsed = JSON.parse(clean);
      return res.status(200).json(parsed);
    } catch (e) {
      console.error("Invalid JSON:", clean);
      return res.status(500).json({ error: "Invalid JSON from AI" });
}

  } catch (err) {
    console.error("Backend error:", err);
    return res.status(500).json({ error: "Error generando habilidades IA" });
  }
}
