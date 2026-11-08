import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync(new URL("../system.json", import.meta.url), "utf8"));
const theme = readFileSync(new URL("../styles/character-sheet-theme.css", import.meta.url), "utf8");
const template = readFileSync(new URL("../templates/actor/character-sheet.hbs", import.meta.url), "utf8");

test("Общая тема подключена после базовых стилей", () => {
  assert.deepEqual(
    manifest.styles,
    ["styles/system.css", "styles/character-sheet-theme.css"]
  );
});

test("Общая тема оформляет панели, карточки и окна предметов", () => {
  for (const selector of [
    ".hkrpg.sheet.actor .hkrpg-sheet-header",
    ".hkrpg.sheet.actor .hkrpg-tabs .item",
    ".hkrpg.sheet.actor .hkrpg-overview-section",
    ".hkrpg.sheet.actor .hkrpg-panel",
    ".hkrpg.sheet.actor .hkrpg-feature-panel",
    ".hkrpg.sheet.actor .hkrpg-charms-equipped-panel",
    ".hkrpg.sheet.actor .hkrpg-equipment-panel",
    ".hkrpg.sheet.item .window-content"
  ]) {
    assert.ok(theme.includes(selector), `Theme is missing selector: ${selector}`);
  }
});

test("Общая тема не переопределяет компоновку базового листа", () => {
  assert.doesNotMatch(
    theme,
    /\b(display|position|grid-template|height|min-height|max-height|width|min-width|max-width|padding|margin|gap|overflow)\s*:/
  );
});

test("Каждая кнопка навигации явно привязана к той же группе, что и панели вкладок", () => {
  const nav = template.match(/<nav class="hkrpg-tabs"[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? "";
  const links = [...nav.matchAll(/<a class="item"[^>]*data-tab="([^"]+)"[^>]*>/g)];
  assert.equal(links.length, 6);
  for (const link of links) {
    assert.match(link[0], /data-group="primary"/);
    assert.ok(
      template.includes(`data-group="primary" data-tab="${link[1]}"`),
      `Missing content pane for ${link[1]}`
    );
  }
});

test("Вкладка снаряжения не переопределяет скрытие неактивных вкладок", () => {
  assert.match(
    readFileSync(new URL("../styles/system.css", import.meta.url), "utf8"),
    /\.hkrpg\.sheet\.actor \.hkrpg-equipment-tab\.active\s*\{\s*display:\s*flex;/
  );
  assert.doesNotMatch(
    readFileSync(new URL("../styles/system.css", import.meta.url), "utf8"),
    /\.hkrpg\.sheet\.actor \.hkrpg-equipment-tab\s*\{\s*display:\s*flex;/
  );
});

test("Сохраняется исходная структура шести вкладок v0.1.61", () => {
  const tabs = [...template.matchAll(/data-tab="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((value, index, values) => values.indexOf(value) === index);
  assert.deepEqual(tabs, ["overview", "features", "charms", "equipment", "effects", "journal"]);
});

test("Основные поля персонажа остаются привязаны к прежней модели данных", () => {
  for (const attribute of ["might", "insight", "shell", "grace"]) {
    assert.ok(template.includes(`name="system.attributes.${attribute}"`));
  }
  for (const resource of ["heart", "soul", "stamina"]) {
    assert.ok(template.includes(`data-resource-field="${resource}"`));
  }
  assert.ok(template.includes('name="system.resources.hunger"'));
  assert.ok(template.includes('name="system.resources.satiety"'));
});
