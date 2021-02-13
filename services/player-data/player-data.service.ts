import { Document } from 'mongoose';
import { filter, find, map, trim } from 'lodash';
import { IPlayer, Player } from '../../db/collections/Player'
import { Character } from '../character';

import * as characterJsonData from '../character-data.json';
import { CharacterToEmoji } from '../character-to-emoji';
import _ = require('lodash');
import { Emoji } from 'discord.js';
import { TierToEmoji } from '../tier-to-emoji';
import { getCharacterFromUserString } from '../character-fuzzy-match/character-fuzzy-match.service';
import { getDiscordMonospace } from '../monospacer/monospacer.service';


/** Returns the list of players */
export const getPlayerList = async (): Promise<IPlayer[]> => {
  return new Promise((resolve, reject) => {
    Player.find((err, resultList) => {
      if (err) reject(err);

      const players = map(resultList, (result) => {
        return result.toObject() as IPlayer;
      })
      resolve(players);
    })
  });
};

/** Returns a player for the given id */
export const getPlayer = async (playerName: string): Promise<IPlayer|null> => {
  const playerList = await getPlayerList();
  const player = find(playerList, (target) => {
    return target.player === _.toLower(playerName);
  });
  return player;
};

/** Returns a player for the given id */
export const getPlayerByDiscordId = async (discordUserId: string): Promise<IPlayer|null> => {
  const playerList = await getPlayerList();
  const player = find(playerList, (target) => {
    return target.discordUserId === _.toLower(discordUserId);
  });
  return player;
};

/** Adds a new user to the character-drop bot.  Returns true if record was created. */
export const savePlayer = async (newPlayer: IPlayer): Promise<Document<IPlayer>> => {
  // Check if player already exists
  let player = await getMongoPlayerByDiscordId(newPlayer.discordUserId);
  if (!player) {
    player = new Player();
  }

  // Create or update player
  player.set(newPlayer);
  await player.save();

  return player;
};

/** Returns the list of players */
const getMongoPlayerById = async (player: string): Promise<Document<IPlayer>> => {
  return new Promise((resolve, reject) => {
    Player.findOne( { "player": _.toLower(player) }, (err, result) => {
      if (err) reject(err);
      resolve(result);
    })
  });
};

/** Returns the list of players */
const getMongoPlayerByDiscordId = async (discordUserId: string): Promise<Document<IPlayer>> => {
  return new Promise((resolve, reject) => {
    Player.findOne( { "discordUserId": _.toLower(discordUserId) }, (err, result) => {
      if (err) reject(err);
      resolve(result);
    })
  });
};

/** parses the character preference string to CharacterPref object */
export const parseRawCharacterPref = (msg, characterPrefString: string): Character[] => {
  return [];
}

/** parses the character preference arguments to CharacterPref object */
export const parseCharacterPref = (msg,
  legendaryCharacterList: string[],
  epicCharacterList: string[],
  banCharacterList: string[]
): Character[] => {

  const preferences = _.map(characterJsonData as Character[], (pref) => {
    pref.tier = undefined;
    pref.isGolden = false;
    return pref;
  });

  // Set legendary pref
  _.forEach(legendaryCharacterList, (legendaryCharacter) => {
    const legendaryCharacterEmoji = parseCharacter(msg, legendaryCharacter);
    const pref = _.find(preferences, (character) => character.id === legendaryCharacterEmoji?.value);
    pref.tier = 'legendary';
  });

  // Set epic pref
  _.forEach(epicCharacterList, (epicCharacter) => {
    const epicCharacterEmoji = parseCharacter(msg, epicCharacter);
    const pref = _.find(preferences, (character) => character.id === epicCharacterEmoji?.value);
    pref.tier = 'epic';
  });

  // Set common/ban pref
  _.forEach(banCharacterList, (banCharacter) => {
    const banCharacterEmoji = parseCharacter(msg, banCharacter);
    const pref = _.find(preferences, (character) => character.id === banCharacterEmoji?.value);
    pref.tier = 'common';
  });

  return preferences;
}

/** Returns character from string */
const parseCharacter = (msg, characterString: string): CharacterToEmoji|null => {
  const emoji = getCharacterFromUserString(trim(characterString));
  if (emoji === null) throw 'Unknown character';
  return emoji;
};

/** Returns the character preference as a string */
export const characterPrefToString = (msg, characterPref: Character[]): string => {
  const legendaryCharacters = getCharacterString(msg, _.filter(characterPref, (pref) => pref.tier === 'legendary'));
  const epicCharacters = getCharacterString(msg, _.filter(characterPref, (pref) => pref.tier === 'epic'));
  const banCharacters = getCharacterString(msg, _.filter(characterPref, (pref) => pref.tier === 'common'));

  return `${getEmoji(msg, TierToEmoji.LEGENDARY.description)} ${legendaryCharacters} ${getEmoji(msg, TierToEmoji.EPIC.description)} ${epicCharacters} ${getEmoji(msg, TierToEmoji.BAN.description)} ${banCharacters}`;
};

const getCharacterString = (msg, characterList: Character[]): string => {
  return _.reduce(characterList, (resultSoFar, character) => {
    const name = getEmoji(msg, CharacterToEmoji.getEnumFromValue(character.name).description);
    if (resultSoFar === '') {
      resultSoFar = `${getDiscordMonospace(name, 15)}`;
    } else {
      resultSoFar += ` ${getDiscordMonospace(name, 15)}`;
    }
    return resultSoFar;
  }, '');
};

/** Returns the emoji or name if not found */
export const getEmoji = (msg, emojiName): Emoji|string => {
  const emoji = _.get(msg, 'guild.emojis.cache', []).find(emoji => emoji.name == emojiName);
  return _.defaultTo(emoji, `${emojiName}`);
}
