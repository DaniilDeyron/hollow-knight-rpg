import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  renderAttributeRollCardContent,
  renderD6RollCardContent,
  resolveD6Rerolls
} from "../scripts/rolls/pool.js";
import { activateD6RollControls, replaceD6ResultsInRollData } from "../scripts/rolls/chat-reroll.js";

test("Выбранные кости заменяются новыми результатами", () => {
  const result = resolveD6Rerolls(
    [2, 5, 3, 6],
    [0, 2],
    [5, 1],
    2
  );
  assert.deepEqual(result.results, [5, 5, 1, 6]);
  assert.deepEqual(result.history, [
    { index: 0, previous: 2, rolled: 5, kept: 5 },
    { index: 2, previous: 3, rolled: 1, kept: 1 }
  ]);
});

test("Новый результат полностью заменяет прежний, даже если он ниже", () => {
  const result = resolveD6Rerolls([6], [0], [2], 1);
  assert.deepEqual(result.results, [2]);
  assert.deepEqual(result.history[0], {
    index: 0, previous: 6, rolled: 2, kept: 2
  });
});

test("Повторный бросок отклоняет выбор сверх лимита", () => {
  assert.throws(
    () => resolveD6Rerolls([1, 2, 3], [0, 1], [4, 5], 1),
    RangeError
  );
});

test("Повторный бросок отклоняет дубли и несуществующие кости", () => {
  assert.throws(
    () => resolveD6Rerolls([1, 2], [0, 0], [3, 4], 2),
    RangeError
  );
  assert.throws(
    () => resolveD6Rerolls([1, 2], [2], [3], 1),
    RangeError
  );
});

test("Повторный бросок требует один новый результат на каждую выбранную кость", () => {
  assert.throws(
    () => resolveD6Rerolls([1, 2], [0, 1], [4], 2),
    RangeError
  );
});

test("Карточка выделяет успехи зелёным и всегда предлагает переброс", () => {
  const html = renderAttributeRollCardContent({
    label: "Мощь",
    formula: "3d6",
    results: [1, 5, 6],
    rerollsAvailable: 1,
    rerollsUsed: false
  });
  assert.match(html, /hkrpg-die--success/);
  assert.match(html, /data-hkrpg-roll-action="start"/);
  assert.match(html, /Переброс/);
  assert.match(html, /Успехи[\s\S]*<strong>2<\/strong>/);
});

test("Режим выбора превращает кости в кнопки и показывает лимит выбора", () => {
  const html = renderAttributeRollCardContent({
    label: "Грация",
    formula: "4d6",
    results: [1, 2, 5, 6],
    rerollsAvailable: 2,
    selecting: true,
    selectedIndices: [1]
  });
  assert.equal((html.match(/data-hkrpg-reroll-index=/g) ?? []).length, 4);
  assert.match(html, /is-selected/);
  assert.match(html, /Выберите не более <strong>2<\/strong>/);
  assert.match(html, /data-hkrpg-roll-action="confirm"/);
  assert.match(html, /data-hkrpg-roll-action="cancel"/);
});

test("После переброса кнопка исчезает и в карточке остаётся история", () => {
  const html = renderAttributeRollCardContent({
    label: "Панцирь",
    formula: "2d6",
    results: [6, 3],
    rerollsAvailable: 1,
    rerollsUsed: true,
    rerollHistory: [{ index: 1, previous: 3, rolled: 1, kept: 1 }]
  });
  assert.doesNotMatch(html, /data-hkrpg-roll-action="start"/);
  assert.match(html, /Переброс выполнен/);
  assert.match(html, /кость 2: 3 → 1/);
});

