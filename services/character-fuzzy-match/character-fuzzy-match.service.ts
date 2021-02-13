import * as FuzzyMatching from 'fuzzy-matching';
import { map } from 'lodash';
import { CharacterToEmoji } from '../character-to-emoji';

const allCharacters = CharacterToEmoji.getAllPairs();
const characterArray = map(allCharacters, (character) => character.description);
const characterFuzzyMatcher = new FuzzyMatching(characterArray);

/**
 * Returns the character emoji for the given string using fuzzy matching
 * @param characterString
 */
export const getCharacterFromUserString = (characterString: string): CharacterToEmoji|null => {
  const answer = characterFuzzyMatcher.get(characterString).value;
  const emoji = CharacterToEmoji.getEnumFromDescription(answer);
  return emoji;
}