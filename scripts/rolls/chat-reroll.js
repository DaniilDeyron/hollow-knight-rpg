import {
  renderD6RollCardContent,
  resolveD6Rerolls,
  rollD6Pool
} from "./pool.js";

const pendingMessages = new WeakSet();

function getD6RollState(message) {
  return message?.getFlag?.("hkrpg", "d6Roll")
    ?? message?.flags?.hkrpg?.d6Roll
    ?? message?.getFlag?.("hkrpg", "attributeRoll")
    ?? message?.flags?.hkrpg?.attributeRoll
    ?? null;
}

function getD6RollFlagKey(message) {
  return message?.flags?.hkrpg?.d6Roll || message?.getFlag?.("hkrpg", "d6Roll")
    ? "d6Roll"
    : "attributeRoll";
}

function isSupportedD6Roll(message, state) {
  if (!state || !Array.isArray(state.results)) return false;
  const hasGenericFlag = Boolean(
    message?.flags?.hkrpg?.d6Roll ?? message?.getFlag?.("hkrpg", "d6Roll")
  );
  return hasGenericFlag || state.kind === "attribute-check";
}

function canControlMessage(message) {
  const currentUser = game.user;
  if (currentUser?.isGM) return true;
  const authorId = message?.author?.id
    ?? (typeof message?.user === "string" ? message.user : message?.user?.id)
    ?? message?._source?.user;
  return Boolean(authorId && authorId === currentUser?.id);
}

function cloneData(value) {
  if (!value || typeof value !== "object") return value;
  return JSON.parse(JSON.stringify(value));
}

/**
 * Update the serialized Foundry Roll so the expanded roll tooltip and the
 * visible custom card agree after selected dice have been rerolled.
 */
export function replaceD6ResultsInRollData(source, values) {
  if (!source || !Array.isArray(values)) return null;
  values.forEach((value) => {
    if (!Number.isInteger(value) || value < 1 || value > 6) {
      throw new RangeError("Результаты d6 должны находиться в диапазоне от 1 до 6.");
    }
  });

  const data = cloneData(source);
  const visited = new Set();
  let dieTerm = null;

  const findDie = (node) => {
    if (!node || typeof node !== "object" || visited.has(node) || dieTerm) return;
    visited.add(node);
    if (Number(node.faces) === 6 && Array.isArray(node.results)) {
      dieTerm = node;
      return;
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        for (const entry of value) findDie(entry);
      } else if (value && typeof value === "object") {
        findDie(value);
      }
    }
  };
  findDie(data);

  if (!dieTerm || dieTerm.results.length !== values.length) return null;
  dieTerm.results = values.map((value, index) => ({
    ...(dieTerm.results[index] ?? {}),
    result: value,
    active: true
  }));

  const total = values.reduce((sum, value) => sum + value, 0);
  if ("total" in data) data.total = total;
  if ("_total" in data) data._total = total;
  if ("result" in data) data.result = values.join(" + ");
  return data;
}

async function updateRollMessage(message, state) {
  const flagKey = getD6RollFlagKey(message);
  const flagPath = `flags.hkrpg.${flagKey}`;
  const updates = {
    content: renderD6RollCardContent(state),
    [flagPath]: state
  };
  const rollData = replaceD6ResultsInRollData(state.rollData, state.results);
  if (rollData) {
    state.rollData = rollData;
    updates[flagPath] = state;
    updates.rolls = [JSON.stringify(rollData)];
  }
  await message.update(updates);
}

async function processRollAction(message, action, dieIndex = null) {
  const state = getD6RollState(message);
  if (!isSupportedD6Roll(message, state) || state.rerollsUsed) return;

  const maximum = Array.isArray(state.results) ? state.results.length : 0;
  if (maximum < 1) return;

  if (action === "start") {
    await updateRollMessage(message, {
      ...state,
      rerollsAvailable: maximum,
      selecting: true,
      selectedIndices: []
    });
    return;
  }

  if (action === "cancel") {
    await updateRollMessage(message, {
      ...state,
      selecting: false,
      selectedIndices: []
    });
    return;
  }

  if (Number.isInteger(dieIndex)) {
    if (!state.selecting || dieIndex < 0 || dieIndex >= maximum) return;
    const selected = new Set(state.selectedIndices ?? []);
    if (selected.has(dieIndex)) selected.delete(dieIndex);
    else selected.add(dieIndex);

    await updateRollMessage(message, {
      ...state,
      selecting: true,
      selectedIndices: [...selected].sort((a, b) => a - b)
    });
    return;
  }

  if (action === "confirm") {
    const selected = [...new Set(state.selectedIndices ?? [])];
    if (!selected.length || selected.length > maximum) return;

    const { results: newResults } = await rollD6Pool(selected.length);
    const resolved = resolveD6Rerolls(
      state.results,
      selected,
      newResults,
      maximum
    );
    await updateRollMessage(message, {
      ...state,
      results: resolved.results,
      rerollsAvailable: maximum,
      rerollsUsed: true,
      selecting: false,
      selectedIndices: [],
      rerollHistory: resolved.history
    });
  }
}

/**
 * Foundry v13 renderChatMessageHTML hook. The message author (or a GM) can
 * select up to the available number of dice; everyone else sees a read-only card.
 */
export function activateD6RollControls(message, html) {
  const state = getD6RollState(message);
  if (!isSupportedD6Roll(message, state)) return;

  const root = html?.[0] ?? html;
  if (!root?.querySelectorAll) return;

  if (!canControlMessage(message)) {
    root.querySelectorAll("[data-hkrpg-roll-action], [data-hkrpg-reroll-index]")
      .forEach((control) => control.remove());
    return;
  }

  // Bind the actual buttons, rather than depending on delegated events on the
  // message wrapper. Foundry can replace that wrapper when the message updates.
  const controls = root.querySelectorAll("[data-hkrpg-roll-action], [data-hkrpg-reroll-index]");
  for (const control of controls) {
    if (control.dataset.hkrpgRerollBound === "true") continue;
    control.dataset.hkrpgRerollBound = "true";

    control.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      if (pendingMessages.has(message)) return;
      pendingMessages.add(message);
      control.disabled = true;

      try {
        if (!canControlMessage(message)) {
          ui.notifications.warn("Только автор броска или Мастер может выполнить переброс.");
          return;
        }

        const action = control.dataset.hkrpgRollAction ?? "";
        const dieIndex = control.dataset.hkrpgRerollIndex === undefined
          ? null
          : Number(control.dataset.hkrpgRerollIndex);
        await processRollAction(message, action, dieIndex);
      } catch (error) {
        console.error("Hollow Knight RPG | Dice reroll failed", error);
        ui.notifications.error("Не удалось выполнить переброс. Подробности — в консоли (F12).");
      } finally {
        pendingMessages.delete(message);
        if (control.isConnected !== false) control.disabled = false;
      }
    }, true);
  }
}

/** Backwards-compatible export for existing initialization hooks. */
export const activateAttributeRollControls = activateD6RollControls;
