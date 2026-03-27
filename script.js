let lastGeneratedBosses = [];

// 1. FETCH SCRYFALL

async function fetchLegendary(colorFilter = "") {
  let query = "is:legendary type:creature r>=r";

  // Filtro por color
  if (colorFilter) query += ` c:${colorFilter}`;

  // Filtros de CMC
  const minCMC = document.getElementById("minCMC").value;
  const maxCMC = document.getElementById("maxCMC").value;

  if (minCMC !== "") query += ` cmc>=${minCMC}`;
  if (maxCMC !== "") query += ` cmc<=${maxCMC}`;

  const url = `https://api.scryfall.com/cards/random?q=${encodeURIComponent(query)}`;
  console.log("Fetching:", url);

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
  const players = parseInt(document.getElementById("playerCount").value) || 1;

  // Escalado por jugadores (ajústalo si quieres)
  const scale = 1 + (players - 1) * 0.35;

  // const hp = Math.round((20 + card.cmc * 5 + card.toughness * 2) * scale);
  // const damage = Math.round((card.power + Math.floor(card.cmc / 2)) * scale);
  
  const hp = Math.round((card.cmc * 2 + card.toughness * 2) * scale);
  const damage = Math.round((card.power) * scale);
  
  const defense = Math.round((5 + card.toughness) * scale);

  const difficultyScore = card.cmc + card.keywords.length + card.colors.length * 2;
  let difficultyLabel = "Mini-jefe";
  if (difficultyScore > 12) difficultyLabel = "Jefe final";
  else if (difficultyScore > 7) difficultyLabel = "Jefe estándar";

  return { hp, damage, defense, difficultyScore, difficultyLabel };
}

// 4. FASES

function phasesFromColors(colors) {
  const phases = [];

  // 🔥 ROJO — Furia y daño explosivo
  if (colors.includes("R")) {
    phases.push("🔥 Furia Ígnea (Pasiva): El jefe gana +2 al daño base.");
    phases.push("🔥 Golpe Ígneo (Turno): Al inicio de cada mantenimiento, inflige 3 de daño a cada jugador.");
    phases.push("🔥 Estallido de Caos (Caos): El Estallido de Caos hace 2 puntos de daño a cada jugador y a cada criatura.");
  }

  // 🔵 AZUL — Control, manipulación y copia
  if (colors.includes("U")) {
    phases.push("🔵 Eco Mental (Pasiva): La primera vez que un jugador lanza un hechizo cada turno, contrarresta ese hechizo a menos que su controlador pague 1.");
    phases.push("🔵 Anulación Parcial (Turno): Contrarresta la primera habilidad activada o disparada de un jugador este turno.");
    phases.push("🔵 Réplica Caótica (Caos): Copia la próxima habilidad o hechizo que lance cualquier jugador.");
  }

  // ⚫ NEGRO — Nigromancia, drenaje y sacrificios
  if (colors.includes("B")) {
    phases.push("⚫ Aura de Muerte (Pasiva): Cada vez que una criatura muere, el jefe gana 1 vida.");
    phases.push("⚫ Invocación Oscura (Turno): Crea un Esbirro 2/2 que ataca al jugador con más vida.");
    phases.push("⚫ Drenaje de Alma (Caos): Cada jugador pierde 2 vidas y el jefe gana 2 vidas.");
  }

  // ⚪ BLANCO — Castigo, orden y protección
  if (colors.includes("W")) {
    phases.push("⚪ Juicio Divino (Pasiva): La primera vez que un jugador ataca al jefe cada turno, ese jugador debe girar una criatura que controle.");
    phases.push("⚪ Escudo de Luz (Turno): El jefe obtiene un contador de escudo hasta su próximo turno.");
    phases.push("⚪ Castigo Celestial (Caos): Exilia el permanente no-tierra con menor coste de un jugador al azar.");
  }

  // 🟢 VERDE — Crecimiento, fuerza y criaturas grandes
  if (colors.includes("G")) {
    phases.push("🟢 Crecimiento Salvaje (Pasiva): El jefe gana +1/+1 por cada criatura que controla.");
    phases.push("🟢 Llamado de la Manada (Turno): Crea una Bestia 3/3 que entra atacando al jugador con menos criaturas.");
    phases.push("🟢 Ira de la Naturaleza (Caos): Todas sus criaturas obtienen +2/+2 y arrollar hasta el final del turno.");
  }

  // ⚙️ INCOLORE — Caos puro e impredecible
  if (phases.length === 0) {
    phases.push("⚙️ Distorsión del Vacío (Pasiva): Los hechizos de los jugadores cuestan 1 más.");
    phases.push("⚙️ Ruptura del Plano (Turno): Cada jugador exilia la carta superior de su biblioteca. Si es una criatura, el jefe lanza una de ellas al azar sin pagar su coste y pasan a estar bajo su control.");
    phases.push("⚙️ Tormenta del Vacío (Caos): Repite el efecto de Ruptura del Plano dos veces más.");
  }

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
