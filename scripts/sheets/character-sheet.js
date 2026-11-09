import { rollAttributeCheck } from "../rolls/pool.js";
import { buildResourcePips } from "../rules/resource-tracker.js";
import {
  buildFeatureRows,
  buildSkillGroups,
  buildTraitTree,
  buildTraitCardSlots,
  buildLegacyTraitRows,
  buildLegacyPathRows,
  buildTechniqueSlots,
  buildTechniqueSlotCards,
  summarizePaths
} from "../rules/feature-sheet.js";
import { buildCharmNotchState, evaluateCharmEquip } from "../rules/charm-tracker.js";
import { buildEquipmentRows } from "../rules/equipment-sheet.js";

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
        { dragSelector: "[data-charm-item-id]", dropSelector: "[data-charm-dropzone]" },
        { dragSelector: "[data-technique-item-id]", dropSelector: "[data-technique-dropzone]" },
        { dragSelector: "[data-trait-item-id]", dropSelector: "[data-trait-dropzone]" },
        { dragSelector: "[data-equipment-item-id]", dropSelector: "[data-equipment-dropzone]" }
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
    const traitItems = items.filter((item) => item.type === "trait");
    const pathItems = items.filter((item) => item.type === "path");
    const charms = items.filter((item) => item.type === "charm");
    const featureSheet = this.actor.system.featureSheet;
    const legacyTraits = buildLegacyTraitRows(
      featureSheet.traits,
      traitItems.filter((item) => item.system.kind === "main")
    );
    const legacyPaths = buildLegacyPathRows(featureSheet.paths, pathItems);
    const pathSummary = summarizePaths(pathItems);
    const legacyPathRanks = legacyPaths.reduce((total, path) => total + path.rank, 0);
    pathSummary.legacyRanks = legacyPathRanks;
    pathSummary.totalRanks += legacyPathRanks;
    const notchesMaximum = this._getNotchesMaximum();

    context.itemGroups = {
      traits: traitItems,
      paths: pathItems,
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
    context.equipmentRows = buildEquipmentRows(context.itemGroups.equipment, 10, ["weight"]);
    context.combatEquipmentRows = buildEquipmentRows(
      [...context.itemGroups.weapons, ...context.itemGroups.shields],
      5,
      ["weight", "damage", "range", "quantity"]
    );
    context.armorRows = buildEquipmentRows(context.itemGroups.armor, 1, ["weight", "protection", "durability"]);

    context.charmNotches = buildCharmNotchState(notchesMaximum, charms);
    context.notchBonus = this.actor.system.resources.notchesBonus;

    context.traitTree = buildTraitTree(traitItems);
    context.traitSlots = buildTraitCardSlots(7, context.traitTree, legacyTraits);
    context.traitCount = context.traitTree.count + legacyTraits.length;
    context.canAddTrait = context.traitCount < 7;
    context.traitTotals = context.traitTree.totals;
    context.legacyTraits = legacyTraits;
    context.pathSummary = pathSummary;
    context.legacyPaths = legacyPaths;
    context.techniqueSlotBonus = resources.techniqueSlotsBonus;
    context.techniqueRows = buildTechniqueSlots(
      featureSheet.techniques,
      this.actor.system.derived.techniqueSlots
    );
    context.techniqueSlots = buildTechniqueSlotCards(
      this.actor.system.derived.techniqueSlots,
      context.itemGroups.techniques,
      context.techniqueRows
    );
    context.unpreparedTechniques = context.itemGroups.techniques.filter((item) =>
      Number(item.system.preparedSlot ?? 0) === 0
    );
    context.preparedTechniqueCount = context.techniqueSlots.filter((slot) => slot.item || slot.legacy).length;
    context.skillGroups = buildSkillGroups(this.actor.system.skillGroups);

    return context;
  }

  async _onChangeInput(event) {
    // Keep submitOnChange writes observable so custom sheet actions can wait for them.
    const submission = super._onChangeInput(event);
    this._hkrpgPendingFormSubmission = submission;
    try {
      return await submission;
    } finally {
      if (this._hkrpgPendingFormSubmission === submission) {
        this._hkrpgPendingFormSubmission = null;
      }
    }
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
    bind("[data-skill-mastery]", "change", this._onSkillMasteryChange);
    bind("[data-create-equipment-row]", "click", this._onCreateEquipmentRow);
    bind("[data-equipment-field]", "change", this._onEquipmentFieldChange);
    bind("[data-delete-equipment-item]", "click", this._onDeleteEquipmentItem);
    bind("[data-create-trait]", "click", this._onCreateTrait);
    bind("[data-create-subtrait]", "click", this._onCreateSubtrait);
    bind("[data-create-path]", "click", this._onCreatePath);
    bind("[data-edit-feature-item]", "click", this._onEditFeatureItem);
    bind("[data-delete-feature-item]", "click", this._onDeleteFeatureItem);
    bind("[data-path-rank]", "change", this._onPathRankChange);
    bind("[data-migrate-legacy-features]", "click", this._onMigrateLegacyFeatures);
    bind("[data-create-charm]", "click", this._onCreateCharm);
    bind("[data-edit-charm]", "click", this._onEditCharm);
    bind("[data-unprepare-technique]", "click", this._onUnprepareTechnique);
    bind("[data-unequip-charm]", "click", this._onUnequipCharm);
    bind("[data-attribute-roll]", "click", this._onRollAttribute);
    bind("[data-reset-derived]", "click", this._onResetDerived);
    bind("[data-derived-input]", "change", this._onDerivedInputChange);
  }

  async _onSkillMasteryChange(event) {
    if (!this.isEditable) return;
    const input = event.currentTarget;
    const [groupId, skillId] = String(input.dataset.skillMastery ?? "").split(".");
    if (!/^group[1-3]$/.test(groupId) || !/^skill[1-4]$/.test(skillId)) return;

    const group = this.actor.system.skillGroups?.[groupId];
    if (!group || Number(group.rank) !== 3) {
      input.checked = false;
      return;
    }

    const updates = {};
    const legacySkillId = String(group.masterySkill ?? "");
    for (let index = 1; index <= 4; index += 1) {
      const currentSkillId = `skill${index}`;
      const currentMastery = Number(group.skills?.[currentSkillId]?.mastery ?? 0);
      if (legacySkillId === currentSkillId && currentMastery < 3) {
        updates[`system.skillGroups.${groupId}.skills.${currentSkillId}.mastery`] = 3;
      }
    }

    updates[`system.skillGroups.${groupId}.skills.${skillId}.mastery`] = input.checked ? 3 : 0;
    updates[`system.skillGroups.${groupId}.masterySkill`] = "";
    try {
      await this.actor.update(updates);
      this.render(false);
    } catch (error) {
      console.error("Hollow Knight RPG | Skill mastery update failed", error);
      input.checked = !input.checked;
      ui.notifications.error("Не удалось изменить мастерство навыка. Подробности — в консоли (F12).");
    }
  }

  async _onCreateEquipmentRow(event) {
    event.preventDefault();
    if (!this.isEditable) return;
    const type = event.currentTarget.dataset.createEquipmentRow;
    const definitions = {
      equipment: { name: "Новое снаряжение", system: { weight: 0, quantity: 1 } },
      weapon: { name: "Новое оружие", system: { weight: 0, damage: "", range: "", quantity: 1 } },
      armor: { name: "Новая броня", system: { weight: 0, protection: "", durability: 0 } }
    };
    const definition = definitions[type];
    if (!definition) return;
    try {
      await this.actor.createEmbeddedDocuments("Item", [{
        name: definition.name,
        type,
        img: "icons/svg/item-bag.svg",
        system: definition.system
      }]);
      this.render(true);
    } catch (error) {
      console.error("Hollow Knight RPG | Failed to create equipment row", error);
      ui.notifications.error("Не удалось добавить строку. Подробности — в консоли (F12).");
    }
  }

  async _onEquipmentFieldChange(event) {
    if (!this.isEditable) return;
    const input = event.currentTarget;
    const item = this.actor.items.get(input.dataset.equipmentId);
    const field = input.dataset.equipmentField;
    if (!item || !["equipment", "weapon", "shield", "armor"].includes(item.type)) return;
    const allowed = {
      equipment: ["weight", "quantity"],
      weapon: ["weight", "damage", "range", "quantity"],
      shield: ["weight", "damage", "range", "quantity"],
      armor: ["weight", "protection", "durability"]
    };
    if (field !== "name" && !allowed[item.type]?.includes(field)) return;

    let value = input.value;
    if (["weight", "quantity", "durability"].includes(field)) {
      value = value.trim() === "" ? 0 : Number(value);
      if (!Number.isFinite(value) || value < 0) {
        input.value = String(field === "name" ? item.name : item.system[field] ?? 0);
        ui.notifications.warn("Введите корректное число не меньше нуля.");
        return;
      }
      if (field === "quantity" || field === "durability") value = Math.floor(value);
    }
    try {
      await item.update(field === "name" ? { name: value } : { [`system.${field}`]: value });
      this.render(false);
    } catch (error) {
      console.error("Hollow Knight RPG | Equipment field update failed", error);
      ui.notifications.error("Не удалось сохранить значение предмета. Подробности — в консоли (F12).");
    }
  }

  async _onDeleteEquipmentItem(event) {
    event.preventDefault();
    if (!this.isEditable) return;
    const item = this.actor.items.get(event.currentTarget.dataset.deleteEquipmentItem);
    if (!item || !["equipment", "weapon", "shield", "armor"].includes(item.type)) return;
    try {
      await item.delete();
      this.render(true);
    } catch (error) {
      console.error("Hollow Knight RPG | Failed to delete equipment item", error);
      ui.notifications.error("Не удалось удалить предмет. Подробности — в консоли (F12).");
    }
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
      // A text field may submit on blur at the same time this reset button is clicked.
      // Wait for that write, then flush the current form before changing only the override.
      if (this._hkrpgPendingFormSubmission) await this._hkrpgPendingFormSubmission;
      await this.submit({ preventClose: true });
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

  async _onCreateTrait(event) {
    event.preventDefault();
    if (!this.isEditable) return;
    const mainTraits = this.actor.items.filter((item) =>
      item.type === "trait" && item.system.kind === "main"
    );
    const legacyTraits = buildLegacyTraitRows(this.actor.system.featureSheet.traits, mainTraits);
    const mainTraitCount = mainTraits.length + legacyTraits.length;
    if (mainTraitCount >= 7) {
      ui.notifications.warn(game.i18n.localize("HKRPG.Features.MainTraitLimitReached"));
      return;
    }
    await this._createTrait("main", "");
  }

  async _onCreateSubtrait(event) {
    event.preventDefault();
    if (!this.isEditable) return;
    const parentId = event.currentTarget.dataset.createSubtrait;
    const parent = this.actor.items.get(parentId);
    if (parent?.type !== "trait") return;
    const kind = parent.system.kind === "main" ? "subtrait" : "subtrait2";
    await this._createTrait(kind, parent.id);
  }

  async _createTrait(kind, parentId) {
    try {
      const labels = {
        main: "Новая черта",
        subtrait: "Новая подчерта",
        subtrait2: "Новая подчерта II"
      };
      const [item] = await this.actor.createEmbeddedDocuments("Item", [{
        name: labels[kind] ?? "Новая черта",
        type: "trait",
        img: "icons/svg/upgrade.svg",
        system: { kind, parentId, category: "unassigned", hunger: 0, cute: 0, spook: 0 }
      }]);
      item?.sheet?.render(true);
      this.render(true);
    } catch (error) {
      console.error("Hollow Knight RPG | Failed to create Trait", error);
      ui.notifications.error("Не удалось создать черту. Подробности — в консоли (F12).");
    }
  }

  async _onCreatePath(event) {
    event.preventDefault();
    if (!this.isEditable) return;
    try {
      const [item] = await this.actor.createEmbeddedDocuments("Item", [{
        name: "Новый Путь",
        type: "path",
        img: "icons/svg/wing.svg",
        system: { pathType: "unassigned", rank: 1 }
      }]);
      item?.sheet?.render(true);
      this.render(true);
    } catch (error) {
      console.error("Hollow Knight RPG | Failed to create Path", error);
      ui.notifications.error("Не удалось создать Путь. Подробности — в консоли (F12).");
    }
  }

  async _onEditFeatureItem(event) {
    event.preventDefault();
    const item = this.actor.items.get(event.currentTarget.dataset.editFeatureItem);
    if (item && ["trait", "path"].includes(item.type)) item.sheet.render(true);
  }

  async _onDeleteFeatureItem(event) {
    event.preventDefault();
    if (!this.isEditable) return;
    const item = this.actor.items.get(event.currentTarget.dataset.deleteFeatureItem);
    if (!item || !["trait", "path"].includes(item.type)) return;

    const confirmed = await Dialog.confirm({
      title: "Удалить запись?",
      content: `<p>Удалить «${foundry.utils.escapeHTML(item.name)}»?</p>`
    });
    if (!confirmed) return;

    try {
      await item.delete();
      this.render(true);
    } catch (error) {
      console.error("Hollow Knight RPG | Failed to delete Feature item", error);
      ui.notifications.error("Не удалось удалить запись. Подробности — в консоли (F12).");
    }
  }

  async _onPathRankChange(event) {
    if (!this.isEditable) return;
    const input = event.currentTarget;
    const item = this.actor.items.get(input.dataset.pathRank);
    if (item?.type !== "path") return;
    const rank = Number(input.value);
    if (!Number.isInteger(rank) || rank < 1 || rank > 3) {
      input.value = String(item.system.rank);
      return;
    }
    try {
      await item.update({ "system.rank": rank });
      this.render(true);
    } catch (error) {
      console.error("Hollow Knight RPG | Failed to update Path rank", error);
      ui.notifications.error("Не удалось изменить Ранг Пути.");
    }
  }

  async _onMigrateLegacyFeatures(event) {
    event.preventDefault();
    if (!this.isEditable) return;
    const featureSheet = this.actor.system.featureSheet;
    const oldTraits = buildLegacyTraitRows(featureSheet.traits);
    const oldPaths = buildLegacyPathRows(featureSheet.paths);
    if (!oldTraits.length && !oldPaths.length) return;

    const confirmed = await Dialog.confirm({
      title: "Перенести старые записи?",
      content: "<p>Старые названия и Ранги будут перенесены. Старые галочки Черты нельзя достоверно преобразовать в числовые модификаторы — для них будут установлены нули, чтобы ты мог сверить их с книгой.</p>"
    });
    if (!confirmed) return;

    try {
      const existingTraitNames = new Set(this.actor.items
        .filter((item) => item.type === "trait" && item.system.kind === "main")
        .map((item) => String(item.name ?? "").trim().normalize("NFC").toLocaleLowerCase("ru")));
      const existingPathNames = new Set(this.actor.items
        .filter((item) => item.type === "path")
        .map((item) => String(item.name ?? "").trim().normalize("NFC").toLocaleLowerCase("ru")));

      const createData = [
        ...oldTraits
          .filter((trait) => !existingTraitNames.has(trait.name.normalize("NFC").toLocaleLowerCase("ru")))
          .map((trait) => ({
            name: trait.name,
            type: "trait",
            img: "icons/svg/upgrade.svg",
            system: {
              kind: "main", parentId: "", hunger: 0, cute: 0, spook: 0,
              description: `Перенесено из старого листа. Старые отметки: Привлекательность ${trait.attraction ? "✓" : "—"}, Жуть ${trait.spook ? "✓" : "—"}, Голод ${trait.hunger ? "✓" : "—"}. Проверь числовые значения по книге правил.`
            }
          })),
        ...oldPaths
          .filter((path) => !existingPathNames.has(path.name.normalize("NFC").toLocaleLowerCase("ru")))
          .map((path) => ({
            name: path.name,
            type: "path",
            img: "icons/svg/wing.svg",
            system: { pathType: "unassigned", rank: Math.max(1, Math.min(3, path.rank || 1)) }
          }))
      ];

      if (createData.length) await this.actor.createEmbeddedDocuments("Item", createData);

      // Clear the legacy rows only after Item creation succeeds; a retry will not duplicate Items.
      const clearLegacy = {};
      for (let index = 1; index <= 10; index += 1) {
        const base = `system.featureSheet.traits.slot${index}`;
        clearLegacy[`${base}.name`] = "";
        clearLegacy[`${base}.attraction`] = false;
        clearLegacy[`${base}.spook`] = false;
        clearLegacy[`${base}.hunger`] = false;
      }
      for (let index = 1; index <= 6; index += 1) {
        const base = `system.featureSheet.paths.slot${index}`;
        clearLegacy[`${base}.name`] = "";
        clearLegacy[`${base}.rank1`] = false;
        clearLegacy[`${base}.rank2`] = false;
        clearLegacy[`${base}.rank3`] = false;
      }
      await this.actor.update(clearLegacy);

      this.render(true);
      ui.notifications.info("Старые записи перенесены. Для Черты проверь числовые модификаторы; для каждого Пути выбери тип.");
    } catch (error) {
      console.error("Hollow Knight RPG | Legacy Features migration failed", error);
      ui.notifications.error("Не удалось перенести старые записи.");
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
    const itemId = event.currentTarget?.dataset?.charmItemId
      ?? event.currentTarget?.dataset?.techniqueItemId
      ?? event.currentTarget?.dataset?.traitItemId
      ?? event.currentTarget?.dataset?.equipmentItemId;
    const item = itemId ? this.actor.items.get(itemId) : null;
    if (!item) return super._onDragStart(event);
    event.dataTransfer.setData("text/plain", JSON.stringify(item.toDragData()));
  }

  async _onDrop(event) {
    const charmDropzone = event.target?.closest?.("[data-charm-dropzone]");
    const techniqueDropzone = event.target?.closest?.("[data-technique-dropzone]");
    const traitDropzone = event.target?.closest?.("[data-trait-dropzone]");
    const equipmentDropzone = event.target?.closest?.("[data-equipment-dropzone]");
    if (!charmDropzone && !techniqueDropzone && !traitDropzone && !equipmentDropzone) return super._onDrop(event);
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
      ui.notifications.warn("Перетащите предмет из библиотеки Foundry.");
      return false;
    }

    let item;
    try {
      item = await fromUuid(data.uuid);
    } catch (error) {
      console.error("Hollow Knight RPG | Failed to resolve dropped Item", error);
      return false;
    }
    if (!item || item.documentName !== "Item") return false;

    if (traitDropzone) {
      if (item.type !== "trait" || item.system.kind !== "main") {
        ui.notifications.warn("В основные ячейки можно помещать только основные Черты.");
        return false;
      }
      return this._prepareDroppedTrait(item, traitDropzone.dataset.traitDropzone);
    }

    if (techniqueDropzone) {
      if (item.type !== "technique") {
        ui.notifications.warn("В ячейки техник можно помещать только Искусства и Тайны.");
        return false;
      }
      return this._prepareDroppedTechnique(item, techniqueDropzone.dataset.techniqueDropzone);
    }

    if (equipmentDropzone) {
      const supportedTypes = new Set(["equipment", "weapon", "shield", "armor"]);
      if (!supportedTypes.has(item.type)) {
        ui.notifications.warn("В снаряжение можно переносить предметы типов «Оружие», «Снаряжение» и «Броня».");
        return false;
      }
      if (item.parent === this.actor) return true;
      try {
        const itemData = item.toObject();
        delete itemData._id;
        await this.actor.createEmbeddedDocuments("Item", [itemData]);
        this.render(true);
        return true;
      } catch (error) {
        console.error("Hollow Knight RPG | Failed to add dropped equipment", error);
        ui.notifications.error("Не удалось добавить предмет. Подробности — в консоли (F12).");
        return false;
      }
    }

    if (item.type !== "charm") {
      ui.notifications.warn("Эта область принимает только амулеты.");
      return false;
    }
    return charmDropzone.dataset.charmDropzone === "equipped"
      ? this._equipDroppedCharm(item)
      : this._moveDroppedCharmToCollection(item);
  }

  async _prepareDroppedTrait(sourceItem, slotValue) {
    const slot = Number(slotValue);
    if (!Number.isInteger(slot) || slot < 1 || slot > 7) return false;
    if (sourceItem.system.kind !== "main") return false;

    const mainTraits = this.actor.items.filter((item) =>
      item.type === "trait" && item.system.kind === "main"
    );
    const legacyTraits = buildLegacyTraitRows(this.actor.system.featureSheet.traits, mainTraits);
    if (sourceItem.parent !== this.actor && mainTraits.length + legacyTraits.length >= 7) {
      ui.notifications.warn(game.i18n.localize("HKRPG.Features.MainTraitLimitReached"));
      return false;
    }

    const occupying = mainTraits.find((item) =>
      Number(item.system.slot ?? 0) === slot && item.id !== sourceItem.id
    );
    if (occupying) {
      ui.notifications.warn("Эта ячейка уже занята. Сначала освободите её.");
      return false;
    }

    try {
      if (sourceItem.parent === this.actor) {
        await sourceItem.update({ "system.slot": slot });
      } else {
        const itemData = sourceItem.toObject();
        delete itemData._id;
        itemData.system = { ...itemData.system, kind: "main", parentId: "", slot };
        await this.actor.createEmbeddedDocuments("Item", [itemData]);
      }
      this.render(true);
      return true;
    } catch (error) {
      console.error("Hollow Knight RPG | Failed to add Trait", error);
      ui.notifications.error("Не удалось добавить Черту. Подробности — в консоли (F12).");
      return false;
    }
  }

  async _prepareDroppedTechnique(sourceItem, slotValue) {
    const slot = Number(slotValue);
    const maximum = Math.max(0, Math.min(106, Number(this.actor.system.derived.techniqueSlots ?? 0)));
    if (!Number.isInteger(slot) || slot < 1 || slot > maximum) return false;

    const occupying = this.actor.items.find((item) =>
      item.type === "technique" &&
      Number(item.system.preparedSlot ?? 0) === slot &&
      item.id !== sourceItem.id
    );
    if (occupying) {
      ui.notifications.warn("Эта ячейка уже занята. Сначала освободите её.");
      return false;
    }

    try {
      if (sourceItem.parent === this.actor) {
        await sourceItem.update({ "system.preparedSlot": slot });
      } else {
        const itemData = sourceItem.toObject();
        delete itemData._id;
        itemData.system = { ...itemData.system, preparedSlot: slot };
        itemData.flags = foundry.utils.mergeObject(itemData.flags ?? {}, {
          hkrpg: { sourceUuid: sourceItem.uuid }
        });
        await this.actor.createEmbeddedDocuments("Item", [itemData]);
      }
      this.render(true);
      return true;
    } catch (error) {
      console.error("Hollow Knight RPG | Failed to prepare Technique", error);
      ui.notifications.error("Не удалось поместить технику в ячейку. Подробности — в консоли (F12).");
      return false;
    }
  }

  async _onUnprepareTechnique(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.isEditable) return;
    const item = this.actor.items.get(event.currentTarget.dataset.unprepareTechnique);
    if (item?.type !== "technique") return;
    try {
      await item.update({ "system.preparedSlot": 0 });
      this.render(true);
    } catch (error) {
      console.error("Hollow Knight RPG | Failed to unprepare Technique", error);
      ui.notifications.error("Не удалось освободить ячейку техники.");
    }
  }

  _getNotchesMaximum() {
    const pathItems = this.actor.items.filter((item) => item.type === "path");
    const legacyPaths = buildLegacyPathRows(this.actor.system.featureSheet.paths, pathItems);
    const assignedRanks = summarizePaths(pathItems).totalRanks;
    const legacyRanks = legacyPaths.reduce((total, path) => total + path.rank, 0);
    const extra = Number(this.actor.system.resources.notchesBonus ?? 0);
    return Math.max(0, 3 + assignedRanks + legacyRanks + (Number.isFinite(extra) ? Math.floor(extra) : 0));
  }

  async _equipDroppedCharm(sourceItem) {
    if (sourceItem.parent === this.actor && sourceItem.system.equipped) return true;
    const equipped = this.actor.items.filter((item) =>
      item.type === "charm" && item.system.equipped && item.id !== sourceItem.id
    );
    const result = evaluateCharmEquip(this._getNotchesMaximum(), equipped, sourceItem);
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
