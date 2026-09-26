import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/hooks/useFiveDGomoku.ts', import.meta.url), 'utf8');

test('turn start belongs to render-safe state rather than a render-read ref', () => {
  assert.match(source, /const \[turnStartedAt, setTurnStartedAt\] = useState<number \| null>/);
  assert.doesNotMatch(source, /turnStartedAtRef/);
  assert.match(source, /getDisplayedRemainingTime\([\s\S]*?turnStartedAt,[\s\S]*?clockNow/);
});

test('clock interval effect does not synchronously reset clock render state', () => {
  const condition = 'if (settings.timeLimitSeconds <= 0 || winInfo) {';
  const conditionIndex = source.indexOf(condition);
  const start = source.lastIndexOf('useEffect(() => {', conditionIndex);
  const end = source.indexOf('useThreatDetector({', conditionIndex);
  assert.notEqual(conditionIndex, -1);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const clockEffect = source.slice(start, end);
  const beforeInterval = clockEffect.slice(0, clockEffect.indexOf('window.setInterval'));
  assert.doesNotMatch(beforeInterval, /setClockNow\(/);
  assert.doesNotMatch(beforeInterval, /setTurnStartedAt\(/);
});

test('clock transitions explicitly start or stop the turn clock at command boundaries', () => {
  assert.match(source, /setTurnStartedAt\(resolvedSettings\.timeLimitSeconds > 0 \? now : null\)/);
  assert.match(source, /setTurnStartedAt\(nextWin \? null : moveCompletedAt\)/);
  assert.match(source, /setTurnStartedAt\(currentSettings\.timeLimitSeconds > 0 && !state\.winInfo \? restoredAt : null\)/);
  assert.match(source, /setTurnStartedAt\(null\)/);
});
