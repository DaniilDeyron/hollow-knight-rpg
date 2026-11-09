import test from "node:test";
import assert from "node:assert/strict";
import { HK_EFFECT_CATALOG, HK_EFFECT_CATEGORIES, getEffectStatuses } from "../scripts/data/effects-catalog.js";
import { buildEffectsSheetData } from "../scripts/rules/effects-sheet.js";

test("Справочник содержит уникальные статусы и все категории", () => {
  const ids = HK_EFFECT_CATALOG.map((effect) => effect.id);
  assert.equal(ids.length, new Set(ids).size);
  assert.ok(ids.length >= 35);
  for (const category of HK_EFFECT_CATEGORIES) {
    assert.ok(HK_EFFECT_CATALOG.some((effect) => effect.category === category.id), category.id);
  }
});

test("Все записи справочника доступны в стандартном HUD токена", () => {
  const statuses = getEffectStatuses();
  assert.equal(statuses.length, HK_EFFECT_CATALOG.length);
  for (const status of statuses) {
    assert.match(status.id, /^hkrpg-/);
    assert.ok(status.name);
    assert.ok(status.img);
  }
});

test("Вкладка эффектов показывает активные статусы и ссылки на их памятки", () => {
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
  const category = data.effectGroups.find((entry) => entry.id === "core");
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
