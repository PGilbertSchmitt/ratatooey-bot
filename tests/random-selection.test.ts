import { expect, test } from 'vitest';
import { randomSelection } from '../src/random-selection';
import { any, fromPairs, keys, none, times, uniq, values } from 'ramda';

test('Auto (random) selection', () => {
  // Tries 10,000 random selections to make sure they all work
  const fakeMembers = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];
  times(() => {
    const result = randomSelection(fakeMembers);
    const resultMap = fromPairs(result);
    expect(keys(resultMap).length).toEqual(fakeMembers.length);
    expect(uniq(values(resultMap)).length).toEqual(fakeMembers.length);
    expect(none(([k, v]) => k === v, result)).toBe(true);
  }, 10_000);
});
