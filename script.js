let lastGeneratedBosses = [];

async function fetchLegendary(colorFilter = "") {
  let query = "is:legendary type:creature";
  if (colorFilter) query += ` c:${colorFilter}`;

  const url = `https://api.scryfall.com/cards/random?q=${encodeURIComponent(query)}`;
  const response = await fetch(url);
  return await response.json();
}

function extractCardData(card) {
  const face = card.card_faces ? card.card_faces[0] : card;

  return {
    name: card.name,
    colors: card.colors || [],
    cmc: card.cmc || 0,
    types: card.type_line || "",
    oracle_text: face.oracle_text || "",
    power: parseInt(face.power) || 0,
    toughness: parseInt(face.toughness) || 0,
    keywords: card.keywords || [],
    image: face.image_uris?.normal || card.image_uris?.normal || "",
    scryfall_uri: card.scryfall_uri
  };
}

function computeStats(card) {
  const hp = 20 + card.cmc * 5 + card.toughness * 2;
  const damage = card.power + Math.floor(card.cmc / 2);
  const defense = 5 + card.toughness;

  const difficultyScore = card.cmc + card.keywords.length + card.colors.length * 2;
  let difficultyLabel = "Mini-jefe";
  if (difficultyScore > 12) difficultyLabel = "Jefe final";
  else if (difficultyScore > 7) difficultyLabel = "Jefe estándar";

  return { hp, damage, defense, difficultyScore, difficultyLabel };
}

function renderBoss(card, stats) {
  const colorNames = { W: "Blanco", U: "Azul", B: "Negro", R: "Rojo", G: "Verde" };
  const colors = card.colors.length ? card.colors.map(c => colorNames[c]).join(", ") : "Incoloro";

  return `
    <div class="bossCard">
      <img src="${card.image}" alt="Carta">
      <h2>${card.name}</h2>
      <p><strong>Colores:</strong> ${colors}</p>
      <p><strong>Tipos:</strong> ${card.types}</p>
      <p><strong>CMC:</strong> ${card.cmc}</p>
      <p><strong>Stats:</strong> ❤️ ${stats.hp} | ⚔️ ${stats.damage} | 🛡️ ${stats.defense}</p>
      <p><strong>Dificultad:</strong> ${stats.difficultyLabel}</p>
      <pre>${card.oracle_text}</pre>
      <a href="${card.scryfall_uri}" target="_blank">Ver en Scryfall</a>
    </div>
  `;
}

async function generateBoss() {
  const color = document.getElementById("colorFilter").value;
  const raw = await fetchLegendary(color);
  const card = extractCardData(raw);
  const stats = computeStats(card);

  lastGeneratedBosses = [ { card, stats } ];

  document.getElementById("bossContainer").innerHTML = renderBoss(card, stats);
}

async function generateDungeon() {
  const color = document.getElementById("colorFilter").value;
  const bosses = [];

  for (let i = 0; i < 3; i++) {
    const raw = await fetchLegendary(color);
    const card = extractCardData(raw);
    const stats = computeStats(card);
    bosses.push({ card, stats });
  }

  lastGeneratedBosses = bosses;

  document.getElementById("bossContainer").innerHTML =
    bosses.map(b => renderBoss(b.card, b.stats)).join("");
}

function exportJSON() {
  const data = JSON.stringify(lastGeneratedBosses, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "bosses.json";
  a.click();
}
