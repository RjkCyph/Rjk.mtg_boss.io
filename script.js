/* ---------------------------------------------------------
   0. SLIDERS (CMC + Players)
--------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  const cmcMin = document.getElementById("minCMC");
  const cmcMax = document.getElementById("maxCMC");
  const players = document.getElementById("playerCount");

  const cmcMinValue = document.getElementById("cmcMinValue");
  const cmcMaxValue = document.getElementById("cmcMaxValue");
  const playersValue = document.getElementById("playersValue");

  // Defaults
  cmcMin.value = 4;
  cmcMax.value = 6;
  players.value = 4;

  cmcMinValue.textContent = cmcMin.value;
  cmcMaxValue.textContent = cmcMax.value;
  playersValue.textContent = players.value;

  cmcMin.oninput = () => {
    if (parseInt(cmcMin.value) > parseInt(cmcMax.value)) {
      cmcMax.value = cmcMin.value;
      cmcMaxValue.textContent = cmcMax.value;
    }
    cmcMinValue.textContent = cmcMin.value;
  };

  cmcMax.oninput = () => {
    if (parseInt(cmcMax.value) < parseInt(cmcMin.value)) {
      cmcMin.value = cmcMax.value;
      cmcMinValue.textContent = cmcMin.value;
    }
    cmcMaxValue.textContent = cmcMax.value;
  };

  players.oninput = () => {
    playersValue.textContent = players.value;
  };
});


/* ---------------------------------------------------------
   1. IA DEL JEFE (DeepSeek / OpenRouter)
--------------------------------------------------------- */

let lastGeneratedBosses = [];

async function generateBossAI(card) {
  const players = parseInt(document.getElementById("playerCount").value) || 1;

  const response = await fetch("https://rjk-mtg-boss-io.vercel.app/api/boss-ai", {
    method: "POST",
    body: JSON.stringify({
      oracle: card.oracle_text,
      colors: card.colors || [],
      type: card.type_line || "",
      power: card.power || "0",
      flavor_text: face.flavor_text || card.flavor_text || "",
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
  const e = Math.round((5 + card.toughness) * scale);

  const difficultyScore = card.cmc + card.keywords.length + card.toughness + card.power;
  let difficultyLabel = "Low";
  if (difficultyScore > 22) difficultyLabel = "High";
  else if (difficultyScore > 15) difficultyLabel = "Mid Level";

  return { hp, damage, e, difficultyScore, difficultyLabel };
}


/* ---------------------------------------------------------
   6. RENDER DEL JEFE
--------------------------------------------------------- */

function renderBoss(card, stats, aiAbilities) {
  const colorNames = { W: "White", U: "Blue", B: "Black", R: "Red", G: "Green" };
  const colors = card.colors.length ? card.colors.map(c => colorNames[c]).join(", ") : "Colorless";

  const abilities = card.keywords.length
    ? card.keywords.map(k => `<li>${k}</li>`).join("")
    : "<li>No tiene keywords relevantes</li>";

  let aiBlock = "";
  if (aiAbilities) {
    aiBlock = `
      <div class="bossAI">
        <strong>Generated Abilities:</strong>
        
        <h4>Passive</h4>
        <p>${aiAbilities.pasivas}</p>

        <h4>Turn</h4>
        <p>${aiAbilities.turno}</p>

        <h4>Chaos</h4>
        <p>${aiAbilities.caos}</p>

        <h4>25% Low Life</h4>
        <p>${aiAbilities.fase25}</p>

        <h4>Reward</h4>
        <p>${aiAbilities.reward}</p>
      </div>
    `;
  }

  return `
    <article class="bossCard">
      <img src="${card.image}" alt="${card.name}">

      <div class="bossDetails">
        <h2>${card.name}</h2>
        <p><strong>Colors:</strong> ${colors}</p>
        <p><strong>Types:</strong> ${card.types}</p>

        <div class="bossStats">
          <p><strong>❤️ Life:</strong> ${stats.hp}</p>
          <p><strong>⚔️ Damage:</strong> ${stats.damage}</p>
          <p><strong>Difficulty:</strong> ${stats.difficultyLabel} (Score: ${stats.difficultyScore})</p>
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
