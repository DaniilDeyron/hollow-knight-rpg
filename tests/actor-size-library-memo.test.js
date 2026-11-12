import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { HK_BUG_TEMPLATES, buildBugActorDefaults, getBugTemplate } from "../scripts/data/bug-templates.js";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("Каждый размер имеет отдельный шаблон характеристик и ресурсов", () => {
  assert.deepEqual(HK_BUG_TEMPLATES.small.attributes, { might:2, insight:3, shell:3, grace:4 });
  assert.deepEqual(HK_BUG_TEMPLATES.medium.attributes, { might:3, insight:3, shell:3, grace:3 });
  assert.deepEqual(HK_BUG_TEMPLATES.large.attributes, { might:4, insight:3, shell:4, grace:2 });
  assert.deepEqual(
    [HK_BUG_TEMPLATES.small.resources.heartMax, HK_BUG_TEMPLATES.medium.resources.heartMax, HK_BUG_TEMPLATES.large.resources.heartMax],
    [6,7,8]
  );
  assert.deepEqual(
    [HK_BUG_TEMPLATES.small.resources.hunger, HK_BUG_TEMPLATES.medium.resources.hunger, HK_BUG_TEMPLATES.large.resources.hunger],
    [-1,4,9]
  );
  assert.deepEqual(
    [HK_BUG_TEMPLATES.small.resources.satietyMaxOverride, HK_BUG_TEMPLATES.medium.resources.satietyMaxOverride, HK_BUG_TEMPLATES.large.resources.satietyMaxOverride],
    [15,20,25]
  );
});

test("Создание каждого типа передаёт соответствующие данные и размер токена", () => {
  globalThis.foundry = { utils: { deepClone: (value) => structuredClone(value) } };
  for (const size of ["small", "medium", "large"]) {
    const defaults = buildBugActorDefaults(size);
    assert.equal(defaults.system.size, size);
    assert.deepEqual(defaults.system.attributes, HK_BUG_TEMPLATES[size].attributes);
    assert.deepEqual(defaults.prototypeToken, HK_BUG_TEMPLATES[size].token);
  }
  delete globalThis.foundry;
  assert.equal(getBugTemplate("not-a-size").size, "medium");
});

test("Лист применяет шаблон при смене поля размера и не полагается только на Actor type", () => {
  const sheet = read("../scripts/sheets/character-sheet.js");
  assert.match(sheet, /select\[name="system\.size"\]/);
  assert.match(sheet, /_onBugSizeChange/);
  for (const key of ["attributes.might","attributes.insight","attributes.shell","attributes.grace",
    "resources.heartMax","resources.staminaMax","resources.soulMax","resources.hunger",
    "resources.satietyMaxOverride","social.cute","social.spook","social.speed",
    "prototypeToken"]) {
    assert.ok(sheet.includes(`system.${key}`), `missing update for ${key}`);
  }
});

test("Каталог черт отображается прямо в листе и элементы можно перетаскивать", () => {
  const sheet = read("../scripts/sheets/character-sheet.js");
  const template = read("../templates/actor/character-sheet.hbs");
  assert.match(sheet, /traitLibraryGroups/);
  assert.match(template, /Библиотека черт/);
  assert.match(template, /data-trait-library-id=/);
  assert.match(sheet, /dataset\.traitLibraryId/);
});

test("Шапка листа возвращена к компактному портрету 112 пикселей", () => {
  const css = read("../styles/system.css");
  assert.match(css, /grid-template-columns: 112px minmax\(0, 1fr\) 154px/);
  assert.match(css, /width: 112px;\s*height: 112px;\s*min-height: 112px/);
});

test("Памятка содержит справочник эффектов и модификации заклинаний без верхней панели активных эффектов", () => {
  const template = read("../templates/actor/character-sheet.hbs");
  const ru = JSON.parse(read("../lang/ru.json"));
  const memoStart = template.indexOf('<section class="tab hkrpg-effects-tab"');
  const memoEnd = template.indexOf('<section class="tab hkrpg-journal-tab"', memoStart);
  const memo = template.slice(memoStart, memoEnd);
  const featuresStart = template.indexOf('<section class="tab hkrpg-features-tab"');
  const featuresEnd = template.indexOf('<section class="tab hkrpg-charms-tab"', featuresStart);
  const features = template.slice(featuresStart, featuresEnd);
  assert.equal(ru.HKRPG.Tabs.Memo, "Памятка");
  assert.match(memo, /hkrpg-effects-reference-panel/);
  assert.match(memo, /SpellModifications/);
  assert.doesNotMatch(memo, /hkrpg-effects-active-panel/);
  assert.doesNotMatch(features, /SpellModifications/);
});

test("Подготовка памятки не должна блокировать лист из-за некорректного ActiveEffect", () => {
  const sheet = read("../scripts/sheets/character-sheet.js");
  assert.match(sheet, /Could not prepare effect reference data/);
  assert.match(sheet, /buildEffectsSheetData\(\[\], HK_EFFECT_CATALOG\)/);
});
