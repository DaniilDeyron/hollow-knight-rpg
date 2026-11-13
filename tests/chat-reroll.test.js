import test from "node:test";
import assert from "node:assert/strict";
import {
  renderAttributeRollCardContent,
  renderD6RollCardContent,
  resolveD6Rerolls
} from "../scripts/rolls/pool.js";
import { replaceD6ResultsInRollData } from "../scripts/rolls/chat-reroll.js";

test("Выбранные кости перебрасываются, но сохраняют лучший из двух результатов", () => {
  const result = resolveD6Rerolls(
    [2, 5, 3, 6],
    [0, 2],
    [5, 1],
    2
  );
  assert.deepEqual(result.results, [5, 5, 3, 6]);
  assert.deepEqual(result.history, [
    { index: 0, previous: 2, rolled: 5, kept: 5 },
    { index: 2, previous: 3, rolled: 1, kept: 3 }
  ]);
});

test("Новый меньший результат не отнимает уже полученный успех", () => {
  const result = resolveD6Rerolls([6], [0], [2], 1);
  assert.deepEqual(result.results, [6]);
  assert.deepEqual(result.history[0], {
    index: 0, previous: 6, rolled: 2, kept: 6
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

test("Карточка выделяет успехи зелёным и предлагает переброс, если он доступен", () => {
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
    rerollHistory: [{ index: 1, previous: 3, rolled: 1, kept: 3 }]
  });
  assert.doesNotMatch(html, /data-hkrpg-roll-action="start"/);
  assert.match(html, /Переброс потрачен/);
  assert.match(html, /кость 2: 3 → 1, оставлено 3/);
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

test("Карточка без доступных перебросов явно сообщает об этом", () => {
  const html = renderD6RollCardContent({
    kind: "d6-check",
    label: "Обычная проверка",
    results: [1, 5],
    rerollsAvailable: 0
  });
  assert.match(html, /Дополнительных перебросов нет/);
  assert.doesNotMatch(html, /data-hkrpg-roll-action="start"/);
});

test("Универсальный обработчик не ограничен только проверками характеристик", () => {
  const source = readFileSync(new URL("../scripts/rolls/chat-reroll.js", import.meta.url), "utf8");
  assert.match(source, /function isSupportedD6Roll/);
  assert.match(source, /hasGenericFlag/);
  assert.match(source, /export function activateD6RollControls/);
});
