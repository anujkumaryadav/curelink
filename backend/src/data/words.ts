export const SPELL_BEE_WORDS: string[] = [
  "apple", "banana", "cat", "dog", "elephant",
  "flower", "garden", "happy", "island", "jungle",
  "kitten", "lemon", "monkey", "nature", "orange",
  "pencil", "queen", "rabbit", "sunset", "tiger",
  "water", "yellow", "zebra", "book", "chair",
  "desk", "fish", "grape", "house", "ice",
  "jump", "kite", "lamp", "moon", "nest"
];

export function getWords(): string[] {
  return SPELL_BEE_WORDS;
}

export function getRandomWord(): string {
  return SPELL_BEE_WORDS[Math.floor(Math.random() * SPELL_BEE_WORDS.length)];
}
