import { HKCharacterData, HKSmallBugData, HKMediumBugData, HKLargeBugData } from "./data/character-data.js";
import { buildBugActorDefaults } from "./data/bug-templates.js";
import { buildTraitLibraryLayout, buildTraitItemData } from "./data/trait-library.js";
import { HKCharacterSheet } from "./sheets/character-sheet.js";
import { HKCharmData } from "./data/charm-data.js";
import { HKCharmSheet } from "./sheets/charm-sheet.js";
import { HKTraitData, HKPathData } from "./data/feature-item-data.js";
import { HKTechniqueData } from "./data/technique-data.js";
import { HKInventoryItemData } from "./data/inventory-item-data.js";
import { HKFeatureItemSheet } from "./sheets/feature-item-sheet.js";
import { HK_EFFECT_CATALOG, getOrderedEffectStatuses } from "./data/effects-catalog.js";
import { HKStatusData } from "./data/status-data.js";
import { HKStatusSheet } from "./sheets/status-sheet.js";
import { buildStatusItemData } from "./rules/status-items.js";
import { buildCombatEquipmentLibrary, buildCombatEquipmentItemData } from "./data/combat-equipment-library.js";
import { HKInventoryItemSheet } from "./sheets/inventory-item-sheet.js";
import { planCatalogEffectDeduplication } from "./rules/effects-sheet.js";
import { activateD6RollControls } from "./rolls/chat-reroll.js";

Hooks.once("init", () => {
  console.log("Hollow Knight RPG | Initializing system");

  // Put the seven core HKRPG combat conditions at the top of the Token HUD.
  // Native Foundry entries are reused where they already represent the condition.
  CONFIG.statusEffects = getOrderedEffectStatuses(CONFIG.statusEffects ?? []);

  CONFIG.Actor.dataModels.character = HKCharacterData;
  CONFIG.Actor.dataModels.largeBug = HKLargeBugData;
  CONFIG.Actor.dataModels.mediumBug = HKMediumBugData;
  CONFIG.Actor.dataModels.smallBug = HKSmallBugData;
  CONFIG.Item.dataModels.charm = HKCharmData;
  CONFIG.Item.dataModels.trait = HKTraitData;
  CONFIG.Item.dataModels.path = HKPathData;
  CONFIG.Item.dataModels.technique = HKTechniqueData;
  CONFIG.Item.dataModels.status = HKStatusData;
  for (const type of ["equipment", "weapon", "shield", "armor"]) {
    CONFIG.Item.dataModels[type] = HKInventoryItemData;
  }

  Actors.unregisterSheet("core", ActorSheet);
  Items.registerSheet("hollow-knight-rpg", HKFeatureItemSheet, {
    types: ["trait", "path", "technique"],
    makeDefault: true,
    label: "HKRPG.Sheets.FeatureItem"
  });

  Items.registerSheet("hollow-knight-rpg", HKInventoryItemSheet, {
    types: ["weapon", "shield", "armor"],
    makeDefault: true,
    label: "HKRPG.Sheets.InventoryItem"
  });

  Items.registerSheet("hollow-knight-rpg", HKCharmSheet, {
    types: ["charm"],
    makeDefault: true,
    label: "HKRPG.Sheets.Charm"
  });

  Items.registerSheet("hollow-knight-rpg", HKStatusSheet, {
    types: ["status"],
    makeDefault: true,
    label: "HKRPG.Sheets.Status"
  });

  Actors.registerSheet("hollow-knight-rpg", HKCharacterSheet, {
    types: ["character", "largeBug", "mediumBug", "smallBug"],
    makeDefault: true,
    label: "HKRPG.Sheets.Character"
  });

});


const BUG_ACTOR_TYPES = ["largeBug", "mediumBug", "smallBug"];
Hooks.on("preCreateActor", (actor) => {
  if (!BUG_ACTOR_TYPES.includes(actor.type)) return;
  const defaults = buildBugActorDefaults(actor.type);
  // The type-specific DataModel owns system defaults; this hook only sets token footprint.
  actor.updateSource({ prototypeToken: defaults.prototypeToken });
});

