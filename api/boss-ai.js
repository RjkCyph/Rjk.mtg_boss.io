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
- Include a REWARD that scales with boss difficulty

Use the oracle text as DIRECT INSPIRATION for the abilities.

CARD DATA:
Oracle: {{oracle}}
Colors: {{colors}}
Type: {{type}}
Power/Toughness: {{power}}/{{toughness}}
CMC: {{cmc}}
Players: {{players}}

BOSS DIFFICULTY RULE:
Evaluate difficulty using this formula:
difficultyScore = CMC + number_of_keywords + (number_of_colors × 2)

Difficulty tiers:
- 0–7  → Minor Boss
- 8–12 → Major Boss
- 13+  → Mythic Boss

REWARD RULE:
Generate ONE reward based on difficulty:
- Minor Boss → Minor reward (small tempo, card selection, small tokens, small buffs)
- Major Boss → Major reward (mana discount, recursion, strong tokens, card advantage)
- Mythic Boss → Mythic reward (emblems, permanent upgrades, powerful effects)

The reward MUST be thematic to the creature’s identity.

RETURN ONLY STRICT JSON in this format:

{
  "pasivas": "One single bullet of unique passive ability based on the oracle text",
  "turno":  "One single bullet unique ability the boss performs automatically at the start of each player turn",
  "caos": "One single bullet powerful thematic effect when a player rolls CHAOS",
  "fase25": "Transformation or upgrade when the boss reaches 25% life or less",
  "reward": "One reward appropriate to the difficulty tier and inspired by the creature's theme"
}

Do NOT add explanations.
Do NOT add text outside the JSON.
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
