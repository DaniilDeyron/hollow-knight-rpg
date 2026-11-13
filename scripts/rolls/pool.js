/**
 * Shared d6 dice-pool helpers.
 *
 * Core rule: a result of 5 or 6 is a success.
 * Fractional characteristic ranks never add a die: 5.5 is a five-die pool.
 * The card-level reroll action is universal and is not calculated here.
 */
export function getAttributePool(attributeValue, temporaryValue = 0) {
  const value = Number(attributeValue);
  const temporary = Number(temporaryValue);
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
  const safeTemporary = Number.isFinite(temporary) ? Math.max(0, temporary) : 0;

  const baseDiceCount = Math.floor(safeValue);
  const bonusDiceCount = Math.floor(safeTemporary);

  return {
    baseDiceCount,
    bonusDiceCount,
    diceCount: baseDiceCount + bonusDiceCount,
    rerollsAvailable: 0
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

/**
 * Replace exactly the selected dice with their new results.
 * A card allows one reroll action; the player may select any number of dice.
 */
export function resolveD6Rerolls(originalResults, selectedIndices, rerolledResults, maximumRerolls) {
  const originals = Array.isArray(originalResults) ? [...originalResults] : [];
  const selected = Array.isArray(selectedIndices) ? selectedIndices : [];
  const rerolled = Array.isArray(rerolledResults) ? rerolledResults : [];
  const maximum = Number(maximumRerolls);

  originals.forEach(classifyD6Result);
  if (!Number.isInteger(maximum) || maximum < 0) {
    throw new RangeError("Количество доступных перебросов должно быть неотрицательным целым числом.");
  }

  const unique = new Set(selected);
  if (unique.size !== selected.length) {
    throw new RangeError("Одну и ту же кость нельзя выбрать для переброса дважды.");
  }
  if (selected.length > maximum) {
    throw new RangeError("Выбрано больше костей, чем разрешено перебросами.");
  }
  if (rerolled.length !== selected.length) {
    throw new RangeError("Количество новых результатов не совпадает с выбранными костями.");
  }

  const history = [];
  for (let index = 0; index < selected.length; index += 1) {
    const dieIndex = selected[index];
    if (!Number.isInteger(dieIndex) || dieIndex < 0 || dieIndex >= originals.length) {
      throw new RangeError("Выбрана несуществующая кость.");
    }

    const nextValue = Number(rerolled[index]);
    classifyD6Result(nextValue);
    const previousValue = originals[dieIndex];
    originals[dieIndex] = nextValue;
    history.push({
      index: dieIndex,
      previous: previousValue,
      rolled: nextValue,
      kept: nextValue
    });
  }

  return { results: originals, history };
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

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function renderDice(values, selection = {}) {
  if (!values.length) {
    return '<span class="hkrpg-roll__empty">Нет костей для броска</span>';
  }

  const selected = new Set(selection.selectedIndices ?? []);
  const isSelecting = Boolean(selection.selecting);
  return values.map((value, index) => {
    const isSuccess = classifyD6Result(value) === "success";
    const type = isSuccess ? " hkrpg-die--success" : "";
    const isSelected = selected.has(index);
    const selectedClass = isSelected ? " is-selected" : "";
    const title = isSuccess ? "Успех" : `Результат ${value}`;
    const label = `Кость ${index + 1}: ${value}`;
    if (isSelecting) {
      return `<button type="button" class="hkrpg-die hkrpg-die--selectable${type}${selectedClass}" data-hkrpg-reroll-index="${index}" aria-pressed="${isSelected}" title="${title}" aria-label="${label}">${value}</button>`;
    }
    return `<span class="hkrpg-die${type}" title="${title}" aria-label="${label}">${value}</span>`;
  }).join("");
}

/**
 * Render the editable dice-pool card stored as ChatMessage content.
 * Selection state is persisted in the message flag and survives chat redraws.
 */
export function renderD6RollCardContent(state = {}) {
  const results = Array.isArray(state.results) ? state.results : [];
  const summary = summarizeD6Results(results);
  const successesLabel = pluralizeRussian(summary.successes, ["успех", "успеха", "успехов"]);
  const available = results.length;
  const selected = Array.isArray(state.selectedIndices) ? state.selectedIndices : [];
  const selecting = Boolean(state.selecting && !state.rerollsUsed && results.length > 0);
  const label = escapeHtml(state.label ?? "Проверка");
  const formula = escapeHtml(state.formula ?? `${results.length}d6`);

  let controls = "";
  if (available > 0 && !state.rerollsUsed) {
    if (selecting) {
      controls = `
        <div class="hkrpg-roll__reroll-panel">
          <p class="hkrpg-roll__note">Выберите любые кости, которые хотите перебросить. Новые результаты заменят старые.</p>
          <div class="hkrpg-roll__actions">
            <button type="button" class="hkrpg-roll__action hkrpg-roll__action--primary" data-hkrpg-roll-action="confirm" ${selected.length ? "" : "disabled"}>Перебросить выбранные (${selected.length}/${available})</button>
            <button type="button" class="hkrpg-roll__action" data-hkrpg-roll-action="cancel">Отмена</button>
          </div>
        </div>`;
    } else {
      controls = `
        <div class="hkrpg-roll__reroll-panel">
          <span class="hkrpg-roll__note">Можно перебросить любые кости один раз.</span>
          <button type="button" class="hkrpg-roll__action hkrpg-roll__action--primary" data-hkrpg-roll-action="start">Переброс</button>
        </div>`;
    }
  } else if (state.rerollsUsed && Array.isArray(state.rerollHistory) && state.rerollHistory.length) {
    controls = `
      <div class="hkrpg-roll__note hkrpg-roll__reroll-used">
        Переброс потрачен: ${state.rerollHistory.map((entry) =>
          `кость ${Number(entry.index) + 1}: ${Number(entry.previous)} → ${Number(entry.kept)}`
        ).join("; ")}
      </div>`;
  }

  return `
    <section class="hkrpg-roll">
      <header class="hkrpg-roll__header">
        <h3 class="hkrpg-roll__title">${label}</h3>
        <span class="hkrpg-roll__formula">${formula}</span>
      </header>
      <div class="hkrpg-roll__dice" aria-label="Результаты костей">
        ${renderDice(results, { selecting, selectedIndices: selected })}
      </div>
      <footer class="hkrpg-roll__result">
        <span>Успехи</span>
        <strong>${summary.successes}</strong>
        <span class="hkrpg-roll__plural">${successesLabel}</span>
      </footer>
      ${controls}
    </section>
  `;
}

/** Backwards-compatible alias retained for existing integrations. */
export const renderAttributeRollCardContent = renderD6RollCardContent;

async function createD6RollMessage(actor, state, roll, flagKey = "d6Roll") {
  const content = renderD6RollCardContent(state);
  const speaker = ChatMessage.getSpeaker({ actor });

  if (roll) {
    const messageData = await roll.toMessage(
      { speaker, content: "" },
      { create: false, rollMode: game.settings.get("core", "rollMode") }
    );
    messageData.content = content;
    messageData.flags ??= {};
    messageData.flags.hkrpg ??= {};
    messageData.flags.hkrpg[flagKey] = state;
    return ChatMessage.create(messageData);
  }

  return ChatMessage.create({
    speaker,
    content,
    type: CONST.CHAT_MESSAGE_TYPES.OTHER,
    flags: { hkrpg: { [flagKey]: state } }
  });
}

/**
 * General d6 roll entry point for skills, attacks, resistance checks and
 * other roll types. Callers supply the number of rule-granted rerolls.
 */
export async function rollD6Check(actor, {
  label = "Проверка",
  diceCount,
  rerollsAvailable = 0,
  formula,
  kind = "d6-check",
  metadata = {}
} = {}) {
  const count = Number(diceCount);
  const rerolls = Number(rerollsAvailable);
  if (!Number.isInteger(count) || count < 0 || count > 100) {
    throw new RangeError("Количество костей должно быть целым числом от 0 до 100.");
  }
  if (!Number.isInteger(rerolls) || rerolls < 0) {
    throw new RangeError("Количество перебросов должно быть неотрицательным целым числом.");
  }

  const { roll, results } = await rollD6Pool(count);
  const state = {
    ...metadata,
    kind,
    label: String(label),
    formula: formula ? String(formula) : `${count}d6`,
    results,
    rerollsAvailable: results.length,
    rerollsUsed: false,
    selecting: false,
    selectedIndices: [],
    rerollHistory: [],
    rollData: roll?.toJSON?.() ?? null
  };
  return createD6RollMessage(actor, state, roll, "d6Roll");
}

export async function rollAttributeCheck(actor, attributeKey, overrides = {}) {
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

  const storedValue = actor.system[characteristic.group]?.[attributeKey] ?? 0;
  const traitBonus = Number(actor.system.derived?.traitBonuses?.[attributeKey] ?? 0);
  const templateSocialBonus = characteristic.group === "social" ? Number(actor.system.social?.bonus ?? 0) : 0;
  const value = Number(overrides.attributeValue ?? (storedValue + traitBonus + templateSocialBonus));
  const storedTemporary = characteristic.temporary
    ? actor.system.attributeTemps?.[attributeKey] ?? 0
    : 0;
  const temporaryValue = characteristic.temporary
    ? Number(overrides.temporaryValue ?? storedTemporary)
    : 0;
  const {
    baseDiceCount,
    bonusDiceCount,
    diceCount,
    rerollsAvailable
  } = getAttributePool(value, temporaryValue);
  const { roll, results } = await rollD6Pool(diceCount);
  const label = game.i18n.localize(characteristic.localizationKey);
  const formula = bonusDiceCount > 0
    ? `${baseDiceCount}d6 + ${bonusDiceCount}d6 = ${diceCount}d6`
    : `${diceCount}d6`;

  const state = {
    kind: "attribute-check",
    attributeKey,
    label,
    formula,
    results,
    rerollsAvailable: results.length,
    rerollsUsed: false,
    selecting: false,
    selectedIndices: [],
    rerollHistory: [],
    rollData: roll?.toJSON?.() ?? null
  };
  return createD6RollMessage(actor, state, roll, "attributeRoll");
}