async function ensureTraitLibrary() {
  if (!game.user?.isGM || !game.items) return;

  const layout = buildTraitLibraryLayout();
  const observer = CONST.DOCUMENT_OWNERSHIP_LEVELS?.OBSERVER ?? 2;
  const folderByKey = new Map();
  const managedFolders = game.folders.filter((folder) =>
    folder.type === "Item" && folder.getFlag?.("hkrpg", "traitLibraryFolder")
  );

  for (const definition of layout.folders) {
    const parent = definition.parentKey ? folderByKey.get(definition.parentKey) : null;
    if (definition.parentKey && !parent) {
      throw new Error(`Missing parent folder ${definition.parentKey} for ${definition.key}`);
    }

    let folder = game.folders.find((entry) =>
      entry.type === "Item" &&
      entry.getFlag?.("hkrpg", "traitLibraryFolderKey") === definition.key
    );

    // Adopt category folders made by the earlier library seeder instead of
    // leaving duplicate categories in the Items directory.
    if (!folder && definition.kind === "category") {
      folder = managedFolders.find((entry) =>
        entry.name === definition.name &&
        !entry.getFlag?.("hkrpg", "traitLibraryFolderKey")
      );
    }

    const folderUpdate = {
      name: definition.name,
      folder: parent?.id ?? null,
      ownership: { default: observer },
      "flags.hkrpg.traitLibraryFolder": true,
      "flags.hkrpg.traitLibraryFolderKey": definition.key
    };
    if (folder) {
      await folder.update(folderUpdate);
    } else {
      folder = await Folder.implementation.create({
        name: definition.name,
        type: "Item",
        folder: parent?.id ?? null,
        ownership: { default: observer },
        flags: {
          hkrpg: {
            traitLibraryFolder: true,
            traitLibraryFolderKey: definition.key
          }
        }
      });
    }
    folderByKey.set(definition.key, folder);
  }

  const byLibraryId = new Map();
  const duplicateIds = [];
  for (const item of game.items.contents) {
    const libraryId = item.getFlag?.("hkrpg", "traitLibraryId");
    if (item.type !== "trait" || !libraryId) continue;
    if (byLibraryId.has(libraryId)) duplicateIds.push(item.id);
    else byLibraryId.set(libraryId, item);
  }
  if (duplicateIds.length) await Item.implementation.deleteDocuments(duplicateIds);

  const missing = [];
  for (const record of layout.items) {
    const data = buildTraitItemData(record.entry);
    const folder = folderByKey.get(record.folderKey);
    if (!folder) throw new Error(`Missing destination folder ${record.folderKey}`);

    const existing = byLibraryId.get(record.entry.id);
    if (!existing) {
      missing.push({
        ...data,
        folder: folder.id,
        ownership: { default: observer },
        flags: {
          hkrpg: {
            traitLibraryId: record.entry.id,
            traitLibraryVersion: 2
          }
        }
      });
      continue;
    }

    await existing.update({
      name: data.name,
      img: data.img,
      folder: folder.id,
      ownership: { default: observer },
      system: data.system,
      "flags.hkrpg.traitLibraryId": record.entry.id,
      "flags.hkrpg.traitLibraryVersion": 2
    });
  }

  if (missing.length) await Item.implementation.createDocuments(missing);

  // Remove only empty, obsolete subfolders created by the previous seeder.
  // Preserve folders containing user-created Items or any remaining subfolders.
  const obsoleteFolders = managedFolders.filter((folder) =>
    folder.getFlag?.("hkrpg", "traitLibraryFolder") &&
    !folder.getFlag?.("hkrpg", "traitLibraryFolderKey")
  );
  const folderDepth = (folder) => {
    let depth = 0;
    let parent = folder.folder;
    while (parent && depth < 32) {
      depth += 1;
      parent = parent.folder;
    }
    return depth;
  };
  obsoleteFolders.sort((a, b) => folderDepth(b) - folderDepth(a));
  for (const folder of obsoleteFolders) {
    const containsItems = game.items.contents.some((item) => item.folder?.id === folder.id);
    const containsFolders = game.folders.some((child) => child.folder?.id === folder.id);
    if (!containsItems && !containsFolders) await folder.delete();
  }

  console.log(`Hollow Knight RPG | Trait library ready (${layout.items.length} Items, ${layout.folders.length} folders)`);
}

