import { expect, test } from 'vitest';
import { magicSelection } from '../src/magic-selection';
import { shuffle } from '../src/random-selection';
import { fromPairs, keys, none, times, uniq, values } from 'ramda';

// Creates a random history of previous selections for the given set of members
const createPriors = (members: string[], numPriors: number) => {
  const priors: Array<[string, string]> = [];

  times(() => {
    const randomMembers = shuffle(members);
    const count = 4 + Math.floor(Math.random() * (members.length - 3));
    const addedMembers = randomMembers.slice(0, count);
    addedMembers.forEach((sender, i) => {
      const receiver = addedMembers[(i + 1) % count];
      priors.push([sender, receiver]);
    });
  }, numPriors);

  return priors;
};

// Limiting this to 8 members keeps the total runtime to less than a second.
test('Magic (best) selection', () => {
  // Tries 100 random histories to make sure they all successfully generate a selection
  const fakeMembers = [
    'alice',
    'bob',
    'carol',
    'dave',
    'eve',
    'fred',
    'george',
    'harry',
  ];

  const priorSelections = createPriors(fakeMembers, 20);
  times(() => {
    const result = magicSelection(fakeMembers, priorSelections);
    const resultMap = fromPairs(result);
    expect(keys(resultMap).length).toEqual(fakeMembers.length);
    expect(uniq(values(resultMap)).length).toEqual(fakeMembers.length);
    expect(none(([k, v]) => k === v, result)).toBe(true);
  }, 100);
});
