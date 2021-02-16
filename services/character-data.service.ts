import { get, filter, shuffle, random, map, flatten, union, includes, some, isNil } from 'lodash';
import { Character } from './character';
import * as characterJsonData from './character-data.json';
import { IPlayer } from '../db/collections/Player';

export class CharacterDataService {

  allCharacters: Character[];

  constructor() {
    this.allCharacters = characterJsonData as Character[];
    console.debug('characters: ', this.allCharacters);
  }

  getCharactersForPlayer(player: IPlayer): Character[] {
    let playerCharacters = player.characterPref;

    // Remove any golden flags
    playerCharacters.forEach((character) => {
      character.isGolden = false;
    });
    return playerCharacters;
  }

  getRandomCharactersPack(player: IPlayer) {
    const characters = this.getCharactersForPlayer(player);

    const legendaryCharacters = filter(characters, (character) => character.tier === 'legendary') || [];
    const epicCharacters = filter(characters, (character) => character.tier === 'epic') || [];
    const rareCharacters = filter(characters, (character) => character.tier !== 'legendary' && character.tier !== 'epic' && character.tier !== 'common') || [];

    const shuffledLegendaryCharacters = shuffle(legendaryCharacters);
    const shuffledEpicCharacters = shuffle(epicCharacters);
    const shuffledRareCharacters = shuffle(rareCharacters);

    const characterPoolRolls = [
      random(19),
      random(19),
      random(19),
      random(19),
      random(19),
    ];

    const characterPool = map(characterPoolRolls, (roll) => {
      if (roll === 19) {
        return shuffledLegendaryCharacters.pop();
      } else if (includes([15, 16, 17, 18], roll)) {
        return shuffledEpicCharacters.pop();
      } else {
        return shuffledRareCharacters.pop();
      }
    });

    const hasLegendaryOrEpicCharacters = some(characterPool, (character) => character && (character.tier === 'legendary' || character.tier === 'epic'));

    if (!hasLegendaryOrEpicCharacters) {
      characterPool[0] = shuffledEpicCharacters.pop();
    }

    // Add golden plating
    const goldPlatingIndex = random(14);
    if (!isNil(characterPool[goldPlatingIndex]) && characterPool[goldPlatingIndex].tier !== 'legendary') {
      characterPool[goldPlatingIndex].isGolden = true;
    }

    return shuffle(characterPool);
  }
}
