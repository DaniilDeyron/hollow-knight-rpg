import { rollAttributeCheck } from "../rolls/pool.js";
import { buildResourcePips, getNextResourceValue } from "../rules/resource-tracker.js";

export class HKCharacterSheet extends ActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["hkrpg", "sheet", "actor"],
      template: "systems/hollow-knight-rpg/templates/actor/character-sheet.hbs",
      width: 1100,
      height: 900,
      resizable: true,
      tabs: [
        {
          navSelector: ".hkrpg-tabs",
          contentSelector: ".hkrpg-tab-content",
          initial: "overview",
          group: "primary"
        }
      ]
    });
  }

  getData(options = {}) {
    const context = super.getData(options);
    context.system = this.actor.system;
    context.isEditable = this.isEditable;

    const resources = this.actor.system.resources;
    context.resourcePips = {
      heart: buildResourcePips(resources.heartMax, resources.heart, resources.heartTemp),
      soul: buildResourcePips(resources.soulMax, resources.soul, resources.soulTemp)
    };

    const items = this.actor.items.contents;
    context.itemGroups = {
      traits: items.filter((item) => item.type === "trait"),
      paths: items.filter((item) => item.type === "path"),
      charms: items.filter((item) => item.type === "charm"),
      proficiencies: items.filter((item) => item.type === "proficiency"),
      techniques: items.filter((item) => item.type === "technique"),
      equipment: items.filter((item) => item.type === "equipment"),
      weapons: items.filter((item) => item.type === "weapon"),
      shields: items.filter((item) => item.type === "shield"),
      armor: items.filter((item) => item.type === "armor")
    };

    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);

    // Use native delegated listeners. They work with both the legacy jQuery
    // wrapper and the HTMLElement supplied by Foundry sheet renderers.
    const root = html?.[0] ?? html;
    if (!root || typeof root.addEventListener !== "function") {
      console.error("Hollow Knight RPG | Could not attach sheet event listeners", html);
      return;
    }
    if (root.dataset.hkrpgEventsBound === "true") return;
    root.dataset.hkrpgEventsBound = "true";

    root.addEventListener("click", (event) => {
      const target = event.target?.closest?.(
        "[data-attribute-roll], [data-resource-current], [data-resource-temp-consume], [data-reset-derived]"
      );
      if (!target || !root.contains(target)) return;

      const wrappedEvent = {
        preventDefault: () => event.preventDefault(),
        currentTarget: target
      };

      if (target.matches("[data-resource-current]")) {
        void this._onResourcePipClick(wrappedEvent);
      } else if (target.matches("[data-resource-temp-consume]")) {
        void this._onTemporaryResourcePipClick(wrappedEvent);
      } else if (target.matches("[data-attribute-roll]")) {
        void this._onRollAttribute(wrappedEvent);
      } else if (target.matches("[data-reset-derived]")) {
        void this._onResetDerived(wrappedEvent);
      }
    });

    root.addEventListener("change", (event) => {
      const target = event.target?.closest?.("[data-derived-input]");
      if (!target || !root.contains(target)) return;
      void this._onDerivedInputChange({
        preventDefault: () => event.preventDefault(),
        currentTarget: target
      });
    });
  }

  async _onDerivedInputChange(event) {
    if (!this.isEditable) return;

    const input = event.currentTarget;
    const paths = {
      maneuverability: "system.social.maneuverabilityOverride",
      satietyMax: "system.resources.satietyMaxOverride"
    };
    const path = paths[input.dataset.derivedInput];
    if (!path) return;

    const raw = String(input.value ?? "").trim();
    const value = raw === "" ? null : Number(raw);
    if (value !== null && (!Number.isFinite(value) || value < 0)) {
      ui.notifications.warn("Введите число не меньше нуля.");
      input.value = this.actor.system.derived[input.dataset.derivedInput] ?? 0;
      return;
    }

    try {
      await this.actor.update({ [path]: value });
      this.render(false);
    } catch (error) {
      console.error("Hollow Knight RPG | Derived value update failed", error);
      ui.notifications.error("Не удалось сохранить значение. Подробности — в консоли (F12).");
    }
  }

  async _onResetDerived(event) {
    event.preventDefault();
    if (!this.isEditable) return;

    const key = event.currentTarget.dataset.resetDerived;
    const paths = {
      maneuverability: "system.social.maneuverabilityOverride",
      satietyMax: "system.resources.satietyMaxOverride"
    };
    const path = paths[key];
    if (!path) return;

    try {
      await this.actor.update({ [path]: null });
      this.render(false);
    } catch (error) {
      console.error("Hollow Knight RPG | Derived value reset failed", error);
      ui.notifications.error("Не удалось вернуть автоматический расчёт. Подробности — в консоли (F12).");
    }
  }

  async _onResourcePipClick(event) {
    event.preventDefault();
    if (!this.isEditable) return;

    const button = event.currentTarget;
    const key = button.dataset.resourceCurrent;
    if (!["heart", "soul"].includes(key)) return;

    const value = Number(button.dataset.resourceValue);
    const current = Number(this.actor.system.resources[key] ?? 0);
    const maximum = Number(this.actor.system.resources[key + "Max"] ?? 0);
    if (!Number.isInteger(value) || value < 1) return;

    const next = getNextResourceValue(current, value, maximum);
    await this._updateTrackedResource(key, next);
  }

  async _onTemporaryResourcePipClick(event) {
    event.preventDefault();
    if (!this.isEditable) return;

    const key = event.currentTarget.dataset.resourceTempConsume;
    if (!["heart", "soul"].includes(key)) return;

    const current = Number(this.actor.system.resources[key + "Temp"] ?? 0);
    if (!Number.isFinite(current) || current <= 0) return;

    // Each blue pip represents one temporary point; clicking it consumes one.
    await this._updateTrackedResource(key + "Temp", Math.max(0, Math.floor(current) - 1));
  }

  async _updateTrackedResource(key, value) {
    try {
      const update = {};
      update["system.resources." + key] = value;
      await this.actor.update(update);
      this.render(true);
    } catch (error) {
      console.error("Hollow Knight RPG | Resource update failed", error);
      ui.notifications.error("Не удалось обновить запас персонажа. Подробности — в консоли (F12).");
    }
  }

  async _onRollAttribute(event) {
    event.preventDefault();
    const attributeKey = event.currentTarget.dataset.attributeRoll;
    const button = event.currentTarget;

    if (button.disabled) return;
    button.disabled = true;

    try {
      // Read live values from the form. Foundry may still be processing the
      // input change when a player clicks the roll button immediately.
      const form = button.closest("form");
      const primaryAttributes = ["might", "insight", "shell", "grace"];
      const group = primaryAttributes.includes(attributeKey) ? "attributes" : "social";
      const baseInput = form?.querySelector(`[name="system.${group}.${attributeKey}"]`);
      const temporaryInput = primaryAttributes.includes(attributeKey)
        ? form?.querySelector(`[name="system.attributeTemps.${attributeKey}"]`)
        : null;

      const storedBase = this.actor.system[group]?.[attributeKey] ?? 0;
      const storedTemporary = this.actor.system.attributeTemps?.[attributeKey] ?? 0;
      const parsedBase = baseInput ? Number(baseInput.value) : Number(storedBase);
      const parsedTemporary = temporaryInput ? Number(temporaryInput.value) : Number(storedTemporary);
      const baseValue = Number.isFinite(parsedBase) ? Math.max(0, parsedBase) : 0;
      const temporaryValue = Number.isFinite(parsedTemporary) ? Math.max(0, parsedTemporary) : 0;

      // Save the exact values used by the roll.
      const updates = {};
      if (baseInput) updates[`system.${group}.${attributeKey}`] = baseValue;
      if (temporaryInput) updates[`system.attributeTemps.${attributeKey}`] = temporaryValue;
      if (Object.keys(updates).length) await this.actor.update(updates);

      await rollAttributeCheck(this.actor, attributeKey, {
        attributeValue: baseValue,
        temporaryValue
      });
    } catch (error) {
      console.error("Hollow Knight RPG | Attribute roll failed", error);
      ui.notifications.error("Не удалось выполнить бросок характеристики. Подробности — в консоли (F12).");
    } finally {
      button.disabled = false;
    }
  }
}
