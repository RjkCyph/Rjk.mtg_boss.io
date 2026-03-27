export default async function handler(req, res) {
  try {
    const body = JSON.parse(req.body);

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

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (!data.choices || !data.choices[0]) {
      console.error("DeepSeek error:", data);
      return res.status(500).json({ error: "Respuesta inválida de DeepSeek" });
    }

    const content = data.choices[0].message.content.trim();

    try {
      const parsed = JSON.parse(content);
      return res.status(200).json(parsed);
    } catch (e) {
      console.error("JSON inválido recibido:", content);
      return res.status(500).json({ error: "JSON inválido desde IA" });
    }

  } catch (err) {
    console.error("Backend error:", err);
    return res.status(500).json({ error: "Error generando habilidades IA" });
  }
}
