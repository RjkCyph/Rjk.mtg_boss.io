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

=== BOSS NATURE & RESTRICTIONS ===
The boss is NOT a player. It functions as an enhanced creature with automated abilities.

The boss CANNOT:
- Attack during combat under any circumstance
- Cast spells, activate mana abilities, or draw cards or mill cards on his own. 
- Gain combat modifiers that explicitly enhance attacking (haste, trample, double strike, myriad, exalted, etc.)
- Make choices that only players can make (discarding, paying costs, choosing modes, etc.)
- Use abilities that require resources it cannot have (mana, hand, library, graveyard unless explicitly granted)

The boss CAN:
- Block when attacked
- Gain evergreen defensive or strategic keywords (flying, reach, vigilance, hexproof, indestructible, ward, menace, deathtouch, lifelink)
- Use static, triggered, and automatic abilities
- Scale effects based on multiplayer dynamics
- Transform or evolve at life thresholds
- Produce tokens, counters, or battlefield effects
- Use abilities that emulate its original card identity
- Affect players libraries somehow, forcing the players to draw or mill for example or execute commands on their creatures or permaments

=== DESIGN REQUIREMENTS ===
You must READ and ANALYZE the creature's original oracle text and generate boss abilities that:
- Maintain the mechanical identity of the card
- Preserve its style, theme, and synergies
- Do NOT copy the original text literally
- Scale its power for a multiplayer boss fight
- Are clear, balanced, and playable
- Fit a multi-phase boss encounter
- Include a REWARD that scales with boss difficulty
- Respect all boss restrictions listed above

Use the oracle text as DIRECT INSPIRATION for the abilities.

=== CARD DATA ===
Oracle: {{oracle}}
Colors: {{colors}}
Type: {{type}}
Power/Toughness: {{power}}/{{toughness}}
CMC: {{cmc}}
Players: {{players}}

=== BOSS DIFFICULTY RULE ===
Evaluate difficulty using this formula:
difficultyScore = CMC + number_of_keywords + toughness + power

=== REWARD RULE ===
Generate ONE reward based on difficulty:
- Minor Boss → Minor reward (small tempo, card selection, small tokens, small buffs)
- Major Boss → Major reward (mana discount, recursion, strong tokens, card advantage, or token copies of the boss itself with a handicap and a condition to disappear or sacrifice itself after some turns)
- Mythic Boss → Mythic reward (emblems, permanent upgrades, powerful effects)

The reward MUST be thematic and significant to the creature’s identity and MUST go to players who dealt significant damage to the boss. Creating a 1/1 token is not a significant reward.

=== OUTPUT FORMAT (STRICT JSON ONLY) ===

{
  "pasivas": "One single bullet of unique passive ability based on the oracle text with a clear and detailed effect on the players or the boss itself. Avoid the use of -you- when referring to the object of the effect, instead clearly indicate either the effect takes place on the boss or on the current player",
  "turno": "One single bullet unique and detailed ability the boss performs automatically at the start of each player turn. Avoid the use of -you- when referring to the object of the effect, instead clearly indicate either the effect takes place on the boss or on the current player",
  "caos": "One single bullet powerful thematic effect when a player rolls CHAOS that usually affects all players at the same time",
  "fase25": "Transformation or upgrade when the boss reaches 25% life or less making the boss slightly more dangerous",
  "reward": "One reward appropriate to the difficulty tier and inspired by the creature's theme. Specify clearly that the reward goes to those players who managed to deal damage to the boss in a significant way",
  "quote": "A dramatic, original boss quote inspired by the card's flavor text, or empty string if none exists"
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
