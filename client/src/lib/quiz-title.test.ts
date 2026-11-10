import assert from "node:assert/strict";
import test from "node:test";
import { quizDisplayTitle } from "./quiz-title";

test("quiz titles pass through and blanks stay untitled", () => {
  assert.equal(quizDisplayTitle("Entry quiz"), "Entry quiz");
  assert.equal(quizDisplayTitle("  "), "Untitled quiz");
  assert.equal(quizDisplayTitle(null), "Untitled quiz");
  assert.equal(quizDisplayTitle(undefined), "Untitled quiz");
  assert.notEqual(quizDisplayTitle(undefined), "Quiz Result");
});
