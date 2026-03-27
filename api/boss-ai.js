export default async function handler(req, res) {
  try {
    const { oracle, colors, type, power, toughness, cmc, players } = JSON.parse(req.body);

    const prompt = `
Eres un generador de jefes para un modo Boss Planechase de Magic: The Gathering.
Convierte esta carta en un jefe con habilidades reales, equilibradas y temáticas.

DATOS:
Oracle: ${oracle}
Colores: ${colors.join(", ")}
Tipo: ${type}
Power/Toughness: ${power}/${toughness}
CMC: ${cmc}
Jugadores: ${players}

DEVUELVE EN JSON ESTRICTO:
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
    const content = data.choices[0].message.content;

    res.status(200).json(JSON.parse(content));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error generando habilidades IA" });
  }
}
