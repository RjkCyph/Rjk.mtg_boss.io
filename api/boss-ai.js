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
Eres un generador de jefes para un modo Boss Planechase de Magic: The Gathering.
Convierte esta carta en un jefe con habilidades reales, equilibradas y temáticas.

DATOS:
Oracle: ${body.oracle}
Colores: ${body.colors.join(", ")}
Tipo: ${body.type}
Power/Toughness: ${body.power}/${body.toughness}
CMC: ${body.cmc}
Jugadores: ${body.players}

DEVUELVE SOLO JSON:
{
  "pasivas": ["...", "...", "..."],
  "turno": ["...", "...", "..."],
  "caos": ["...", "...", "..."],
  "fase50": "...",
  "faseFinal": "..."
}
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
        model: "qwen2.5:7b",
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

    try {
      const parsed = JSON.parse(content);
      return res.status(200).json(parsed);
    } catch (e) {
      console.error("JSON inválido:", content);
      return res.status(500).json({ error: "JSON inválido desde IA" });
    }

  } catch (err) {
    console.error("Backend error:", err);
    return res.status(500).json({ error: "Error generando habilidades IA" });
  }
}
