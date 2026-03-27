let lastGeneratedBosses = [];

// 1. FETCH SCRYFALL

async function fetchLegendary(colorFilter = "") {
  let query = "is:legendary type:creature";
  if (colorFilter) query += ` c:${colorFilter}`;

  const url = `https://api.scryfall.com/cards/random?q=${encodeURIComponent(query)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Error al llamar a Scryfall: " + response.status);
  }
  return await response.json();
}

// 2. EXTRAER DATOS

function extractCardData(card) {
  const face = card.card_faces ? card.card_faces[0] : card;

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

// 3. STATS JEFE

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

// 4. FASES

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

// 5. RENDER

function renderBoss(card, stats) {
  const colorNames = { W: "Blanco", U: "Azul", B: "Negro", R: "Rojo", G: "Verde" };
  const colors = card.colors.length ? card.colors.map(c => colorNames[c]).join(", ") : "Incoloro";

  const abilities = card.keywords.length
    ? card.keywords.map(k => `<li>${k}</li>`).join("")
    : "<li>No tiene keywords relevantes</li>";

  const phases = phasesFromColors(card.colors)
    .map(p => `<li>${p}</li>`)
    .join("");

  return `
    <article class="bossCard">
      <img src="${card.image}" alt="${card.name}">

      <div class="bossDetails">
        <h2>${card.name}</h2>
        <p><strong>Colores:</strong> ${colors}</p>
        <p><strong>Tipos:</strong> ${card.types}</p>

        <div class="bossStats">
          <p><strong>❤️ Vida:</strong> ${stats.hp}</p>
          <p><strong>⚔️ Daño:</strong> ${stats.damage}</p>
          <p><strong>🛡️ Defensa:</strong> ${stats.defense}</p>
          <p><strong>Dificultad:</strong> ${stats.difficultyLabel} (Score: ${stats.difficultyScore})</p>
        </div>

        <div class="bossAbilities">
          <strong>Habilidades:</strong>
          <ul>${abilities}</ul>
        </div>

        <div class="bossPhases">
          <strong>Fases del combate:</strong>
          <ul>${phases}</ul>
        </div>

        <p style="margin-top:10px;">
          <a href="${card.scryfall_uri}" target="_blank">Ver carta en Scryfall</a>
        </p>
      </div>
    </article>
  `;
}

// 6. BOTONES

window.generateBoss = async function () {
  try {
    const color = document.getElementById("colorFilter").value;
    const container = document.getElementById("bossContainer");
    container.innerHTML = "<p>Generando jefe...</p>";

    const raw = await fetchLegendary(color);
    const card = extractCardData(raw);
    const stats = computeStats(card);

    lastGeneratedBosses = [{ card, stats }];

    container.innerHTML = renderBoss(card, stats);
  } catch (err) {
    console.error(err);
    document.getElementById("bossContainer").innerHTML =
      "<p>Error generando jefe. Mira la consola del navegador.</p>";
  }
};

window.generateDungeon = async function () {
  try {
    const color = document.getElementById("colorFilter").value;
    const container = document.getElementById("bossContainer");
    container.innerHTML = "<p>Generando mazmorra...</p>";

    const bosses = [];
    for (let i = 0; i < 3; i++) {
      const raw = await fetchLegendary(color);
      const card = extractCardData(raw);
      const stats = computeStats(card);
      bosses.push({ card, stats });
    }

    lastGeneratedBosses = bosses;

    container.innerHTML = bosses.map(b => renderBoss(b.card, b.stats)).join("");
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

// 7. TECLA ESPACIO PARA GENERAR

window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    generateBoss();
  }
});
