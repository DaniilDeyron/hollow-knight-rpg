import test from "node:test";
import assert from "node:assert/strict";
import { buildTraitCardSlots } from "../scripts/rules/feature-sheet.js";

test("Лист формирует семь ячеек основных Черт", () => {
  assert.equal(buildTraitCardSlots(7).length, 7);
  assert.equal(buildTraitCardSlots(0).length, 0);
  assert.equal(buildTraitCardSlots(20).length, 7);
});

test("Черта с назначенным номером сохраняет своё место", () => {
  const tree = {
    roots: [
      { id: "trait-a", name: "Панцирь", slot: 3 },
      { id: "trait-b", name: "Крылья", slot: 1 }
    ]
  };
  const slots = buildTraitCardSlots(4, tree);
  assert.equal(slots[0].trait.id, "trait-b");
  assert.equal(slots[1].isEmpty, true);
  assert.equal(slots[2].trait.id, "trait-a");
});

test("Существующие Черты без номера заполняют свободные ячейки, а не исчезают", () => {
  const tree = {
    roots: [
      { id: "old-a", name: "Рог", slot: 0 },
      { id: "old-b", name: "Чувствительные усики", slot: 0 }
    ]
  };
  const slots = buildTraitCardSlots(3, tree);
  assert.deepEqual(slots.map((slot) => slot.trait?.id ?? null), ["old-a", "old-b", null]);
});

test("Старые текстовые Черты остаются видимыми в пустых ячейках", () => {
  const legacy = [{ name: "Старая Черта" }];
  const slots = buildTraitCardSlots(2, { roots: [] }, legacy);
  assert.equal(slots[0].legacy.name, "Старая Черта");
  assert.equal(slots[1].isEmpty, true);
});

test("Предмет Черты занимает слот вместо старой текстовой записи", () => {
  const tree = { roots: [{ id: "new-trait", name: "Новая Черта", slot: 1 }] };
  const slots = buildTraitCardSlots(1, tree, [{ name: "Старая Черта" }]);
  assert.equal(slots[0].trait.id, "new-trait");
  assert.equal(slots[0].legacy, null);
});


test("Подчерты без основной родительской связи не занимают ячейки основных Черт", () => {
  const tree = {
    roots: [
      { id: "main", name: "Панцирь", kind: "main", slot: 1 },
      { id: "orphan", name: "Одинокая подчерта", kind: "subtrait", slot: 2 }
    ]
  };
  const slots = buildTraitCardSlots(2, tree);
  assert.equal(slots[0].trait.id, "main");
  assert.equal(slots[1].isEmpty, true);
});
