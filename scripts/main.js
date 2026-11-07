import { HKCharacterData } from "./data/character-data.js";
import { HKCharacterSheet } from "./sheets/character-sheet.js";
import { HKCharmData } from "./data/charm-data.js";
import { HKCharmSheet } from "./sheets/charm-sheet.js";
import { HKTraitData, HKPathData } from "./data/feature-item-data.js";
import { HKFeatureItemSheet } from "./sheets/feature-item-sheet.js";

Hooks.once("init", () => {
  console.log("Hollow Knight RPG | Initializing system");

  CONFIG.Actor.dataModels.character = HKCharacterData;
  CONFIG.Item.dataModels.charm = HKCharmData;
  CONFIG.Item.dataModels.trait = HKTraitData;
  CONFIG.Item.dataModels.path = HKPathData;

  Actors.unregisterSheet("core", ActorSheet);
  Items.registerSheet("hollow-knight-rpg", HKFeatureItemSheet, {
    types: ["trait", "path"],
    makeDefault: true,
    label: "HKRPG.Sheets.FeatureItem"
  });

  Items.registerSheet("hollow-knight-rpg", HKCharmSheet, {
    types: ["charm"],
    makeDefault: true,
    label: "HKRPG.Sheets.Charm"
  });

  Actors.registerSheet("hollow-knight-rpg", HKCharacterSheet, {
    types: ["character"],
    makeDefault: true,
    label: "HKRPG.Sheets.Character"
  });

});

Hooks.once("ready", () => {
  console.log(`Hollow Knight RPG | Ready (v${game.system.version})`);
});