import { rollAttributeCheck } from "../rolls/pool.js";
import { buildResourcePips } from "../rules/resource-tracker.js";
import { buildFeatureRows, buildSkillGroups, countFeatureMarks } from "../rules/feature-sheet.js";
import { buildCharmNotchState, evaluateCharmEquip } from "../rules/charm-tracker.js";

export class HKCharacterSheet extends ActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["hkrpg", "sheet", "actor"],
      template: "systems/hollow-knight-rpg/templates/actor/character-sheet.hbs",
      width: 1100,
      height: 900,
      resizable: true,
      submitOnChange: true,
      dragDrop: [
        ...(super.defaultOptions.dragDrop ?? []),
        { dragSelector: "[data-charm-item-id]", dropSelector: "[data-charm-dropzone]" }
      ],
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
      soul: buildResourcePips(resources.soulMax, resources.soul, resources.soulTemp),
      stamina: buildResourcePips(resources.staminaMax, resources.stamina, resources.staminaTemp)
    };

    const items = this.actor.items.contents;
    const charms = items.filter((item) => item.type === "charm");
    context.itemGroups = {
      traits: items.filter((item) => item.type === "trait"),
      paths: items.filter((item) => item.type === "path"),
      charms,
      equippedCharms: charms.filter((item) => Boolean(item.system.equipped)),
      collectionCharms: charms.filter((item) => !item.system.equipped),
      proficiencies: items.filter((item) => item.type === "proficiency"),
      techniques: items.filter((item) => item.type === "technique"),
      equipment: items.filter((item) => item.type === "equipment"),
      weapons: items.filter((item) => item.type === "weapon"),
      shields: items.filter((item) => item.type === "shield"),
      armor: items.filter((item) => item.type === "armor")
    };
    context.charmNotches = buildCharmNotchState(this.actor.system.derived.notchesMax, charms);
    context.notchBonus = this.actor.system.resources.notchesBonus;

    const featureSheet = this.actor.system.featureSheet;
    context.featureRows = {
      traits: buildFeatureRows(featureSheet.traits, context.itemGroups.traits, 10, ["attraction", "spook", "hunger"]),
      paths: buildFeatureRows(featureSheet.paths, context.itemGroups.paths, 6, ["rank1", "rank2", "rank3"]),
      techniques: buildFeatureRows(featureSheet.techniques, context.itemGroups.techniques, 9, ["marked"])
    };
    context.featureTotals = countFeatureMarks(context.featureRows.traits, ["attraction", "spook", "hunger"]);
    context.skillGroups = buildSkillGroups(this.actor.system.skillGroups);

    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);

    const bind = (selector, eventName, method) => {
      const handler = method.bind(this);

      // ActorSheet in Foundry v13 normally supplies a jQuery collection.
      // Bind directly to each control instead of relying on event bubbling.
      if (typeof html?.find === "function") {
        const controls = html.find(selector);
        controls.off(`${eventName}.hkrpg`);
        controls.on(`${eventName}.hkrpg`, handler);
        return;
      }

      // Fallback for renderers that supply a native HTMLElement.
      const root = html?.[0] ?? html;
      if (!root?.querySelectorAll) {
        console.error("Hollow Knight RPG | Could not bind sheet controls", html);
        return;
      }

      root.querySelectorAll(selector).forEach((element) => {
        const marker = `hkrpg${eventName}`;
        if (element.dataset[marker] === "true") return;
        element.dataset[marker] = "true";
        element.addEventListener(eventName, handler);
      });
    };

    // Heart and Soul use real buttons. A capture-phase listener on the
    // form receives the click before Foundry or a child control can stop it.
    const root = html?.[0] ?? html;
    if (root?.addEventListener && root.dataset.hkrpgResourceCapture !== "true") {
      root.dataset.hkrpgResourceCapture = "true";
      root.addEventListener("click", async (event) => {
        const pip = event.target?.closest?.("[data-resource-pip]");
        if (!pip || !root.contains(pip)) return;

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        if (!this.isEditable || pip.disabled) return;

        const key = pip.dataset.resourcePip;
        const next = Number(pip.dataset.resourceTarget);
        if (!["heart", "soul", "stamina", "heartTemp", "soulTemp", "staminaTemp"].includes(key)) return;
        if (!Number.isInteger(next) || next < 0) return;

        const maximum = ["heart", "soul", "stamina"].includes(key)
          ? Number(this.actor.system.resources[key + "Max"] ?? 0)
          : Number.POSITIVE_INFINITY;
        if (next > maximum) return;

        await this._updateTrackedResource(key, next);
      }, true);
    } else if (!root?.addEventListener) {
      console.error("Hollow Knight RPG | Could not attach capture listener for resource pips", html);
    }

    bind("[data-resource-field]", "change", this._onResourceFieldChange);
    bind("[data-create-charm]", "click", this._onCreateCharm);
    bind("[data-edit-charm]", "click", this._onEditCharm);
    bind("[data-unequip-charm]", "click", this._onUnequipCharm);
    bind("[data-attribute-roll]", "click", this._onRollAttribute);
    bind("[data-reset-derived]", "click", this._onResetDerived);
    bind("[data-derived-input]", "change", this._onDerivedInputChange);
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

  async _onResourceFieldChange(event) {
    if (!this.isEditable) return;

    const input = event.currentTarget;
    const key = input.dataset.resourceField;
    const allowedKeys = [
      "heart", "soul", "stamina",
      "heartMax", "soulMax", "staminaMax",
      "heartTemp", "soulTemp", "staminaTemp", "notchesBonus"
    ];
    if (!allowedKeys.includes(key)) return;

    const parsed = Number(input.value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      input.value = String(this.actor.system.resources[key] ?? 0);
      return;
    }

    const nextValue = Math.floor(parsed);
    if (key.endsWith("Max")) {
      const resourceKey = key.slice(0, -3);
      const current = Number(this.actor.system.resources[resourceKey] ?? 0);
      const updates = {
        [`system.resources.${key}`]: nextValue
      };
      if (current > nextValue) updates[`system.resources.${resourceKey}`] = nextValue;
      await this._updateTrackedResources(updates);
      return;
    }

    await this._updateTrackedResource(key, nextValue);
  }

  async _updateTrackedResource(key, value) {
    const allowedKeys = [
      "heart", "soul", "stamina",
      "heartTemp", "soulTemp", "staminaTemp", "notchesBonus"
    ];
    const numericValue = Number(value);
    if (!allowedKeys.includes(key) || !Number.isFinite(numericValue) || numericValue < 0) {
      console.warn("Hollow Knight RPG | Rejected invalid resource update", { key, value });
      return;
    }

    const nextValue = Math.floor(numericValue);
    if (key === "notchesBonus") {
      await this._updateTrackedResources({ "system.resources.notchesBonus": nextValue });
      return;
    }

    if (["heart", "soul", "stamina"].includes(key)) {
      const maximum = Number(this.actor.system.resources[key + "Max"] ?? 0);
      await this._updateTrackedResources({
        [`system.resources.${key}`]: Math.min(nextValue, maximum)
      });
      return;
    }

    await this._updateTrackedResources({
      [`system.resources.${key}`]: nextValue
    });
  }

  async _updateTrackedResources(updates) {
    try {
      await this.actor.update(updates);
      this.render(true);
    } catch (error) {
      console.error("Hollow Knight RPG | Resource update failed", error);
      ui.notifications.error("Не удалось обновить запас персонажа. Подробности — в консоли (F12).");
    }
  }

  async _onCreateCharm(event) {
    event.preventDefault();
    if (!this.isEditable) return;
    try {
      const [charm] = await this.actor.createEmbeddedDocuments("Item", [{
        name: "Новый амулет", type: "charm", img: "icons/svg/item-bag.svg",
        system: { notches: 1, equipped: false, overcharmed: false }
      }]);
      charm?.sheet?.render(true);
      this.render(true);
    } catch (error) {
      console.error("Hollow Knight RPG | Failed to create Charm", error);
      ui.notifications.error("Не удалось создать амулет. Подробности — в консоли (F12).");
    }
  }

  async _onEditCharm(event) {
    event.preventDefault();
    const item = this.actor.items.get(event.currentTarget.dataset.editCharm);
    if (item?.type === "charm") item.sheet.render(true);
  }

  async _onUnequipCharm(event) {
    event.preventDefault();
    if (!this.isEditable) return;
    const item = this.actor.items.get(event.currentTarget.dataset.unequipCharm);
    if (item?.type !== "charm" || !item.system.equipped) return;
    try {
      await item.update({ "system.equipped": false, "system.overcharmed": false });
      this.render(true);
    } catch (error) {
      console.error("Hollow Knight RPG | Failed to unequip Charm", error);
      ui.notifications.error("Не удалось снять амулет. Подробности — в консоли (F12).");
    }
  }

  _onDragStart(event) {
    const itemId = event.currentTarget?.dataset?.charmItemId;
    const item = itemId ? this.actor.items.get(itemId) : null;
    if (!item) return super._onDragStart(event);
    event.dataTransfer.setData("text/plain", JSON.stringify(item.toDragData()));
  }

  async _onDrop(event) {
    const dropzone = event.target?.closest?.("[data-charm-dropzone]");
    if (!dropzone) return super._onDrop(event);
    event.preventDefault();
    event.stopPropagation();
    if (!this.isEditable) return false;

    let data;
    try {
      data = TextEditor.getDragEventData(event);
    } catch (error) {
      console.warn("Hollow Knight RPG | Could not read dropped Item data", error);
      return false;
    }
    if (data?.type !== "Item" || !data.uuid) {
      ui.notifications.warn("Сюда можно перетащить только предмет типа «Амулет».");
      return false;
    }

    let item;
    try {
      item = await fromUuid(data.uuid);
    } catch (error) {
      console.error("Hollow Knight RPG | Failed to resolve dropped Item", error);
      return false;
    }
    if (!item || item.documentName !== "Item" || item.type !== "charm") {
      ui.notifications.warn("Эта область принимает только амулеты.");
      return false;
    }

    return dropzone.dataset.charmDropzone === "equipped"
      ? this._equipDroppedCharm(item)
      : this._moveDroppedCharmToCollection(item);
  }

  async _equipDroppedCharm(sourceItem) {
    if (sourceItem.parent === this.actor && sourceItem.system.equipped) return true;
    const equipped = this.actor.items.filter((item) =>
      item.type === "charm" && item.system.equipped && item.id !== sourceItem.id
    );
    const result = evaluateCharmEquip(this.actor.system.derived.notchesMax, equipped, sourceItem);
    if (!result.allowed) {
      const messages = {
        duplicate: "HKRPG.Charms.ErrorDuplicate",
        "no-free-notch": "HKRPG.Charms.ErrorNoFreeNotch",
        "already-overcharmed": "HKRPG.Charms.ErrorAlreadyOvercharmed"
      };
      ui.notifications.warn(game.i18n.localize(messages[result.reason] ?? "HKRPG.Charms.ErrorCannotEquip"));
      return false;
    }

    try {
      if (sourceItem.parent === this.actor) {
        await sourceItem.update({
          "system.equipped": true,
          "system.overcharmed": result.overcharmed
        });
      } else {
        const itemData = sourceItem.toObject();
        delete itemData._id;
        itemData.system = { ...itemData.system, equipped: true, overcharmed: result.overcharmed };
        await this.actor.createEmbeddedDocuments("Item", [itemData]);
      }
      this.render(true);
      return true;
    } catch (error) {
      console.error("Hollow Knight RPG | Failed to equip Charm", error);
      ui.notifications.error("Не удалось надеть амулет. Подробности — в консоли (F12).");
      return false;
    }
  }

  async _moveDroppedCharmToCollection(sourceItem) {
    try {
      if (sourceItem.parent === this.actor) {
        if (sourceItem.system.equipped) {
          await sourceItem.update({ "system.equipped": false, "system.overcharmed": false });
        }
      } else {
        const itemData = sourceItem.toObject();
        delete itemData._id;
        itemData.system = { ...itemData.system, equipped: false, overcharmed: false };
        await this.actor.createEmbeddedDocuments("Item", [itemData]);
      }
      this.render(true);
      return true;
    } catch (error) {
      console.error("Hollow Knight RPG | Failed to move Charm to collection", error);
      ui.notifications.error("Не удалось переместить амулет. Подробности — в консоли (F12).");
      return false;
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
