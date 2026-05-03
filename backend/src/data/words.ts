export const SPELL_BEE_WORDS: string[] = [
  "banana",
  "happy",
  "disha",
  "anuj",
  "prem",
  "vishnu",
  "curelink"
];

export function getWords(): string[] {
  return SPELL_BEE_WORDS;
}

export function getRandomWord(): string {
  return SPELL_BEE_WORDS[Math.floor(Math.random() * SPELL_BEE_WORDS.length)];
}
