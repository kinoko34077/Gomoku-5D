import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('game guide is an accessible modal using the shared focus boundary', () => {
  const source = read('src/components/GameControlsGuide.tsx');
  assert.match(source, /useModalFocus/);
  assert.match(source, /role="dialog"/);
  assert.match(source, /aria-modal="true"/);
  assert.match(source, /aria-labelledby=/);
});

test('confirm and win overlays use the same modal focus boundary', () => {
  const source = read('src/components/UIOverlay.tsx');
  const occurrences = source.match(/useModalFocus/g) ?? [];
  assert.ok(occurrences.length >= 2, 'confirm and win modal surfaces must share focus management');
  assert.ok((source.match(/role="dialog"/g) ?? []).length >= 2, 'confirm and win overlays need dialog roles');
  assert.ok((source.match(/aria-modal="true"/g) ?? []).length >= 2, 'confirm and win overlays need aria-modal');
});

test('shared modal focus hook traps Tab, supports Escape, and restores previous focus', () => {
  const source = read('src/hooks/useModalFocus.ts');
  assert.match(source, /document\.activeElement/);
  assert.match(source, /'Tab'/);
  assert.match(source, /event\.preventDefault\(\)/);
  assert.match(source, /first\.focus\(\)/);
  assert.match(source, /last\.focus\(\)/);
  assert.match(source, /event\.key === 'Escape'/);
  assert.match(source, /previousFocus/);
  assert.match(source, /\.focus\(\)/);
});
