import test from "node:test";
import assert from "node:assert/strict";
import { buildEquipmentRows } from "../scripts/rules/equipment-sheet.js";

test("Формирует десять строк снаряжения, когда предметов ещё нет", () => {
  const rows = buildEquipmentRows([], 10, ["weight"]);
  assert.equal(rows.length, 10);
  assert.equal(rows[0].isEmpty, true);
  assert.equal(rows[0].name, "");
  assert.equal(rows[0].values.weight, "");
});

test("Не скрывает предметы, если их больше стандартного количества строк", () => {
  const items = Array.from({ length: 12 }, (_, index) => ({
    id: String(index + 1),
    name: `Предмет ${index + 1}`,
    system: { weight: index }
  }));
  const rows = buildEquipmentRows(items, 10, ["weight"]);
  assert.equal(rows.length, 12);
  assert.equal(rows[11].name, "Предмет 12");
  assert.equal(rows[11].values.weight, 11);
});

test("Сохраняет нулевые показатели предмета и не подменяет их пустым значением", () => {
  const item = {
    name: "Пустой колчан",
    system: { weight: 0, damage: 0, range: "", quantity: 1 }
  };
  const [row] = buildEquipmentRows([item], 5, ["weight", "damage", "range", "quantity"]);
  assert.equal(row.values.weight, 0);
  assert.equal(row.values.damage, 0);
  assert.equal(row.values.range, "");
  assert.equal(row.values.quantity, 1);
});

test("Пустые строки добавляются только до указанного минимума", () => {
  const rows = buildEquipmentRows([{ name: "Меч", system: {} }], 5, ["weight"]);
  assert.equal(rows.length, 5);
  assert.equal(rows[0].isEmpty, false);
  assert.equal(rows[1].isEmpty, true);
});

test("Оружие, снаряжение и броня имеют отдельные зоны перетаскивания и добавления строк", async () => {
  const { readFileSync } = await import("node:fs");
  const template = readFileSync(new URL("../templates/actor/character-sheet.hbs", import.meta.url), "utf8");
  const sheet = readFileSync(new URL("../scripts/sheets/character-sheet.js", import.meta.url), "utf8");
  for (const [zone, type] of [["equipment", "equipment"], ["combat", "weapon"], ["armor", "armor"]]) {
    assert.ok(template.includes(`data-equipment-dropzone="${zone}"`));
    assert.ok(template.includes(`data-create-equipment-row="${type}"`));
  }
  assert.match(sheet, /async _onCreateEquipmentRow\(event\)/);
  assert.match(sheet, /async _onEquipmentFieldChange\(event\)/);
  assert.match(sheet, /async _onDeleteEquipmentItem\(event\)/);
  assert.match(sheet, /new Set\(\["equipment", "weapon", "shield", "armor"\]\)/);
});

test("Строки снаряжения используют сохраняемые поля встроенного предмета", async () => {
  const { readFileSync } = await import("node:fs");
  const template = readFileSync(new URL("../templates/actor/character-sheet.hbs", import.meta.url), "utf8");
  for (const field of ["name", "weight", "damage", "range", "quantity", "protection", "durability"]) {
    assert.ok(template.includes(`data-equipment-field="${field}"`), `Missing editable field ${field}`);
  }
  const model = readFileSync(new URL("../scripts/data/inventory-item-data.js", import.meta.url), "utf8");
  for (const field of ["weight", "quantity", "damage", "range", "protection", "durability"]) {
    assert.match(model, new RegExp(`\\b${field}:`));
  }
});
