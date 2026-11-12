import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { HK_BUG_TEMPLATES, buildBugActorDefaults, getBugTemplate } from "../scripts/data/bug-templates.js";
import { flattenTraitLibrary, buildTraitLibraryLayout, buildTraitItemData } from "../scripts/data/trait-library.js";
import { calculateTraitBonuses } from "../scripts/rules/trait-bonuses.js";

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
  assert.doesNotMatch(template, /name="system\.size"/);
  assert.match(template, /bugSizeLabel/);
  assert.match(main, /dataModels\.smallBug = HKSmallBugData/);
  assert.match(main, /dataModels\.mediumBug = HKMediumBugData/);
  assert.match(main, /dataModels\.largeBug = HKLargeBugData/);
  assert.match(model, /static get bugTemplateKey\(\)/);
  assert.match(model, /template\?\.attributes\.might/);
  assert.match(model, /initial\("heartMax"\)/);
  assert.match(main, /preCreateActor/);
});

test("Библиотека черт создаётся как папки и предметы в каталоге Foundry", () => {
  const layout = buildTraitLibraryLayout();
  const all = flattenTraitLibrary();
  const main = read("../scripts/main.js");
  const sheet = read("../scripts/sheets/character-sheet.js");
  const template = read("../templates/actor/character-sheet.hbs");
  assert.ok(all.length > 130);
  assert.equal(layout.folders.filter((folder) => folder.kind === "category").length, 9);
  assert.equal(layout.items.length, all.length);
  assert.equal(layout.rootName, "HKRPG — Библиотека черт");
  const jawsFolder = layout.folders.find((folder) => folder.key === "children:crushing-jaws");
  assert.equal(jawsFolder.parentKey, "category:naturalWeapon");
  const jawsOption = layout.items.find((record) => record.entry.id === "huge-jaws");
  assert.equal(jawsOption.folderKey, "children:crushing-jaws");
  assert.match(main, /async function ensureTraitLibrary/);
  assert.match(main, /Folder\.implementation\.create/);
  assert.match(main, /buildTraitLibraryLayout\(\)/);
  assert.match(main, /flags\.hkrpg\.traitLibraryId/);
  assert.match(main, /await ensureTraitLibrary\(\)/);
  assert.doesNotMatch(sheet, /buildTraitLibraryGroups|_onAddLibraryTrait/);
  assert.doesNotMatch(template, /data-add-library-trait=|hkrpg-trait-library__items/);
  assert.match(template, /HKRPG — Библиотека черт/);
  assert.match(template, /data-trait-child-dropzone=/);
  assert.match(sheet, /dropSelector: "\[data-trait-dropzone\], \[data-trait-child-dropzone\]"/);
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
  const automatic = calculateTraitBonuses([
    { id: "trait-dazzling", type: "trait", system: dazzling.system },
    { id: "trait-hauler", type: "trait", system: hauler.system }
  ]);
  assert.equal(automatic.cute, 1);
  assert.equal(automatic.carryingCapacity, 1);
  const rules = read("../scripts/rules/trait-bonuses.js");
  const model = read("../scripts/data/character-data.js");
  assert.match(rules, /carryingCapacity/);
  assert.match(model, /derived\.carryingCapacity = Math\.max/);
});

test("Вложенные папки сохраняют иерархию подчерты и подчерты II", () => {
  const layout = buildTraitLibraryLayout();
  const folders = new Map(layout.folders.map((folder) => [folder.key, folder]));
  const firstLevel = folders.get("children:crushing-jaws");
  const secondLevel = folders.get("children:huge-jaws");
  assert.equal(firstLevel.parentKey, "category:naturalWeapon");
  assert.equal(secondLevel.parentKey, "children:crushing-jaws");
  assert.ok(layout.items.some((record) =>
    record.entry.id === "exotic-poison-jaws" && record.folderKey === "children:huge-jaws"
  ));
});

test("Шапка листа использует высокий портрет и компактные поля справа", () => {
  const css = read("../styles/system.css");
  assert.match(css, /grid-template-columns: 176px minmax\(0, 1fr\) 154px/);
  assert.match(css, /width: 176px;\s*height: 240px;\s*min-height: 240px;\s*max-height: 240px/);
  assert.match(css, /hkrpg-header-main\s*\{\s*justify-content: flex-start/);
  assert.match(css, /object-fit: contain/);
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
