/**
 * Shared d6 dice-pool helpers.
 *
 * Core rule: a result of 5 or 6 is a success.
 * Attribute .5 values grant a reroll; they do not add a full die.
 */
export function getAttributePool(attributeValue, temporaryValue = 0) {
  const value = Number(attributeValue);
  const temporary = Number(temporaryValue);
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
  const safeTemporary = Number.isFinite(temporary) ? Math.max(0, temporary) : 0;
  const totalValue = safeValue + safeTemporary;
  const diceCount = Math.floor(totalValue);
  const fraction = totalValue - diceCount;

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

  return result >= 5 ? "success" : "neutral";
}

export function summarizeD6Results(values = []) {
  const dice = values.map((value) => ({
    value,
    type: classifyD6Result(value)
  }));

  return {
    dice,
    total: dice.length,
    successes: dice.filter((die) => die.type === "success").length
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
    return '<span class="hkrpg-roll__empty">Нет костей для броска</span>';
  }

  return values.map((value, index) => {
    const isSuccess = classifyD6Result(value) === "success";
    const type = isSuccess ? " hkrpg-die--success" : "";
    const title = isSuccess ? "Успех" : `Результат ${value}`;
    return `<span class="hkrpg-die${type}" title="${title}" aria-label="Кость ${index + 1}: ${value}">${value}</span>`;
  }).join("");
}

export async function rollAttributeCheck(actor, attributeKey) {
  const characteristicSources = {
    might: { localizationKey: "HKRPG.Attribute.Might", group: "attributes", temporary: true },
    insight: { localizationKey: "HKRPG.Attribute.Insight", group: "attributes", temporary: true },
    shell: { localizationKey: "HKRPG.Attribute.Shell", group: "attributes", temporary: true },
    grace: { localizationKey: "HKRPG.Attribute.Grace", group: "attributes", temporary: true },
    spook: { localizationKey: "HKRPG.Secondary.Spook", group: "social", temporary: false },
    cute: { localizationKey: "HKRPG.Secondary.Cute", group: "social", temporary: false }
  };
  const characteristic = characteristicSources[attributeKey];
  if (!characteristic) throw new Error("Неизвестная характеристика.");

  const value = Number(actor.system[characteristic.group]?.[attributeKey] ?? 0);
  const temporaryValue = characteristic.temporary
    ? Number(actor.system.attributeTemps?.[attributeKey] ?? 0)
    : 0;
  const { diceCount, rerollsAvailable } = getAttributePool(value, temporaryValue);
  const { roll, results } = await rollD6Pool(diceCount);
  const summary = summarizeD6Results(results);
  const label = game.i18n.localize(characteristic.localizationKey);
  const successesLabel = pluralizeRussian(summary.successes, ["успех", "успеха", "успехов"]);
  const formula = `${diceCount}d6`;
  const rerollText = rerollsAvailable
    ? `<div class="hkrpg-roll__note">Доступен повторный бросок: <strong>${rerollsAvailable}</strong></div>`
    : "";

  const content = `
    <section class="hkrpg-roll">
      <header class="hkrpg-roll__header">
        <h3 class="hkrpg-roll__title">${label}</h3>
        <span class="hkrpg-roll__formula">${formula}</span>
      </header>
      <div class="hkrpg-roll__dice" aria-label="Результаты костей">
        ${renderDice(results)}
      </div>
      <footer class="hkrpg-roll__result">
        <span>Успехи</span>
        <strong>${summary.successes}</strong>
        <span class="hkrpg-roll__plural">${successesLabel}</span>
      </footer>
      ${rerollText}
    </section>
  `;

  const speaker = ChatMessage.getSpeaker({ actor });

  if (roll) {
    return roll.toMessage(
      { speaker, content },
      { rollMode: game.settings.get("core", "rollMode") }
    );
  }

  return ChatMessage.create({
    speaker,
    content,
    type: CONST.CHAT_MESSAGE_TYPES.OTHER
  });
}