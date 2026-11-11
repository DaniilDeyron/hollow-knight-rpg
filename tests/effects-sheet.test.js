import test from "node:test";
import assert from "node:assert/strict";
import { HK_EFFECT_CATALOG, HK_EFFECT_CATEGORIES, getEffectStatuses } from "../scripts/data/effects-catalog.js";
import { buildEffectsSheetData, planCatalogEffectDeduplication } from "../scripts/rules/effects-sheet.js";

test("Каталог содержит только боевые состояния и уникальные записи", () => {
  const ids = HK_EFFECT_CATALOG.map((effect) => effect.id);
  assert.equal(ids.length, new Set(ids).size);
  assert.equal(ids.length, 7);
  assert.deepEqual(HK_EFFECT_CATEGORIES.map((category) => category.id), ["combat"]);
  assert.ok(HK_EFFECT_CATALOG.every((effect) => effect.category === "combat"));
  assert.ok(HK_EFFECT_CATALOG.every((effect) => effect.source.startsWith("Книга, с.")));
});

test("В HUD регистрируются только семь боевых эффектов с описаниями", () => {
  const statuses = getEffectStatuses();
  assert.equal(statuses.length, 7);
  for (const status of statuses) {
    assert.match(status.id, /^hkrpg-/);
    assert.ok(status.name);
    assert.ok(status.img);
    assert.ok(status.description.length > 20);
  }
});

test("Вкладка эффектов связывает активный статус с его памяткой", () => {
  const effect = {
    id: "ae-1",
    name: "Дисбаланс",
    img: "icons/svg/daze.svg",
    disabled: false,
    statuses: new Set(["hkrpg-off-balance"]),
    getFlag: () => null
  };
  const data = buildEffectsSheetData([effect]);
  const active = data.activeEffects.find((entry) => entry.documentId === "ae-1");
  const category = data.effectGroups.find((entry) => entry.id === "combat");
  const reference = category.effects.find((entry) => entry.id === "hkrpg-off-balance");
  assert.equal(active.name, "Дисбаланс");
  assert.match(active.rules, /Выносливость/);
  assert.equal(reference.isActive, true);
  assert.equal(reference.isDisabled, false);
});

test("Отключённый Active Effect остаётся в списке и может быть включён обратно", () => {
  const effect = {
    id: "ae-2",
    name: "Удушение",
    img: "icons/svg/aura.svg",
    disabled: true,
    statuses: new Set(["hkrpg-suffocation"]),
    getFlag: () => null
  };
  const data = buildEffectsSheetData([effect]);
  const active = data.activeEffects[0];
  const reference = data.effectGroups.flatMap((group) => group.effects)
    .find((entry) => entry.id === "hkrpg-suffocation");
  assert.equal(active.disabled, true);
  assert.equal(reference.isActive, false);
  assert.equal(reference.isDisabled, true);
});

test("Пользовательские эффекты без записи в справочнике не теряются", () => {
  const effect = {
    id: "ae-custom",
    name: "Проклятие Мастера",
    img: "icons/svg/aura.svg",
    disabled: false,
    statuses: new Set(),
    getFlag: () => null
  };
  const data = buildEffectsSheetData([effect]);
  assert.equal(data.activeEffects[0].name, "Проклятие Мастера");
  assert.match(data.activeEffects[0].summary, /Пользовательский эффект/);
});


test("Стандартные статусы Foundry не дублируются в системном HUD", () => {
  const statuses = getEffectStatuses([
    { id: "grappled" },
    { id: "unconscious" },
    { id: "invisible" }
  ]);
  const ids = statuses.map((status) => status.id);
  assert.equal(ids.length, 4);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(!ids.includes("hkrpg-grappled"));
  assert.ok(!ids.includes("hkrpg-unconscious"));
  assert.ok(!ids.includes("hkrpg-invisible"));
});

test("Нативный статус отображается в журнале как соответствующий боевой эффект", () => {
  const native = {
    id: "native-unconscious",
    name: "Unconscious",
    img: "icons/svg/unconscious.svg",
    disabled: false,
    statuses: new Set(["unconscious"]),
    getFlag: () => null
  };
  const data = buildEffectsSheetData([native]);
  assert.equal(data.activeEffects.length, 1);
  assert.equal(data.activeEffects[0].catalogId, "hkrpg-unconscious");
  assert.equal(data.activeEffects[0].name, "Потеря сознания");
  const reference = data.effectGroups[0].effects.find((entry) => entry.id === "hkrpg-unconscious");
  assert.equal(reference.isActive, true);
});

test("Системный дубль нативного статуса удаляется с сохранением активности", () => {
  const native = {
    id: "native-invisible",
    disabled: true,
    statuses: new Set(["invisible"]),
    getFlag: () => null
  };
  const managed = {
    id: "managed-invisible",
    disabled: false,
    statuses: new Set(["hkrpg-invisible"]),
    getFlag: (scope, key) => scope === "hkrpg" && key === "catalogId" ? "hkrpg-invisible" : null
  };
  assert.deepEqual(
    planCatalogEffectDeduplication([managed, native]),
    { removeIds: ["managed-invisible"], enableIds: ["native-invisible"] }
  );
});

test("Повторные системные копии одного боевого эффекта сводятся к одной", () => {
  const makeEffect = (id, disabled) => ({
    id,
    disabled,
    statuses: new Set(["hkrpg-off-balance"]),
    getFlag: (scope, key) => scope === "hkrpg" && key === "catalogId" ? "hkrpg-off-balance" : null
  });
  assert.deepEqual(
    planCatalogEffectDeduplication([
      makeEffect("inactive-copy", true),
      makeEffect("active-copy", false)
    ]),
    { removeIds: ["inactive-copy"], enableIds: [] }
  );
});
