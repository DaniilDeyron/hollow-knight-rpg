import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { HK_BUG_TEMPLATES, buildBugActorDefaults, getBugTemplate } from "../scripts/data/bug-templates.js";
import { flattenTraitLibrary, buildTraitLibraryGroups, buildTraitItemData } from "../scripts/data/trait-library.js";

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

test("Шаблоны применяются моделью выбранного типа актёра, а не полем чарлиста", () => {
  const sheet = read("../scripts/sheets/character-sheet.js");
  const main = read("../scripts/main.js");
  const model = read("../scripts/data/character-data.js");
  const template = read("../templates/actor/character-sheet.hbs");
  assert.doesNotMatch(sheet, /_onBugSizeChange/);
  assert.doesNotMatch(template, /select\[name="system\.size"\]/);
  assert.match(template, /bugSizeLabel/);
  assert.match(main, /dataModels\.smallBug = HKSmallBugData/);
  assert.match(main, /dataModels\.mediumBug = HKMediumBugData/);
  assert.match(main, /dataModels\.largeBug = HKLargeBugData/);
  assert.match(model, /static get bugTemplateKey\(\)/);
  assert.match(model, /template\?\.attributes\.might/);
  assert.match(model, /template\?\.resources\.heartMax/);
  assert.match(main, /preCreateActor/);
});

test("Встроенная библиотека содержит готовые черты и не зависит от папок мира", () => {
  const groups = buildTraitLibraryGroups();
  const all = flattenTraitLibrary();
  const main = read("../scripts/main.js");
  const sheet = read("../scripts/sheets/character-sheet.js");
  const template = read("../templates/actor/character-sheet.hbs");
  assert.ok(all.length > 130);
  assert.equal(groups.length, 9);
  assert.ok(groups.some((group) => group.items.some((trait) => trait.id === "crushing-jaws")));
  assert.match(template, /data-add-library-trait=/);
  assert.match(sheet, /buildTraitLibraryGroups\(items\)/);
  assert.match(sheet, /_onAddLibraryTrait/);
  assert.doesNotMatch(main, /ensureTraitLibrary/);
  assert.doesNotMatch(sheet, /game\.items\?\.contents/);
});

test("Встроенные черты содержат игровые модификаторы, которые реально меняют персонажа", () => {
  const dazzling = buildTraitItemData(flattenTraitLibrary().find((trait) => trait.id === "dazzling"));
  const graceful = buildTraitItemData(flattenTraitLibrary().find((trait) => trait.id === "graceful"));
  const softBody = buildTraitItemData(flattenTraitLibrary().find((trait) => trait.id === "soft-body"));
  const hauler = buildTraitItemData(flattenTraitLibrary().find((trait) => trait.id === "hauler"));
  assert.equal(dazzling.system.cute, 1);
  assert.equal(graceful.system.grace, 1);
  assert.equal(softBody.system.heartMax, 4);
  assert.equal(hauler.system.carryingCapacity, 1);
  const rules = read("../scripts/rules/trait-bonuses.js");
  const model = read("../scripts/data/character-data.js");
  assert.match(rules, /carryingCapacity/);
  assert.match(model, /derived\.carryingCapacity = Math\.max/);
});

test("Подчерты в библиотеке связаны с родительскими чертами", () => {
  const group = buildTraitLibraryGroups().find((entry) => entry.id === "naturalWeapon");
  const jaws = group.items.find((trait) => trait.id === "crushing-jaws");
  assert.ok(jaws.children.some((trait) => trait.id === "huge-jaws"));
  const actorItems = [{
    id: "actor-jaws", type: "trait",
    system: { kind: "main", libraryId: "crushing-jaws", parentId: "", selected: true }
  }];
  const withParent = buildTraitLibraryGroups(actorItems).find((entry) => entry.id === "naturalWeapon");
  const addedJaws = withParent.items.find((trait) => trait.id === "crushing-jaws");
  assert.ok(addedJaws.children.find((trait) => trait.id === "huge-jaws").canAdd);
});

test("Шапка листа возвращена к компактному портрету 112 пикселей", () => {
  const css = read("../styles/system.css");
  assert.match(css, /grid-template-columns: 112px minmax\(0, 1fr\) 154px/);
  assert.match(css, /width: 112px;\s*height: 112px;\s*min-height: 112px/);
  assert.match(css, /hkrpg-header-main\s*\{\s*justify-content: flex-start/);
  assert.match(css, /hkrpg-size-display/);
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

test("Редактор предмета черты использует компактную иконку и сетку модификаторов", () => {
  const css = read("../styles/system.css");
  const template = read("../templates/item/feature-item-sheet.hbs");
  assert.match(css, /hkrpg\.sheet\.item \.hkrpg-feature-item-header/);
  assert.match(css, /width: 64px;\s*height: 64px/);
  assert.match(css, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(template, /system\.carryingCapacity/);
  assert.match(template, /применяются к персонажу автоматически/);
});

test("Подготовка памятки не должна блокировать лист из-за некорректного ActiveEffect", () => {
  const sheet = read("../scripts/sheets/character-sheet.js");
  assert.match(sheet, /Could not prepare effect reference data/);
  assert.match(sheet, /buildEffectsSheetData\(\[\], HK_EFFECT_CATALOG\)/);
});
