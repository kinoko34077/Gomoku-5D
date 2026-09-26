import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/hooks/useFiveDGomoku.ts', import.meta.url), 'utf8');

function resetCallbackBlock() {
  const start = source.indexOf('const handleReset = useCallback');
  assert.notEqual(start, -1, 'handleReset callback not found');
  const end = source.indexOf('const applySessionConfig', start);
  assert.notEqual(end, -1, 'handleReset callback end boundary not found');
  return source.slice(start, end);
}

test('handleReset tracks the complete settings object used to initialize a new round', () => {
  const block = resetCallbackBlock();
  assert.match(block, /resetGameState\(settings\.boardSize, settings\)/);
  assert.match(block, /\[resetGameState, settings\]/);
  assert.doesNotMatch(block, /\[resetGameState, settings\.boardSize\]/);
});
