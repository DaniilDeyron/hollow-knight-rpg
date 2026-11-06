import test from "node:test";
import assert from "node:assert/strict";
import { countPathRanks, buildCharmNotchState, evaluateCharmEquip } from "../scripts/rules/charm-tracker.js";

test("Считает каждый отмеченный Ранг Пути как одну Метку", () => {
  assert.equal(countPathRanks({
    slot1:{rank1:true,rank2:true,rank3:false},
    slot2:{rank1:true,rank2:false,rank3:false}
  }),3);
});
test("Считает занятые и свободные Метки по надетым амулетам", () => {
  const state=buildCharmNotchState(6,[
    {name:"Rusted Blades",system:{notches:2,equipped:true}},
    {name:"Silent Burden",system:{notches:1,equipped:true}},
    {name:"Spare Mask",system:{notches:3,equipped:false}}
  ]);
  assert.equal(state.used,3);assert.equal(state.free,3);
  assert.deepEqual(state.slots.map(x=>x.filled),[true,true,true,false,false,false]);
});
test("Отображает переочарование при переполнении", () => {
  const state=buildCharmNotchState(3,[
    {name:"Rusted Blades",system:{notches:2,equipped:true}},
    {name:"Spare Mask",system:{notches:3,equipped:true}}
  ]);
  assert.equal(state.overflow,2);assert.equal(state.overcharmed,true);
});
test("Разрешает надевать амулет, если хватает Меток", () => {
  const r=evaluateCharmEquip(5,[{name:"First",system:{notches:2,equipped:true}}],{name:"Second",system:{notches:3}});
  assert.equal(r.allowed,true);assert.equal(r.overcharmed,false);
});
test("Разрешает только один амулет сверх Меток, если есть свободная Метка", () => {
  const equipped=[{name:"First",system:{notches:2,equipped:true}}];
  const r=evaluateCharmEquip(3,equipped,{name:"Heavy",system:{notches:2}});
  assert.equal(r.allowed,true);assert.equal(r.overcharmed,true);
  const next=evaluateCharmEquip(3,[...equipped,{name:"Heavy",system:{notches:2,equipped:true}}],{name:"Another",system:{notches:1}});
  assert.equal(next.allowed,false);assert.equal(next.reason,"already-overcharmed");
});
test("Не разрешает надевать амулет, если свободных Меток не осталось", () => {
  const r=evaluateCharmEquip(3,[{name:"First",system:{notches:3,equipped:true}}],{name:"Second",system:{notches:1}});
  assert.equal(r.allowed,false);assert.equal(r.reason,"no-free-notch");
});
test("Не разрешает надевать несколько копий одного амулета", () => {
  const r=evaluateCharmEquip(8,[{name:"Rusted Blades",system:{notches:2,equipped:true}}],{name:"Rusted Blades",system:{notches:2}});
  assert.equal(r.allowed,false);assert.equal(r.reason,"duplicate");
});
