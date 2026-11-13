import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  HK_COMBAT_EQUIPMENT,
  buildCombatEquipmentLibrary,
  buildCombatEquipmentItemData,
  countCombatEquipmentByType
} from "../scripts/data/combat-equipment-library.js";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("Каталог включает весь перечень базового боевого снаряжения из книги v1.8", () => {
  assert.deepEqual(countCombatEquipmentByType(), { weapon: 33, shield: 4, armor: 3 });
  assert.equal(HK_COMBAT_EQUIPMENT.length, 40);
  assert.equal(new Set(HK_COMBAT_EQUIPMENT.map((entry) => entry.id)).size, 40);
  for (const entry of HK_COMBAT_EQUIPMENT) {
    assert.ok(entry.name, `Missing name for ${entry.id}`);
    assert.ok(entry.description, `Missing description for ${entry.id}`);
    assert.ok(entry.rules, `Missing rules for ${entry.id}`);
    assert.ok(entry.sourcePage >= 88 && entry.sourcePage <= 96);
    assert.ok(["weapon", "shield", "armor"].includes(entry.type));
  }
});

test("Папка библиотеки имеет отдельные разделы оружия, щитов и доспехов", () => {
  const library = buildCombatEquipmentLibrary();
  assert.equal(library.rootName, "Оружие и доспехи");
  assert.deepEqual(library.folders.map((folder) => folder.key), ["root", "weapons", "shields", "armor"]);
  assert.equal(library.folders.find((folder) => folder.key === "weapons").parentKey, "root");
  assert.equal(library.folders.find((folder) => folder.key === "shields").parentKey, "root");
  assert.equal(library.folders.find((folder) => folder.key === "armor").parentKey, "root");
  assert.equal(library.items.length, 40);
  assert.equal(library.items.filter((record) => record.folderKey === "weapons").length, 33);
  assert.equal(library.items.filter((record) => record.folderKey === "shields").length, 4);
  assert.equal(library.items.filter((record) => record.folderKey === "armor").length, 3);
});

test("Предметы сохраняют числовые и текстовые боевые параметры", () => {
  const nail = HK_COMBAT_EQUIPMENT.find((entry) => entry.id === "nail");
  const spear = HK_COMBAT_EQUIPMENT.find((entry) => entry.id === "nail-spear");
  const shield = HK_COMBAT_EQUIPMENT.find((entry) => entry.id === "carapace-shield");
  const armor = HK_COMBAT_EQUIPMENT.find((entry) => entry.id === "heavy-armor");
  const nailData = buildCombatEquipmentItemData(nail);
  const spearData = buildCombatEquipmentItemData(spear);
  const shieldData = buildCombatEquipmentItemData(shield);
  const armorData = buildCombatEquipmentItemData(armor);

  assert.equal(nailData.type, "weapon");
  assert.equal(nailData.system.damage, "3");
  assert.equal(nailData.system.grip, "1Р");
  assert.equal(nailData.system.cost, 100);
  assert.equal(spearData.system.range, "Досягаемость");
  assert.equal(shieldData.type, "shield");
  assert.equal(shieldData.system.quality, 0);
  assert.equal(shieldData.system.durability, 4);
  assert.equal(shieldData.system.absorption, 4);
  assert.equal(armorData.type, "armor");
  assert.equal(armorData.system.durability, 9);
  assert.equal(armorData.system.damageReduction, 2);
  assert.equal(armorData.system.soakBonus, 1);
  assert.equal(armorData.system.cost, 400);
});

test("Создание библиотеки в мире выполняется от ГМа, использует права просмотра и стабильные ID", () => {
  const main = read("../scripts/main.js");
  assert.match(main, /async function ensureCombatEquipmentLibrary/);
  assert.match(main, /buildCombatEquipmentLibrary\(\)/);
  assert.match(main, /Folder\.implementation\.create/);
  assert.match(main, /combatEquipmentLibraryFolderKey/);
  assert.match(main, /combatEquipmentLibraryId/);
  assert.match(main, /await ensureCombatEquipmentLibrary\(\)/);
  assert.match(main, /DOCUMENT_OWNERSHIP_LEVELS\?\.OBSERVER/);
});

test("Для боевого оружия, щитов и доспехов зарегистрирован отдельный лист предмета", () => {
  const main = read("../scripts/main.js");
  const sheet = read("../scripts/sheets/inventory-item-sheet.js");
  const template = read("../templates/item/inventory-item-sheet.hbs");
  const model = read("../scripts/data/inventory-item-data.js");
  assert.match(main, /HKInventoryItemSheet/);
  assert.match(main, /types: \["weapon", "shield", "armor"\]/);
  assert.match(sheet, /isWeapon/);
  assert.match(sheet, /isShield/);
  assert.match(sheet, /isArmor/);
  assert.match(template, /system\.weaponTypes/);
  assert.match(template, /system\.damageReduction/);
  assert.match(template, /system\.soakBonus/);
  for (const field of ["quality","weaponTypes","grip","cost","description","rules","modificationNotes","sourcePage"]) {
    assert.ok(model.includes(`${field}:`), `Missing schema field ${field}`);
  }
});

test("Релизная сборка требует все файлы каталога боевого снаряжения", () => {
  const workflow = read("../.github/workflows/release.yml");
  for (const file of [
    "scripts/data/combat-equipment-library.js",
    "scripts/sheets/inventory-item-sheet.js",
    "templates/item/inventory-item-sheet.hbs"
  ]) assert.ok(workflow.includes(file), `Release workflow does not require ${file}`);
});
