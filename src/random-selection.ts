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
