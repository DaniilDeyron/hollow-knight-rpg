/**
 * Shared d6 dice-pool helpers.
 *
 * Core rule: a result of 5 or 6 is a success.
 * Attribute .5 values grant a reroll; they do not add a full die.
 */
export function getAttributePool(attributeValue) {
  const value = Number(attributeValue);
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
  const diceCount = Math.floor(safeValue);
  const fraction = safeValue - diceCount;

  return {
    diceCount,
    rerollsAvailable: fraction >= 0.5 ? 1 : 0
  };
}

export function classifyD6Result(value) {
  const result = Number(value);
  if (!Number.isInteger(result) || result < 1 || result > 6) {
    throw new RangeError("Результат d6 должен быть целым числом от 1 до 6.");
  }

  if (result >= 5) return "success";
  if (result <= 2) return "low";
  return "neutral";
}

export function summarizeD6Results(values = []) {
  const dice = values.map((value) => ({
    value,
    type: classifyD6Result(value)
  }));
  const successes = dice.filter((die) => die.type === "success").length;

  return {
    dice,
    total: dice.length,
    successes,
    failures: dice.length - successes
  };
}

export async function rollD6Pool(diceCount) {
  const count = Number(diceCount);
  if (!Number.isInteger(count) || count < 0 || count > 100) {
    throw new RangeError("Количество костей должно быть целым числом от 0 до 100.");
  }
  if (count === 0) return { roll: null, results: [] };

  const roll = await new Roll(`${count}d6`).evaluate({ allowInteractive: false });
  const die = roll.dice.find((term) => term.faces === 6);
  const results = (die?.results ?? []).map((entry) => Number(entry.result));

  return { roll, results };
}

function pluralizeRussian(number, forms) {
  const mod10 = number % 10;
  const mod100 = number % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

function renderDice(values) {
  if (!values.length) {
    return '<span class="hkrpg-roll-empty">Нет костей для броска</span>';
  }

  return values.map((value, index) => {
    const type = classifyD6Result(value);
    const title = type === "success"
      ? "Успех"
      : type === "neutral"
        ? "Неуспех"
        : "Низкий результат";
    return `<span class="hkrpg-die hkrpg-die--${type}" title="${title}" aria-label="Кость ${index + 1}: ${value}, ${title}">${value}</span>`;
  }).join("");
}

export async function rollAttributeCheck(actor, attributeKey) {
  const attributeNames = {
    might: "HKRPG.Attribute.Might",
    insight: "HKRPG.Attribute.Insight",
    shell: "HKRPG.Attribute.Shell",
    grace: "HKRPG.Attribute.Grace"
  };
  const localizationKey = attributeNames[attributeKey];
  if (!localizationKey) throw new Error("Неизвестная характеристика.");

  const value = Number(actor.system.attributes[attributeKey] ?? 0);
  const { diceCount, rerollsAvailable } = getAttributePool(value);
  const { roll, results } = await rollD6Pool(diceCount);
  const summary = summarizeD6Results(results);
  const label = game.i18n.localize(localizationKey);
  const actorName = foundry.utils.escapeHTML(actor.name);
  const safeLabel = foundry.utils.escapeHTML(label);
  const successesLabel = pluralizeRussian(summary.successes, ["успех", "успеха", "успехов"]);
  const failuresLabel = pluralizeRussian(summary.failures, ["неуспех", "неуспеха", "неуспехов"]);
  const formula = diceCount ? `${diceCount}d6` : "0d6";
  const rerollText = rerollsAvailable
    ? `<div class="hkrpg-roll-rerolls">Доступно повторных бросков: <strong>${rerollsAvailable}</strong> (за дробную характеристику)</div>`
    : "";

  const content = `
    <section class="hkrpg-roll-card">
      <header class="hkrpg-roll-header">
        <div>
          <div class="hkrpg-roll-actor">${actorName}</div>
          <h3 class="hkrpg-roll-title">${safeLabel}</h3>
        </div>
        <div class="hkrpg-roll-formula">${formula}</div>
      </header>
      <div class="hkrpg-roll-dice" aria-label="Результаты костей">${renderDice(results)}</div>
      <div class="hkrpg-roll-counts">
        <div class="hkrpg-roll-count hkrpg-roll-count--success">
          <strong>${summary.successes}</strong>
          <span>${successesLabel}</span>
        </div>
        <div class="hkrpg-roll-count hkrpg-roll-count--failure">
          <strong>${summary.failures}</strong>
          <span>${failuresLabel}</span>
        </div>
      </div>
      <div class="hkrpg-roll-total">Итог броска: <strong>${summary.successes} ${successesLabel}</strong></div>
      ${rerollText}
      <footer class="hkrpg-roll-legend">
        <span><i class="hkrpg-legend-dot hkrpg-legend-dot--success"></i> 5–6: успех</span>
        <span><i class="hkrpg-legend-dot hkrpg-legend-dot--neutral"></i> 3–4: неуспех</span>
        <span><i class="hkrpg-legend-dot hkrpg-legend-dot--low"></i> 1–2: низкий результат</span>
      </footer>
    </section>
  `;

  const speaker = ChatMessage.getSpeaker({ actor });
  const flavor = `${actor.name} — ${label}`;

  if (roll) {
    return roll.toMessage(
      { speaker, flavor, content },
      { rollMode: game.settings.get("core", "rollMode") }
    );
  }

  return ChatMessage.create({
    speaker,
    flavor,
    content,
    type: CONST.CHAT_MESSAGE_TYPES.OTHER
  });
}