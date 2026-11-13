import {
  renderD6RollCardContent,
  resolveD6Rerolls,
  rollD6Pool
} from "./pool.js";

const pendingMessages = new WeakSet();

function getD6RollState(message) {
  // Prefer the live document data: getFlag can be stale in a render callback
  // while Foundry is reconciling a document update.
  return message?.flags?.hkrpg?.d6Roll
    ?? message?.flags?.hkrpg?.attributeRoll
    ?? message?.getFlag?.("hkrpg", "d6Roll")
    ?? message?.getFlag?.("hkrpg", "attributeRoll")
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
  const user = game.user;
  if (user?.isGM) return true;

  const authorId = message?.author?.id
    ?? (typeof message?.user === "string" ? message.user : message?.user?.id)
    ?? message?._source?.user;
  if (authorId && authorId === user?.id) return true;

  // A player who owns the speaking actor may control that actor's roll even
  // when a GM created/imported the message on their behalf.
  const speaker = message?.speaker ?? {};
  let actor = speaker.actor ? game.actors?.get(speaker.actor) : null;
  if (!actor && speaker.scene && speaker.token) {
    actor = game.scenes?.get(speaker.scene)?.tokens?.get(speaker.token)?.actor ?? null;
  }
  return Boolean(actor?.isOwner || actor?.testUserPermission?.(user, "OWNER"));
}

function cloneData(value) {
  if (!value || typeof value !== "object") return value;
  return JSON.parse(JSON.stringify(value));
}

/**
 * Update the serialized Foundry Roll so its expanded tooltip agrees with the
 * final values shown on the editable card.
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

/**
 * Run the actual start/select/cancel/confirm flow. The dice roller is injectable
 * so the full sequence can be covered by deterministic tests.
 */
export async function processD6RollAction(
  message,
  target,
  { rollDice = rollD6Pool, warn = (text) => ui.notifications.warn(text) } = {}
) {
  const state = getD6RollState(message);
  if (!isSupportedD6Roll(message, state) || state.rerollsUsed) return false;

  const actionButton = target.closest?.("[data-hkrpg-roll-action]");
  const dieButton = target.closest?.("[data-hkrpg-reroll-index]");
  if (!actionButton && !dieButton) return false;

  if (!state.selecting && dieButton) return false;
  if (!state.selecting && actionButton?.dataset.hkrpgRollAction !== "start") return false;
  if (state.selecting && actionButton?.dataset.hkrpgRollAction === "start") return false;

  const action = actionButton?.dataset.hkrpgRollAction;
  const maximum = Math.max(0, Math.min(
    Number(state.rerollsAvailable) || 0,
    Array.isArray(state.results) ? state.results.length : 0
  ));

  if (action === "start") {
    await updateRollMessage(message, {
      ...state,
      selecting: true,
      selectedIndices: []
    });
    return true;
  }

  if (action === "cancel") {
    await updateRollMessage(message, {
      ...state,
      selecting: false,
      selectedIndices: []
    });
    return true;
  }

  if (dieButton) {
    const index = Number(dieButton.dataset.hkrpgRerollIndex);
    if (!Number.isInteger(index) || index < 0 || index >= state.results.length || maximum < 1) return false;

    const selected = new Set(state.selectedIndices ?? []);
    if (selected.has(index)) {
      selected.delete(index);
    } else {
      if (selected.size >= maximum) {
        warn(`Можно выбрать не более ${maximum} ${maximum === 1 ? "кости" : "костей"} для переброса.`);
        return false;
      }
      selected.add(index);
    }

    await updateRollMessage(message, {
      ...state,
      selecting: true,
      selectedIndices: [...selected].sort((a, b) => a - b)
    });
    return true;
  }

  if (action === "confirm") {
    const selected = [...new Set(state.selectedIndices ?? [])];
    if (!selected.length || selected.length > maximum) return false;

    const { results: newResults } = await rollDice(selected.length);
    if (!Array.isArray(newResults) || newResults.length !== selected.length) {
      throw new Error("Новые результаты не совпадают с количеством выбранных костей.");
    }

    const resolved = resolveD6Rerolls(
      state.results,
      selected,
      newResults,
      maximum
    );
    await updateRollMessage(message, {
      ...state,
      results: resolved.results,
      rerollsUsed: true,
      selecting: false,
      selectedIndices: [],
      rerollHistory: resolved.history
    });
    return true;
  }

  return false;
}

/**
 * Foundry v13 renderChatMessageHTML hook. Bind directly to each control in
 * capture phase. Binding per button (rather than marking the whole message
 * root) also works when Foundry replaces only the card contents.
 */
export function activateD6RollControls(message, html) {
  const state = getD6RollState(message);
  if (!isSupportedD6Roll(message, state)) return;

  const root = html?.[0] ?? html;
  if (!root?.querySelectorAll || !root?.addEventListener) return;

  const controls = root.querySelectorAll("[data-hkrpg-roll-action], [data-hkrpg-reroll-index]");
  if (!canControlMessage(message)) {
    controls.forEach((control) => {
      control.disabled = true;
      control.title = "Переброс доступен автору броска или владельцу персонажа";
    });
    return;
  }

  // Bind once to the chat-message root. Delegation survives replacement of
  // the card's inner HTML when Foundry rerenders a ChatMessage.
  if (root.dataset?.hkrpgRollControlsBound === "true") return;
  if (root.dataset) root.dataset.hkrpgRollControlsBound = "true";

  root.addEventListener("click", async (event) => {
    const eventTarget = event.target?.nodeType === 3
      ? event.target.parentElement
      : event.target;
    const control = eventTarget?.closest?.(
      "[data-hkrpg-roll-action], [data-hkrpg-reroll-index]"
    );
    if (!control || (root.contains && !root.contains(control)) || control.disabled) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    if (pendingMessages.has(message)) return;
    pendingMessages.add(message);
    control.disabled = true;

    try {
      if (!canControlMessage(message)) {
        throw new Error("Переброс доступен только автору броска или владельцу персонажа.");
      }
      const handled = await processD6RollAction(message, control);
      if (!handled) control.disabled = false;
    } catch (error) {
      console.error("Hollow Knight RPG | Dice reroll failed", error);
      control.disabled = false;
      ui.notifications.error(`Не удалось выполнить переброс: ${error.message}`);
    } finally {
      pendingMessages.delete(message);
    }
  }, true);
}

/** Backwards-compatible export for existing initialization hooks. */
export const activateAttributeRollControls = activateD6RollControls;