test("Нажатия на кнопки и кости реально проходят путь start → select → reroll", async () => {
  const oldGame = globalThis.game;
  const oldUi = globalThis.ui;
  const oldRoll = globalThis.Roll;
  const messages = [];
  globalThis.game = { user: { id: "roller", isGM: false } };
  globalThis.ui = { notifications: { warn: (value) => messages.push(value), error: (value) => messages.push(value) } };

  let generated = [4, 2];
  globalThis.Roll = class {
    constructor(formula) {
      const count = Number(String(formula).match(/^(\\d+)d6$/)?.[1] ?? 0);
      this.dice = [{ faces: 6, results: generated.slice(0, count).map((result) => ({ result, active: true })) }];
      this.total = this.dice[0].results.reduce((sum, die) => sum + die.result, 0);
      this.formula = formula;
    }
    async evaluate() { return this; }
    toJSON() {
      return {
        class: "Roll", formula: this.formula, total: this.total,
        result: this.dice[0].results.map((die) => die.result).join(" + "),
        terms: [{ class: "Die", number: this.dice[0].results.length, faces: 6, results: this.dice[0].results }]
      };
    }
  };

  class FakeButton extends EventTarget {
    constructor(dataset = {}) {
      super();
      this.dataset = dataset;
      this.disabled = false;
      this.isConnected = true;
      this.removed = false;
    }
    remove() { this.removed = true; }
    click() { this.dispatchEvent(new Event("click", { cancelable: true })); }
  }

  const state = {
    kind: "attribute-check",
    label: "Мощь",
    formula: "3d6",
    results: [1, 6, 3],
    rerollsAvailable: 0,
    rerollsUsed: false,
    selecting: false,
    selectedIndices: [],
    rerollHistory: [],
    rollData: {
      class: "Roll", formula: "3d6", total: 10, result: "1 + 6 + 3",
      terms: [{ class: "Die", number: 3, faces: 6, results: [
        { result: 1, active: true }, { result: 6, active: true }, { result: 3, active: true }
      ] }]
    }
  };
  const message = {
    author: { id: "roller" },
    flags: { hkrpg: { attributeRoll: state } },
    async getFlag(scope, key) { return this.flags?.[scope]?.[key]; },
    async update(update) {
      this.content = update.content;
      this.flags.hkrpg.attributeRoll = update["flags.hkrpg.attributeRoll"];
      if (update.rolls) this.rolls = update.rolls;
    }
  };
  const waitForHandler = () => new Promise((resolve) => setTimeout(resolve, 0));
  const attach = (controls) => {
    const root = { querySelectorAll: () => controls };
    activateD6RollControls(message, root);
    return controls;
  };

  try {
    let controls = attach([new FakeButton({ hkrpgRollAction: "start" })]);
    controls[0].click();
    await waitForHandler();
    assert.equal(message.flags.hkrpg.attributeRoll.selecting, true);

    controls = attach([
      new FakeButton({ hkrpgRerollIndex: "0" }),
      new FakeButton({ hkrpgRerollIndex: "1" }),
      new FakeButton({ hkrpgRerollIndex: "2" })
    ]);
    controls[0].click();
    await waitForHandler();
    controls = attach([
      new FakeButton({ hkrpgRerollIndex: "2" }),
      new FakeButton({ hkrpgRollAction: "confirm" })
    ]);
    controls[0].click();
    await waitForHandler();
    assert.deepEqual(message.flags.hkrpg.attributeRoll.selectedIndices, [0, 2]);

    controls[1].click();
    await waitForHandler();
    const finalState = message.flags.hkrpg.attributeRoll;
    assert.deepEqual(finalState.results, [4, 6, 2]);
    assert.equal(finalState.rerollsUsed, true);
    assert.equal(finalState.selecting, false);
    assert.deepEqual(finalState.rerollHistory.map((entry) => entry.kept), [4, 2]);
    assert.ok(message.content.includes("кость 1: 1 → 4"));
    assert.ok(message.content.includes("кость 3: 3 → 2"));
    assert.ok(Array.isArray(message.rolls));
  } finally {
    if (oldGame === undefined) delete globalThis.game; else globalThis.game = oldGame;
    if (oldUi === undefined) delete globalThis.ui; else globalThis.ui = oldUi;
    if (oldRoll === undefined) delete globalThis.Roll; else globalThis.Roll = oldRoll;
  }
});

test("Подпись характеристики экранируется перед вставкой в HTML карточку", () => {
  const html = renderAttributeRollCardContent({
    label: '<img src=x onerror="alert(1)">',
    results: [5],
    rerollsAvailable: 0
  });
  assert.doesNotMatch(html, /<img src=x/);
  assert.match(html, /&lt;img/);
});

test("Сериализованные данные Roll обновляются теми же итоговыми значениями", () => {
  const original = {
    class: "Roll",
    formula: "3d6",
    result: "2 + 4 + 6",
    total: 12,
    terms: [{
      class: "Die",
      number: 3,
      faces: 6,
      results: [
        { result: 2, active: true },
        { result: 4, active: true },
        { result: 6, active: true }
      ]
    }]
  };
  const updated = replaceD6ResultsInRollData(original, [5, 4, 6]);
  assert.deepEqual(updated.terms[0].results.map((entry) => entry.result), [5, 4, 6]);
  assert.equal(updated.total, 15);
  assert.equal(updated.result, "5 + 4 + 6");
  assert.deepEqual(original.terms[0].results.map((entry) => entry.result), [2, 4, 6]);
});

test("Данные Roll без подходящего пула d6 не изменяются", () => {
  assert.equal(
    replaceD6ResultsInRollData({ formula: "2d8", terms: [{ faces: 8, results: [] }] }, [2, 3]),
    null
  );
});

test("Общая карточка навыка, атаки или сопротивления позволяет выбрать отдельные кости", () => {
  const html = renderD6RollCardContent({
    kind: "d6-check",
    label: "Проверка захвата",
    formula: "4d6",
    results: [1, 2, 5, 6],
    rerollsAvailable: 2,
    selecting: true,
    selectedIndices: [0, 1]
  });
  assert.match(html, /Проверка захвата/);
  assert.equal((html.match(/data-hkrpg-reroll-index=/g) ?? []).length, 4);
  assert.match(html, /Выберите не более <strong>2<\/strong>/);
  assert.match(html, /Перебросить выбранные \(2\/2\)/);
});

test("Карточка предлагает переброс даже когда значение характеристики целое", () => {
  const html = renderD6RollCardContent({
    kind: "d6-check",
    label: "Обычная проверка",
    results: [1, 5],
    rerollsAvailable: 0
  });
  assert.match(html, /data-hkrpg-roll-action="start"/);
  assert.match(html, /Можно перебросить любые кости один раз/);
  assert.doesNotMatch(html, /Дополнительных перебросов нет/);
});

test("Универсальный обработчик не ограничен только проверками характеристик", () => {
  const source = readFileSync(new URL("../scripts/rolls/chat-reroll.js", import.meta.url), "utf8");
  assert.match(source, /function isSupportedD6Roll/);
  assert.match(source, /hasGenericFlag/);
  assert.match(source, /export function activateD6RollControls/);
});

test("В системе есть общий вызов для будущих бросков навыков, атак и сопротивления", () => {
  const source = readFileSync(new URL("../scripts/rolls/pool.js", import.meta.url), "utf8");
  assert.match(source, /export async function rollD6Check/);
  assert.match(source, /flagKey = "d6Roll"/);
  assert.match(source, /rerollsAvailable = 0/);
});

