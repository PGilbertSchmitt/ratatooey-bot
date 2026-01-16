import { zip } from 'ramda';
import { SenderReceiverPairs } from './db-client';

type Tallies = Record<string, Record<string, number>>;

/**
 * This function generates the best possible set of secret-santa pairs, but probably
 * not in the most efficient way. It calculates all possible sets of pairs by creating
 * derangements of the user list (as zipping the user list with a derangement creates
 * a valid set of pairings), then iterates through them to find the one with the lowest
 * "entropy score". The score is just the summing the number of times each sender has
 * had the given receiver.
 *
 * Because of the number of derangements of a set grows with the factorial of the number
 * of elements, this function gets really slow once you reach 10 members. There's
 * definitely a better way, but I decided to be lazy about it (since the discord I'm
 * making this for doesn't even have 10 people in it).
 */
export const magicSelection = (
  memberPool: string[],
  priorSelections: Array<[string, string]>,
): SenderReceiverPairs => {
  const tallies = tallyUsers(memberPool, priorSelections);

  const calculateScore = (derangement: string[]): number =>
    memberPool.reduce(
      (sum, sender, i) => sum + tallies[sender][derangement[i]],
      0,
    );

  let lowestScore = Infinity;
  let bestDerangement = memberPool; // will be overwritten
  for (const derangement of allDerangements(memberPool)) {
    const score = calculateScore(derangement);
    if (score < lowestScore) {
      lowestScore = score;
      bestDerangement = derangement;
    }
  }

  return zip(memberPool, bestDerangement);
};

const tallyUsers = (
  userPool: string[],
  priors: Array<[string, string]>,
): Tallies => {
  const tallies: Tallies = {};

  for (const from of userPool) {
    tallies[from] = {};
    for (const to of userPool) {
      if (from !== to) {
        tallies[from][to] = 0;
      }
    }
  }

  for (const [from, to] of priors) {
    if (tallies[from] && tallies[from][to] !== undefined) {
      tallies[from][to]++;
    }
  }

  return tallies;
};

// Heap's algorithm for permutations
// This is an efficient way to make all permutations, but not all derangements.
// There's probably a smoother operation that skips large swathes of permutations.
const allDerangements = (input: string[]): Array<string[]> => {
  const permutation = input.slice();
  const len = input.length;
  const results = [];
  const c = new Array(len).fill(0);
  let i = 1;

  const isDerangement = (arr: string[]): boolean => {
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] === input[i]) {
        return false;
      }
    }
    return true;
  };

  while (i < len) {
    if (c[i] < i) {
      const k = i % 2 && c[i];
      const tmp = permutation[i];
      permutation[i] = permutation[k];
      permutation[k] = tmp;
      c[i]++;
      i = 1;
      if (isDerangement(permutation)) {
        results.push(permutation.slice());
      }
    } else {
      c[i] = 0;
      i++;
    }
  }

  return results;
};
