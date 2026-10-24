import { test } from 'node:test';
import assert from 'node:assert/strict';
import { messageGeometry } from '../src/message-geometry.ts';

test('date fits beside a short last line without narrowing earlier text lines', () => {
  const g = messageGeometry(338, 330, 80, 50);
  assert.equal(g.inline, true);
  assert.ok(g.width >= 330);
  assert.equal(g.dateRowHeight, 0);
});
test('a full last line keeps its width; only the date moves below', () => {
  const g = messageGeometry(338, 330, 330, 50);
  assert.equal(g.inline, false);
  assert.ok(g.width >= 330);
  assert.equal(g.dateRowHeight, 13);
});
test('short messages expand only enough to accommodate the receipt', () => {
  const g = messageGeometry(338, 24, 24, 48);
  assert.ok(g.width >= 24 + 48 + 6);
  assert.ok(g.width < 100);
});
test('date never overlaps RTL text or a full-width unbroken word', () => {
  assert.equal(messageGeometry(338, 100, 100, 48, true).inline, false);
  assert.equal(messageGeometry(338, 338, 338, 48).dateRowHeight, 13);
  assert.equal(messageGeometry(338, 338, 338, 48).width, 338);
});
