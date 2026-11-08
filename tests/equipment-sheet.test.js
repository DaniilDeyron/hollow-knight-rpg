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

test("Читает Bulk по термину книги и сохраняет совместимость со старым полем Вес", () => {
  const rows = buildEquipmentRows([
    { name: "Гвоздь", system: { bulk: 2, weight: 99 } },
    { name: "Старая сумка", system: { weight: 3 } }
  ], 2, ["bulk"]);
  assert.equal(rows[0].values.bulk, 2);
  assert.equal(rows[1].values.bulk, 3);
});

test("Читает ПУ как Damage Reduction и качество оружия отдельно от количества", () => {
  const [armor] = buildEquipmentRows([
    { name: "Лёгкая броня", system: { damageReduction: 1, quality: 2 } }
  ], 1, ["protection", "quality"]);
  assert.equal(armor.values.protection, 1);
  assert.equal(armor.values.quality, 2);
});
