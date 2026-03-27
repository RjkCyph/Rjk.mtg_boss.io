async function getRandomLegendaryCreature() {
  const url = "https://api.scryfall.com/cards/random?q=is%3Alegendary+type%3Acreature";
  const response = await fetch(url);
  const card = await response.json();

  let face = card.card_faces ? card.card_faces[0] : card;

  return {
    name: card.name,
    colors: card.colors || [],
    cmc: card.cmc || 0,
    types: card.type_line || "",
    oracle_text: face.oracle_text || "",
    power: parseInt(face.power) || 0,
    toughness: parseInt(face.toughness) || 0,
    keywords: card.keywords || [],
    scryfall_uri: card.scryfall_uri
  };
}

function computeBossStats(card) {
  const hp = 20 + (card.cmc * 5) + (card.toughness * 2);
  const damage = card.power + Math.floor(card.cmc / 2);
  const defense = 5 + card.toughness;

  const difficultyScore = card.cmc + card.keywords.length + (card.colors.length * 2);
  let difficultyLabel = "Mini-jefe";
  if (difficultyScore > 12) difficultyLabel = "Jefe final";
  else if (difficultyScore > 7) difficultyLabel = "Jefe estándar";

  return { hp, damage, defense, difficultyScore, difficultyLabel };
}

const KEYWORD_TO_ABILITY = {
  "Flying": "Solo puede ser golpeado por ataques a distancia o mágicos.",
  "First strike": "Ataca siempre antes que los jugadores.",
  "Double strike": "Realiza dos ataques por ronda.",
  "Deathtouch": "Si impacta, deja al jugador a 1 de vida salvo tirada de salvación.",
  "Trample": "El daño excedente golpea a todos los jugadores.",
  "Hexproof": "No puede ser objetivo directo; solo daño en área.",
  "Indestructible": "No puede bajar de 1 vida hasta cumplir una condición.",
  "Lifelink": "Se cura una cantidad igual al daño infligido.",
  "Haste": "Actúa dos veces en la primera ronda.",
  "Vigilance": "Puede contraatacar incluso después de atacar.",
  "Menace": "Requiere dos jugadores/aliados para enfrentarlo.",
  "Reach": "Puede golpear a objetivos voladores.",
  "Ward": "El primer ataque contra él falla si no se paga un coste adicional."
};

function translateAbilities(keywords) {
  return keywords
    .filter(k => KEYWORD_TO_ABILITY[k])
    .map(k => `${k}: ${KEYWORD_TO_ABILITY[k]}`);
}

function phasesFromColors(colors) {
  const phases = [];
  if (colors.includes("R")) phases.push("Rojo – Enfurecimiento: duplica su daño al 50% de vida.");
  if (colors.includes("U")) phases.push("Azul – Control: copia habilidades o niega acciones.");
  if (colors.includes("B")) phases.push("Negro – Nigromancia: invoca esbirros y roba vida.");
  if (colors.includes("W")) phases.push("Blanco – Juicio: castiga acciones repetidas y crea escudos.");
  if (colors.includes("G")) phases.push("Verde – Crecimiento: aumenta fuerza e invoca bestias.");
  if (phases.length === 0) phases.push("Incoloro – Caos: patrones impredecibles cada ronda.");
  return phases;
}

function formatBoss(card, stats) {
  const colorNames = {
    W: "Blanco", U: "Azul", B: "Negro", R: "Rojo", G: "Verde"
  };

  const colors = card.colors.length
    ? card.colors.map(c => colorNames[c]).join(", ")
    : "Incoloro";

  const abilities = translateAbilities(card.keywords);
  const phases = phasesFromColors(card.colors);

  return `
=== JEFE LEGENDARIO: ${card.name} ===
Colores: ${colors}
Tipos: ${card.types}
CMC: ${card.cmc} | Fuerza/Resistencia original: ${card.power}/${card.toughness}

VIDA: ${stats.hp}
DAÑO BASE: ${stats.damage}
DEFENSA: ${stats.defense}
DIFICULTAD: ${stats.difficultyLabel} (Score: ${stats.difficultyScore})

Texto original de la carta:
${card.oracle_text}

Habilidades de jefe:
${abilities.length ? abilities.map(a => "- " + a).join("\n") : "No tiene keywords relevantes."}

Fases del combate:
${phases.map(p => "- " + p).join("\n")}

Más info: ${card.scryfall_uri}
`;
}

async function generateBoss() {
  document.getElementById("boss").textContent = "Generando...";
  const card = await getRandomLegendaryCreature();
  const stats = computeBossStats(card);
  const text = formatBoss(card, stats);
  document.getElementById("boss").textContent = text;
}
