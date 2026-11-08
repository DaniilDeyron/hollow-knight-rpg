import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync(new URL("../system.json", import.meta.url), "utf8"));
const theme = readFileSync(new URL("../styles/character-sheet-theme.css", import.meta.url), "utf8");
const template = readFileSync(new URL("../templates/actor/character-sheet.hbs", import.meta.url), "utf8");

test("Единая тема подключена после базовой таблицы стилей", () => {
  assert.deepEqual(
    manifest.styles,
    ["styles/system.css", "styles/character-sheet-theme.css"]
  );
});

test("Тема содержит общий визуальный язык для всех вкладок и листов предметов", () => {
  for (const selector of [
    ".hkrpg.sheet.actor .hkrpg-sheet-header",
    ".hkrpg.sheet.actor .hkrpg-tabs",
    ".hkrpg.sheet.actor .hkrpg-overview-grid",
    ".hkrpg.sheet.actor .hkrpg-features-layout",
    ".hkrpg.sheet.actor .hkrpg-charms-page",
    ".hkrpg.sheet.actor .hkrpg-equipment-layout",
    ".hkrpg.sheet.actor .hkrpg-notes-layout",
    ".hkrpg.sheet.item .hkrpg-feature-item-form"
  ]) {
    assert.ok(theme.includes(selector), `Theme is missing selector: ${selector}`);
  }
});

test("Основные поля персонажа и игрока остаются связаны с моделью данных", () => {
  assert.match(template, /name="system\.profile\.player"/);
  assert.match(template, /name="system\.attributes\.might"/);
  assert.match(template, /name="system\.attributes\.insight"/);
  assert.match(template, /name="system\.attributes\.shell"/);
  assert.match(template, /name="system\.attributes\.grace"/);
  assert.match(template, /data-resource-field="heart"/);
  assert.match(template, /data-resource-field="soul"/);
  assert.match(template, /data-resource-field="stamina"/);
  assert.match(template, /name="system\.resources\.hunger"/);
  assert.match(template, /name="system\.resources\.satiety"/);
});

test("Визуальная тема остаётся адаптивной для окон меньшей ширины", () => {
  assert.match(theme, /@media\s*\(max-width:\s*920px\)/);
  assert.match(theme, /@media\s*\(max-width:\s*760px\)/);
  assert.match(theme, /@media\s*\(max-width:\s*560px\)/);
});