async function ensureCombatEquipmentLibrary() {
  if (!game.user?.isGM || !game.items) return;

  const layout = buildCombatEquipmentLibrary();
  const folderByKey = new Map();

  for (const definition of layout.folders) {
    const parent = definition.parentKey ? folderByKey.get(definition.parentKey) : null;
    if (definition.parentKey && !parent) {
      throw new Error(`Missing parent folder ${definition.parentKey} for ${definition.key}`);
    }

    let folder = game.folders.find((entry) =>
      entry.type === "Item" &&
      entry.getFlag?.("hkrpg", "combatEquipmentLibraryFolderKey") === definition.key
    );
    const update = {
      name: definition.name,
      folder: parent?.id ?? null,
      "flags.hkrpg.combatEquipmentLibraryFolder": true,
      "flags.hkrpg.combatEquipmentLibraryFolderKey": definition.key
    };

    if (folder) {
      await folder.update(update);
    } else {
      folder = await Folder.implementation.create({
        name: definition.name,
        type: "Item",
        folder: parent?.id ?? null,
        flags: {
          hkrpg: {
            combatEquipmentLibraryFolder: true,
            combatEquipmentLibraryFolderKey: definition.key
          }
        }
      });
    }
    folderByKey.set(definition.key, folder);
  }

  const byLibraryId = new Map();
  const duplicates = [];
  for (const item of game.items.contents) {
    const libraryId = item.getFlag?.("hkrpg", "combatEquipmentLibraryId");
    if (!libraryId || !["weapon", "shield", "armor"].includes(item.type)) continue;
    if (byLibraryId.has(libraryId)) duplicates.push(item.id);
    else byLibraryId.set(libraryId, item);
  }
  if (duplicates.length) await Item.implementation.deleteDocuments(duplicates);

  const observer = CONST.DOCUMENT_OWNERSHIP_LEVELS?.OBSERVER ?? 2;
  const missing = [];
  for (const record of layout.items) {
    const data = buildCombatEquipmentItemData(record.entry);
    const folder = folderByKey.get(record.folderKey);
    if (!folder) throw new Error(`Missing destination folder ${record.folderKey}`);

    const existing = byLibraryId.get(record.entry.id);
    if (!existing) {
      missing.push({
        ...data,
        folder: folder.id,
        ownership: { default: observer },
        flags: {
          hkrpg: {
            combatEquipmentLibraryId: record.entry.id,
            combatEquipmentLibraryVersion: 1
          }
        }
      });
      continue;
    }

    await existing.update({
      name: data.name,
      img: data.img,
      folder: folder.id,
      ownership: { default: observer },
      system: data.system,
      "flags.hkrpg.combatEquipmentLibraryId": record.entry.id,
      "flags.hkrpg.combatEquipmentLibraryVersion": 1
    });
  }

  if (missing.length) await Item.implementation.createDocuments(missing);
  console.log(`Hollow Knight RPG | Combat equipment library ready (${layout.items.length} Items, ${layout.folders.length} folders)`);
}

async function ensureStatusReferenceItems() {
  if (!game.user?.isGM || !game.items) return;

  let folder = game.folders.find((entry) =>
    entry.type === "Item" && entry.getFlag?.("hkrpg", "statusReferenceFolder")
  );
  if (!folder) {
    folder = await Folder.implementation.create({
      name: "Hollow Knight RPG — Статусы",
      type: "Item",
      flags: { hkrpg: { statusReferenceFolder: true } }
    });
  }

  const byStatusId = new Map();
  const duplicates = [];
  for (const item of game.items.contents) {
    const statusId = item.getFlag?.("hkrpg", "statusReferenceId");
    if (item.type !== "status" || !statusId) continue;
    if (byStatusId.has(statusId)) duplicates.push(item.id);
    else byStatusId.set(statusId, item);
  }
  if (duplicates.length) await Item.implementation.deleteDocuments(duplicates);

  const missing = [];
  const observer = CONST.DOCUMENT_OWNERSHIP_LEVELS?.OBSERVER ?? 2;
  for (const definition of HK_EFFECT_CATALOG) {
    const data = buildStatusItemData(definition);
    const existing = byStatusId.get(definition.id);
    if (!existing) {
      missing.push({
        ...data,
        folder: folder.id,
        ownership: { default: observer }
      });
      continue;
    }

    await existing.update({
      name: data.name,
      img: data.img,
      folder: folder.id,
      ownership: { default: observer },
      "system.statusId": data.system.statusId,
      "system.summary": data.system.summary,
      "system.rules": data.system.rules,
      "system.duration": data.system.duration,
      "system.source": data.system.source,
      "system.page": data.system.page,
      "system.bookVersion": data.system.bookVersion,
      "flags.hkrpg.statusReferenceId": definition.id,
      "flags.hkrpg.statusReferenceVersion": 1
    });
  }

  if (missing.length) await Item.implementation.createDocuments(missing);
}

