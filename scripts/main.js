import { HKCharacterData } from "./data/character-data.js";
import { HKCharacterSheet } from "./sheets/character-sheet.js";

Hooks.once("init", () => {
  console.log("Hollow Knight RPG | Initializing system");

  CONFIG.Actor.dataModels.character = HKCharacterData;

  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("hollow-knight-rpg", HKCharacterSheet, {
    types: ["character"],
    makeDefault: true,
    label: "HKRPG.Sheets.Character"
  });

});

Hooks.once("ready", () => {
  console.log(`Hollow Knight RPG | Ready (v${game.system.version})`);
});