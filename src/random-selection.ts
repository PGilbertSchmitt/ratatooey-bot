import { SenderReceiverPairs } from './db-client';

export const shuffle = (memberIds: string[]) => {
  const shuffledIds = memberIds.slice();

  // Time for a Knuth Shuffle
  for (let i = 1; i < memberIds.length; i++) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = shuffledIds[i];
    shuffledIds[i] = shuffledIds[j];
    shuffledIds[j] = tmp;
  }

  return shuffledIds;
};

export const randomSelection = (memberIds: string[]): SenderReceiverPairs => {
  const shuffledIds = shuffle(memberIds);
  const len = shuffledIds.length;
  return shuffledIds.map((sender, i) => {
    const receiver = shuffledIds[(i + 1) % len];
    return [sender, receiver];
  });
};

/**
 * This code snippet can be used to show that a the automatic selection:
 * - is adequately random
 * - never assigns a member to themselves
 * - always assigns every member as a sender and a receiver (no one left out)
 */
// (() => {
//     const fakeMembers = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];
//     const allResults = times(() => {
//         const result = autoSelection(fakeMembers);
//         const resultMap = fromPairs(result);
//         if (keys(resultMap).length !== fakeMembers.length) {
//             throw `Bad result, missing key: ${result}`;
//         }
//         if (uniq(values(resultMap)).length !== fakeMembers.length) {
//             throw `Bad result, missing value: ${result}`;
//         }
//         if (any(([k, v]) => k === v, result)) {
//             throw `Bad result, self sending: ${result}`;
//         }
//         return resultMap;
//     }, 10_000);
//     const resultTallies = fromPairs(fakeMembers.map(sender => {
//         const tally: Record<string, number> = {};
//         for (const receiver of fakeMembers) {
//             const receiverCount = allResults.filter(res => res[sender] === receiver).length;
//             tally[receiver] = receiverCount;
//         }
//         return [sender, tally];
//     }));
//     console.log(resultTallies);
// })();
