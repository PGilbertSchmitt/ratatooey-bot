import { min, reduce, sort, toPairs } from "ramda";

const PRIOR_SELECTIONS: Array<[string, string]> = [
  ['alice', 'bob'],
  ['alice', 'carol'],
  ['alice', 'eve'],
  ['alice', 'dave'],
  ['bob', 'carol'],
  ['bob', 'dave'],
  ['carol', 'eve'],
  ['eve', 'alice'],
];

type Tallies = Record<string, Record<string, number>>;
type InvertedTallies = Record<string, Map<number, string[]>>;

const lowest = reduce(min<number>, Infinity);

const bestSelection = (
  userPool: string[],
  priorSelections: Array<[string, string]>,
) => {
  const tallies: Tallies = {};
  
  for (const from of userPool) {
    tallies[from] = {};
    for (const to of userPool) {
      if (from !== to) {
        tallies[from][to] = 0;
      }
    }
  }

  for (const [from, to] of priorSelections) {
    if (tallies[from] && (tallies[from][to] !== undefined)) {
      tallies[from][to]++;
    }
  }

  const invertedTallies = invertTally(tallies);

  const priorityComparator = (
    a: string,
    b: string,
  ): number => {
    const aTally = invertedTallies[a];
    const bTally = invertedTallies[b];
    const aLowestCount = lowest(Array.from(aTally.keys()));
    const bLowestCount = lowest(Array.from(bTally.keys()));
    if (aLowestCount !== bLowestCount) {
      // The higher "lowest" indicates a higher priority, so it should be earlier in the list
      // so the comparison is reversed (b - a)
      return bLowestCount - aLowestCount;
    }

    // Since the two compared names have the same lowest count, we compare by number names at lowest count
    // Unlike with lowest count, the lower value has the higher priority (a - b)
    return aTally.get(aLowestCount)!.length - bTally.get(bLowestCount)!.length;
  };

  // const highestPriority

  const results = sort(priorityComparator, userPool);
  console.log(results);
};

const invertTally = (
  tallies: Tallies,
) => {
  const output: InvertedTallies = {};
  for (const [from, tally] of toPairs(tallies)) {
    const reverseTally = new Map<number, string[]>();
    for (const [to, count] of toPairs(tally)) {
      const current = reverseTally.get(count) || [];
      reverseTally.set(count, [...current, to]);
    }
    output[from] = reverseTally;
  }
  return output;
};

bestSelection(['eve', 'carol', 'alice', 'bob', 'dave', ], PRIOR_SELECTIONS);
