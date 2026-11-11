import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Архив Foundry включает SVG-иконку удушения", () => {
  const workflow = readFileSync(new URL("../.github/workflows/release.yml", import.meta.url), "utf8");
  assert.match(workflow, /zip -r hollow-knight-rpg\.zip system\.json scripts templates styles lang assets/);
  assert.match(workflow, /assets\/icons\/status\/suffocation\.svg/);
  const icon = readFileSync(new URL("../assets/icons/status/suffocation.svg", import.meta.url), "utf8");
  assert.match(icon, /<svg\b/);
  assert.match(icon, /<\/svg>/);
});
