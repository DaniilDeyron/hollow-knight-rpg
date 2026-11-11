import test from "node:test";
import assert from "node:assert/strict";
import { buildTraitCardSlots } from "../scripts/rules/feature-sheet.js";

test("Лист показывает только заполненные карточки основных Черт", () => {
  const tree = {
    roots: [{ id: "trait-a", name: "Панцирь", kind: "main", slot: 2 }]
  };
  assert.equal(buildTraitCardSlots(7, tree).length, 1);
  assert.equal(buildTraitCardSlots(0, tree).length, 0);
  assert.equal(buildTraitCardSlots(20, tree).length, 1);
});

test("Назначенные номера сохраняются, но пустые позиции не выводятся", () => {
  const tree = {
    roots: [
      { id: "trait-a", name: "Панцирь", kind: "main", slot: 3 },
      { id: "trait-b", name: "Крылья", kind: "main", slot: 1 }
    ]
  };
  const cards = buildTraitCardSlots(4, tree);
  assert.equal(cards.length, 2);
  assert.deepEqual(cards.map((slot) => slot.number), [1, 3]);
  assert.deepEqual(cards.map((slot) => slot.trait.id), ["trait-b", "trait-a"]);
});

test("Существующие Черты без номера занимают только фактические карточки", () => {
  const tree = {
    roots: [
      { id: "old-a", name: "Рог", kind: "main", slot: 0 },
      { id: "old-b", name: "Чувствительные усики", kind: "main", slot: 0 }
    ]
  };
  const cards = buildTraitCardSlots(3, tree);
  assert.deepEqual(cards.map((slot) => slot.trait.id), ["old-a", "old-b"]);
  assert.deepEqual(cards.map((slot) => slot.number), [1, 2]);
});

test("Старые текстовые Черты остаются видимыми отдельными компактными карточками", () => {
  const legacy = [{ name: "Старая Черта" }];
  const cards = buildTraitCardSlots(2, { roots: [] }, legacy);
  assert.equal(cards.length, 1);
  assert.equal(cards[0].legacy.name, "Старая Черта");
  assert.equal(cards[0].isEmpty, false);
});

test("Предмет Черты вытесняет старую текстовую запись из визуального слота", () => {
  const tree = { roots: [{ id: "new-trait", name: "Новая Черта", kind: "main", slot: 1 }] };
  const cards = buildTraitCardSlots(1, tree, [{ name: "Старая Черта" }]);
  assert.equal(cards.length, 1);
  assert.equal(cards[0].trait.id, "new-trait");
  assert.equal(cards[0].legacy, null);
});

test("Подчерты не занимают отдельные основные карточки", () => {
  const tree = {
    roots: [
      { id: "main", name: "Панцирь", kind: "main", slot: 1 },
      { id: "orphan", name: "Одинокая подчерта", kind: "subtrait", slot: 2 }
    ]
  };
  const cards = buildTraitCardSlots(2, tree);
  assert.equal(cards.length, 1);
  assert.equal(cards[0].trait.id, "main");
});

test("Вкладка Черт использует единую drop-area и не рисует семь пустых ячеек", async () => {
  const { readFileSync } = await import("node:fs");
  const template = readFileSync(new URL("../templates/actor/character-sheet.hbs", import.meta.url), "utf8");
  const start = template.indexOf('<div class="hkrpg-trait-collection"');
  const end = template.indexOf('<footer class="hkrpg-feature-panel__footer">', start);
  const markup = template.slice(start, end);
  assert.match(markup, /data-trait-dropzone="auto"/);
  assert.match(markup, /hkrpg-trait-collection-grid/);
  assert.match(markup, /data-trait-item-id="{{slot\.trait\.id}}"/);
  assert.match(markup, /hkrpg-traits-empty/);
  assert.doesNotMatch(markup, /data-trait-dropzone="{{slot\.number}}"/);
  assert.doesNotMatch(markup, /hkrpg-trait-slot-card|is-empty/);
});
