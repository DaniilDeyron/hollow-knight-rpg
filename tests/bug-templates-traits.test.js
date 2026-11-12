import test from "node:test";
import assert from "node:assert/strict";
import { HK_BUG_TEMPLATES, getBugTemplate } from "../scripts/data/bug-templates.js";
import { HK_TRAIT_LIBRARY, flattenTraitLibrary } from "../scripts/data/trait-library.js";
import { resolveActiveTraitItems, calculateTraitBonuses, canSelectTraitChild } from "../scripts/rules/trait-bonuses.js";

test("Книга: три шаблона имеют правильные стартовые характеристики, запасы и размеры", () => {
  assert.deepEqual(HK_BUG_TEMPLATES.small.attributes, { might:2, insight:3, shell:3, grace:4 });
  assert.deepEqual(HK_BUG_TEMPLATES.medium.attributes, { might:3, insight:3, shell:3, grace:3 });
  assert.deepEqual(HK_BUG_TEMPLATES.large.attributes, { might:4, insight:3, shell:4, grace:2 });
  assert.equal(HK_BUG_TEMPLATES.small.resources.hunger, -1);
  assert.equal(HK_BUG_TEMPLATES.small.resources.satietyMaxOverride, 15);
  assert.equal(HK_BUG_TEMPLATES.medium.resources.hunger, 4);
  assert.equal(HK_BUG_TEMPLATES.medium.resources.satietyMaxOverride, 20);
  assert.equal(HK_BUG_TEMPLATES.large.resources.hunger, 9);
  assert.equal(HK_BUG_TEMPLATES.large.resources.satietyMaxOverride, 25);
  assert.deepEqual(HK_BUG_TEMPLATES.large.token, { width:2, height:2 });
  assert.equal(getBugTemplate("unknown").size, "medium");
});

test("Библиотека черт содержит девять книжных групп и вложенные уровни", () => {
  const categories = new Set(flattenTraitLibrary().map((entry) => entry.category));
  assert.deepEqual([...categories].sort(), [
    "body","characteristics","mind","movement","mystical","naturalDefense",
    "naturalWeapon","physiological","senses"
  ]);
  const all = flattenTraitLibrary();
  assert.ok(all.some((entry) => entry.kind === "main"));
  assert.ok(all.some((entry) => entry.kind === "subtrait"));
  assert.ok(all.some((entry) => entry.kind === "subtrait2"));
  assert.ok(HK_TRAIT_LIBRARY.length >= 50);
  assert.equal(new Set(all.map((entry) => entry.id)).size, all.length);
});

test("Подчертa даёт бонус только при выборе и активном родителе", () => {
  const items = [
    { id:"main", type:"trait", system:{ kind:"main", selected:true, might:1 } },
    { id:"sub", type:"trait", system:{ kind:"subtrait", parentId:"main", selected:false, might:2 } },
    { id:"sub2", type:"trait", system:{ kind:"subtrait2", parentId:"sub", selected:true, might:4 } }
  ];
  assert.deepEqual(resolveActiveTraitItems(items).map((item) => item.id), ["main"]);
  assert.equal(calculateTraitBonuses(items).might, 1);
  items[1].system.selected = true;
  assert.deepEqual(resolveActiveTraitItems(items).map((item) => item.id), ["main","sub","sub2"]);
  assert.equal(calculateTraitBonuses(items).might, 7);
});

test("Выбор подчерты требует соответствующего выбранного родителя", () => {
  const parent = { id:"main", type:"trait", system:{ selected:true } };
  const child = { id:"child", type:"trait", system:{ parentId:"main" } };
  assert.equal(canSelectTraitChild(parent, child), true);
  parent.system.selected = false;
  assert.equal(canSelectTraitChild(parent, child), false);
});

test("Числовые бонусы включают Голод, характеристики, запасы и скорость", () => {
  const bonuses = calculateTraitBonuses([
    { id:"a", type:"trait", system:{ kind:"main", selected:true, hunger:2, might:1, heartMax:1, speed:-1 } }
  ]);
  assert.equal(bonuses.hunger, 2);
  assert.equal(bonuses.might, 1);
  assert.equal(bonuses.heartMax, 1);
  assert.equal(bonuses.speed, -1);
});
