// Guardamos aquí los últimos jefes generados para el export JSON
let lastGeneratedBosses = [];

// --- 1. Fetch a Scryfall ---

async function fetchLegendary(colorFilter = "") {
  let query = "is:legendary type:creature";
  if (colorFilter) query += ` c:${colorFilter}`;

  const url = `https://api.scryfall.com/cards/random?q=${encodeURIComponent(query)}`;
  console.log("Fetching:", url);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Error al llamar a Scryfall: " + response.status);
  }
  return await response.json();
}

// --- 2. Extraer datos útiles de la carta ---

function extractCardData(card) {
  const face = card.card_faces ? card.card_faces[0] : card;

  // Imagen: probamos varias rutas sin optional chaining
  let image = "";
  if (face.image_uris && face.image_uris.normal) {
    image = face.image_uris.normal;
  } else if (card.image_uris && card.image_uris.normal) {
    image = card.image_uris.normal;
  }

  return {
    name: card.name,
    colors: card.colors || [],
    cmc: card.cmc || 0,
    types: card.type_line || "",
    oracle_text: face.oracle_text || "",
    power: parseInt(face.power) || 0,
    toughness: parseInt(face.toughness) || 0,
    keywords: card.keywords || [],
    image: image,
    scryfall_uri: card.scryfall_uri
  };
}

// --- 3. Cálculo de stats de jefe ---

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

// --- 4. Render de una carta de jefe ---

function renderBoss(card, stats) {
  const colorNames = { W: "Blanco", U: "Azul", B: "Negro", R: "Rojo", G: "Verde" };
  const colors = card.colors.length ? card.colors.map(c => colorNames[c]).join(", ") : "Incoloro";

  const imgHtml = card.image
    ? `<img src="${card.image}" alt="Carta de ${card.name}">`
    : "";

  return `
    <div class="bossCard">
      ${imgHtml}
      <h2>${card.name}</h2>
      <p><strong>Colores:</strong> ${colors}</p>
      <p><strong>Tipos:</strong> ${card.types}</p>
      <p><strong>CMC:</strong> ${card.cmc}</p>
      <p><strong>Stats:</strong> ❤️ ${stats.hp} | ⚔️ ${stats.damage} | 🛡️ ${stats.defense}</p>
      <p><strong>Dificultad:</strong> ${stats.difficultyLabel} (Score: ${stats.difficultyScore})</p>
      <pre>${card.oracle_text}</pre>
      <a href="${card.scryfall_uri}" target="_blank">Ver en Scryfall</a>
    </div>
  `;
}

// --- 5. Funciones públicas (las colgamos de window) ---

window.generateBoss = async function () {
  try {
    const color = document.getElementById("colorFilter").value;
    document.getElementById("bossContainer").innerHTML = "<p>Generando jefe...</p>";

    const raw = await fetchLegendary(color);
    const card = extractCardData(raw);
    const stats = computeStats(card);

    lastGeneratedBosses = [{ card, stats }];

    document.getElementById("bossContainer").innerHTML = renderBoss(card, stats);
  } catch (err) {
    console.error(err);
    document.getElementById("bossContainer").innerHTML =
      "<p>Error generando jefe. Mira la consola del navegador.</p>";
  }
};

window.generateDungeon = async function () {
  try {
    const color = document.getElementById("colorFilter").value;
    document.getElementById("bossContainer").innerHTML = "<p>Generando mazmorra...</p>";

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
  } catch (err) {
    console.error(err);
    document.getElementById("bossContainer").innerHTML =
      "<p>Error generando mazmorra. Mira la consola del navegador.</p>";
  }
};

window.exportJSON = function () {
  if (!lastGeneratedBosses.length) {
    alert("Primero genera al menos un jefe.");
    return;
  }

  const data = JSON.stringify(lastGeneratedBosses, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "bosses.json";
  a.click();

  URL.revokeObjectURL(url);
};
