let lastGeneratedBosses = [];

/* ---------------------------------------------------------
   1. IA DEL JEFE (DeepSeek)
--------------------------------------------------------- */

async function generateBossAI(card) {
  const players = parseInt(document.getElementById("playerCount").value) || 1;

  const response = await fetch("/api/boss-ai", {
    method: "POST",
    body: JSON.stringify({
      oracle: card.oracle_text,
      colors: card.colors || [],
      type: card.type_line || "",
      power: card.power || "0",
      toughness: card.toughness || "0",
      cmc: card.cmc || 0,
      players
    })
  });

  if (!response.ok) {
    console.error("Error IA:", response.status);
    return null;
  }

  return await response.json();
}

/* ---------------------------------------------------------
   2. SCRYFALL
--------------------------------------------------------- */

async function fetchLegendary(colorFilter = "") {
  let query = "is:legendary type:creature r>=r";

  if (colorFilter) query += ` c:${colorFilter}`;

  const minCMC = document.getElementById("minCMC").value;
  const maxCMC = document.getElementById("maxCMC").value;

  if (minCMC !== "") query += ` cmc>=${minCMC}`;
  if (maxCMC !== "") query += ` cmc<=${maxCMC}`;

  const url = `https://api.scryfall.com/cards/random?q=${encodeURIComponent(query)}`;
  console.log("Fetching:", url);

  const response = await fetch(url);
  if (!response.ok) throw new Error("Error al llamar a Scryfall: " + response.status);

  return await response.json();
}

/* ---------------------------------------------------------
   3. EXTRAER DATOS
--------------------------------------------------------- */

function extractCardData(card) {
  const face = card.card_faces ? card.card_faces[0] : card;

  let image = "";
  if (face.image_uris?.normal) image = face.image_uris.normal;
  else if (card.image_uris?.normal) image = card.image_uris.normal;

  return {
    name: card.name,
    colors: card.colors || [],
    cmc: card.cmc || 0,
    types: card.type_line || "",
    oracle_text: face.oracle_text || "",
    power: parseInt(face.power) || 0,
    toughness: parseInt(face.toughness) || 0,
    keywords: card.keywords || [],
    image,
    scryfall_uri: card.scryfall_uri
  };
}

/* ---------------------------------------------------------
   4. STATS DEL JEFE
--------------------------------------------------------- */

function computeStats(card) {
  const players = parseInt(document.getElementById("playerCount").value) || 1;
  const scale = 1 + (players - 1) * 0.35;

  const hp = Math.round((card.cmc * 2 + card.toughness * 2) * scale);
  const damage = Math.round(card.power * scale);
  const defense = Math.round((5 + card.toughness) * scale);

  const difficultyScore = card.cmc + card.keywords.length + card.colors.length * 2;
  let difficultyLabel = "Mini-jefe";
  if (difficultyScore > 12) difficultyLabel = "Jefe final";
  else if (difficultyScore > 7) difficultyLabel = "Jefe estándar";

  return { hp, damage, defense, difficultyScore, difficultyLabel };
}

/* ---------------------------------------------------------
   5. IDENTIDAD POR COLOR (SE MANTIENE)
   ⚠️ Estas NO son habilidades reales del jefe.
   ⚠️ Son solo identidad temática.
--------------------------------------------------------- */

/* ---------------------------------------------------------
   6. RENDER DEL JEFE
--------------------------------------------------------- */

function renderBoss(card, stats, aiAbilities) {
  const colorNames = { W: "Blanco", U: "Azul", B: "Negro", R: "Rojo", G: "Verde" };
  const colors = card.colors.length ? card.colors.map(c => colorNames[c]).join(", ") : "Incoloro";

  const abilities = card.keywords.length
    ? card.keywords.map(k => `<li>${k}</li>`).join("")
    : "<li>No tiene keywords relevantes</li>";

  let aiBlock = "";
  if (aiAbilities) {
    aiBlock = `
      <div class="bossAI">
        <strong>Habilidades generadas por IA:</strong>

        <h4>Pasivas</h4>
        <ul>${aiAbilities.pasivas.map(a => `<li>${a}</li>`).join("")}</ul>

        <h4>Turno</h4>
        <ul>${aiAbilities.turno.map(a => `<li>${a}</li>`).join("")}</ul>

        <h4>Caos</h4>
        <ul>${aiAbilities.caos.map(a => `<li>${a}</li>`).join("")}</ul>

        <h4>50% Vida</h4>
        <p>${aiAbilities.fase50}</p>

        <h4>Fase Final</h4>
        <p>${aiAbilities.faseFinal}</p>
      </div>
    `;
  }

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

        ${aiBlock}

        <p style="margin-top:10px;">
          <a href="${card.scryfall_uri}" target="_blank">Ver carta en Scryfall</a>
        </p>
      </div>
    </article>
  `;
}

/* ---------------------------------------------------------
   7. BOTONES
--------------------------------------------------------- */

window.generateBoss = async function () {
  try {
    const color = document.getElementById("colorFilter").value;
    const container = document.getElementById("bossContainer");
    container.innerHTML = "<p>Generando jefe...</p>";

    const raw = await fetchLegendary(color);
    const card = extractCardData(raw);
    const stats = computeStats(card);

    const aiAbilities = await generateBossAI(card);

    lastGeneratedBosses = [{ card, stats, aiAbilities }];

    container.innerHTML = renderBoss(card, stats, aiAbilities);

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
      const aiAbilities = await generateBossAI(card);

      bosses.push({ card, stats, aiAbilities });
    }

    lastGeneratedBosses = bosses;

    container.innerHTML = bosses
      .map(b => renderBoss(b.card, b.stats, b.aiAbilities))
      .join("");

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

/* ---------------------------------------------------------
   8. TECLA ESPACIO
--------------------------------------------------------- */

window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    generateBoss();
  }
});
