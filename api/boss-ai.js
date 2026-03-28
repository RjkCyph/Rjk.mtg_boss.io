export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();


  const prompt = `
  You are an expert game mode designer for Magic: The Gathering.
  Your task is to transform a legendary creature into a BOSS for the Boss Planechase mode.
  
  === BOSS NATURE & RESTRICTIONS ===
  The boss is NOT a player. It functions as an enhanced creature with automated abilities.
  
  The boss CANNOT:
  - Attack during combat under any circumstance
  - Cast spells, activate mana abilities, or draw cards or mill cards on its own
  - Gain combat modifiers that explicitly enhance attacking (haste, trample, double strike, myriad, exalted, etc.)
  - Make choices that only players can make (discarding, paying costs, choosing modes, etc.)
  - Use abilities that require resources it cannot have (mana, hand, library, graveyard unless explicitly granted)
  
  The boss CAN:
  - Block when attacked
  - Gain evergreen defensive or strategic keywords (flying, reach, vigilance, hexproof, indestructible, ward, menace, deathtouch, lifelink)
  - Use static, triggered, and automatic abilities
  - Scale effects based on multiplayer dynamics
  - Produce tokens, counters, or battlefield effects
  - Emulate its original card identity through abilities
  - Affect players’ libraries or permanents (forcing draws, mills, sacrifices, tapping, etc.)
  
  === ABILITY CLARITY RULES ===
  All abilities MUST be mechanically clear and fully quantified. Avoid vague or narrative effects.
  
  PASSIVE ABILITIES:
  - Always active
  - Must specify exact numerical effects
  - Must clearly state whether the effect applies to the boss or to players
  
  TURN ABILITIES:
  - Must trigger at the beginning of EACH PLAYER’S UPKEEP
  - Must specify exact values, targets, and outcomes
  - Must NOT be vague global events (storms, decay, etc.)
  
  CHAOS ABILITIES:
  - One single powerful effect
  - Must affect ALL players unless thematically justified
  - Must be fully quantified
  
  === FLAVOR QUOTE RULE ===
  If the card contains italicized flavor text:
  - Generate an ORIGINAL boss quote inspired by it
  - Must show personality, intent, or threat
  - Must NOT copy or paraphrase the original flavor text
  
  If no flavor text exists:
  - Return an empty string
  
  === CARD DATA ===
  Oracle: {{oracle}}
  Colors: {{colors}}
  Type: {{type}}
  Power/Toughness: {{power}}/{{toughness}}
  CMC: {{cmc}}
  Players: {{players}}
  Flavor Text: {{flavor_text}}
  
  === BOSS DIFFICULTY RULE ===
  Evaluate difficulty using this formula:
  difficultyScore = CMC + number_of_keywords + toughness + power
  
  === REWARD RULE ===
  Generate ONE reward based on boss rank:
  - Minor Boss → Minor reward (small tempo, card selection, small tokens, small buffs)
  - Major Boss → Major reward (mana discount, recursion, strong tokens, card advantage, or temporary token copies of the boss with a drawback)
  - Mythic Boss → Mythic reward (emblems, permanent upgrades, powerful effects)
  
  The reward MUST:
  - Be thematic to the creature’s identity
  - Be significant (no 1/1 tokens)
  - Clearly state that it is granted ONLY to players who dealt significant damage to the boss
  
  === OUTPUT FORMAT (STRICT JSON ONLY) ===
  
  {
    "pasivas": "One quantified passive ability with a clear effect on players or the boss",
    "turno": "One quantified ability that triggers at the beginning of each player's upkeep",
    "caos": "One quantified effect that triggers when a player rolls CHAOS",
    "reward": "One difficulty-scaled reward granted to players who dealt significant damage to the boss",
    "quote": "A dramatic, original boss quote inspired by the card's flavor text, or empty string if none exists"
  }
  
  Do NOT add explanations.
  Do NOT add text outside the JSON.
  `;

  try {
    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body);
    
    const filledPrompt = prompt
      .replace("{{oracle}}", body.oracle || "")
      .replace("{{colors}}", Array.isArray(body.colors) ? body.colors.join(", ") : (body.colors || ""))
      .replace("{{type}}", body.type || "")
      .replace("{{power}}", String(body.power ?? "0"))
      .replace("{{toughness}}", String(body.toughness ?? "0"))
      .replace("{{cmc}}", String(body.cmc ?? "0"))
      .replace("{{players}}", String(body.players ?? "1"))
      .replace("{{flavor_text}}", body.flavor_text || "");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [{ role: "user", content: filledPrompt }],
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
