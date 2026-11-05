import { rollAttributeCheck } from "../rolls/pool.js";
import { buildResourcePips } from "../rules/resource-tracker.js";

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
    html.find("[data-attribute-roll]").on("click", this._onRollAttribute.bind(this));
    html.find("[data-resource-current]").on("click", this._onResourcePipClick.bind(this));
    html.find("[data-resource-temp-adjust]").on("click", this._onTemporaryResourceAdjust.bind(this));
  }

  async _onResourcePipClick(event) {
    event.preventDefault();
    if (!this.isEditable) return;

    const button = event.currentTarget;
    const key = button.dataset.resourceCurrent;
    if (!["heart", "soul"].includes(key)) return;

    const value = Number(button.dataset.resourceValue);
    const current = Number(this.actor.system.resources[key] ?? 0);
    if (!Number.isInteger(value) || value < 1) return;

    const next = value === current ? Math.max(0, value - 1) : value;
    await this._updateTrackedResource(key, next);
  }

  async _onTemporaryResourceAdjust(event) {
    event.preventDefault();
    if (!this.isEditable) return;

    const button = event.currentTarget;
    const key = button.dataset.resourceTempAdjust;
    if (!["heart", "soul"].includes(key)) return;

    const delta = Number(button.dataset.delta);
    if (![-1, 1].includes(delta)) return;

    const current = Number(this.actor.system.resources[key + "Temp"] ?? 0);
    const next = Math.max(0, current + delta);
    await this._updateTrackedResource(key + "Temp", next);
  }

  async _updateTrackedResource(key, value) {
    try {
      const update = {};
      update["system.resources." + key] = value;
      await this.actor.update(update);
      this.render(false);
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
      await rollAttributeCheck(this.actor, attributeKey);
    } catch (error) {
      console.error("Hollow Knight RPG | Attribute roll failed", error);
      ui.notifications.error("Не удалось выполнить бросок характеристики. Подробности — в консоли (F12).");
    } finally {
      button.disabled = false;
    }
  }
}
