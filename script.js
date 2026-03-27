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
    <div class="bossCard">
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
    </div>
  `;
}