Hooks.once("ready", async () => {
  try {
    await ensureStatusReferenceItems();
  } catch (error) {
    console.error("Hollow Knight RPG | Could not prepare status reference Items", error);
  }

  try {
    await ensureCombatEquipmentLibrary();
  } catch (error) {
    console.error("Hollow Knight RPG | Could not prepare combat equipment library", error);
  }

  try {
    await ensureTraitLibrary();
  } catch (error) {
    console.error("Hollow Knight RPG | Could not prepare the trait library", error);
    if (game.user?.isGM) {
      ui.notifications.error("Не удалось создать библиотеку черт. Подробности — в консоли браузера (F12).");
    }
  }

  // Remove only stale effects that were generated by the previous, over-broad catalogue.
  // User-created Active Effects are left untouched.
  const currentIds = new Set(HK_EFFECT_CATALOG.map((effect) => effect.id));
  const actors = new Set(game.actors.contents);
  // Unlinked scene tokens own synthetic actors which are not in game.actors.
  for (const scene of game.scenes.contents) {
    for (const token of scene.tokens) {
      if (token.actor) actors.add(token.actor);
    }
  }
  for (const actor of actors) {
    const stale = actor.effects.filter((effect) => {
      const catalogId = effect.getFlag?.("hkrpg", "catalogId");
      return typeof catalogId === "string" && catalogId.startsWith("hkrpg-") && !currentIds.has(catalogId);
    });
    if (stale.length) {
      await actor.deleteEmbeddedDocuments("ActiveEffect", stale.map((effect) => effect.id));
    }

    const duplicatePlan = planCatalogEffectDeduplication(actor.effects, HK_EFFECT_CATALOG);
    for (const effectId of duplicatePlan.enableIds) {
      const effect = actor.effects.get(effectId);
      if (effect?.disabled) await effect.update({ disabled: false });
    }
    if (duplicatePlan.removeIds.length) {
      await actor.deleteEmbeddedDocuments("ActiveEffect", duplicatePlan.removeIds);
    }
  }
  console.log(`Hollow Knight RPG | Ready (v${game.system.version})`);
});
// Add selective reroll controls to all system d6-check chat cards.
Hooks.on("renderChatMessageHTML", (message, html) => {
  activateD6RollControls(message, html);
});

// Add full rules summaries to the native Token HUD status-icon tooltips.
Hooks.on("renderTokenHUD", (app, html) => {
  const root = html?.[0] ?? html;
  if (!root?.querySelectorAll) return;
  const definitions = new Map();
  for (const entry of HK_EFFECT_CATALOG) {
    definitions.set(entry.id, entry);
    if (entry.coreStatusId) definitions.set(entry.coreStatusId, entry);
  }
  for (const control of root.querySelectorAll("[data-status-id], .status-effects .effect-control")) {
    const statusId = control.dataset.statusId ?? control.dataset.status;
    const catalogEntry = definitions.get(statusId);
    if (!catalogEntry) continue;
    const tooltip = [catalogEntry.name, catalogEntry.summary, catalogEntry.rules, `Длительность: ${catalogEntry.duration}`, catalogEntry.source].join("\n\n");
    control.dataset.tooltip = tooltip;
    control.dataset.tooltipClass = "hkrpg-status-tooltip";
    control.setAttribute("title", tooltip);
    control.setAttribute("aria-label", catalogEntry.name);
  }
});
