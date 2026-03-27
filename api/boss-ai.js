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
Eres un diseñador experto de modos de juego para Magic: The Gathering.
Tu tarea es transformar una criatura legendaria en un JEFE para el modo Boss Planechase.

Debes LEER y ANALIZAR el texto original de la criatura (oracle text) y generar habilidades de jefe que:
- Mantengan la identidad mecánica de la carta
- Conserven su estilo, temática y sinergias
- No copien literalmente el texto original
- Amplíen su poder para un combate multijugador
- Sean claras, equilibradas y jugables
- Encajen en un combate por fases contra un jefe

USA el oracle text como INSPIRACIÓN DIRECTA para las habilidades.

DATOS DE LA CARTA:
Oracle: {{oracle}}
Colores: {{colors}}
Tipo: {{type}}
Power/Toughness: {{power}}/{{toughness}}
CMC: {{cmc}}
Jugadores: {{players}}

DEVUELVE SOLO JSON ESTRICTO con este formato:

{
  "pasivas": [
    "Habilidad pasiva 1 basada en el oracle text",
    "Habilidad pasiva 2 basada en el oracle text",
    "Habilidad pasiva 3 basada en el oracle text"
  ],
  "turno": [
    "Habilidad que el jefe ejecuta automáticamente al inicio de su turno",
    "Otra habilidad de turno inspirada en el texto original",
    "Otra habilidad de turno"
  ],
  "caos": [
    "Efecto poderoso y temático cuando un jugador obtiene CAOS",
    "Otro efecto de caos",
    "Otro efecto de caos"
  ],
  "fase50": "Transformación o mejora cuando el jefe llega al 50% de vida, inspirada en su mecánica original",
  "faseFinal": "Ataque final o forma definitiva basada en la identidad de la carta"
}

NO añadas explicaciones.
NO añadas texto fuera del JSON.
NO repitas el texto original de la carta.
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
