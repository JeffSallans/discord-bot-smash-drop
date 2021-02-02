import { Document } from 'mongoose';
import { filter, find, map } from 'lodash';
import { IPlayer, Player } from '../../db/collections/Player'
import { Naut } from '../naut';

import * as nautJsonData from '../naut-data.json';
import { NautToEmoji } from '../naut-to-emoji';
import _ = require('lodash');
import { Emoji } from 'discord.js';
import { TierToEmoji } from '../tier-to-emoji';


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

/** Adds a new user to the naut-drop bot.  Returns true if record was created. */
export const savePlayer = async (newPlayer: IPlayer): Promise<Document<IPlayer>> => {
  // Check if player already exists
  let player = await getMongoPlayerById(newPlayer.player);
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

/** parses the naut preference string to NautPref object */
export const parseRawNautPref = (msg, nautPrefString: string): Naut[] => {
  return [];
}

/** parses the naut preference arguments to NautPref object */
export const parseNautPref = (msg,
  legendaryNautList: string[],
  epicNautList: string[],
  banNautList: string[]
): Naut[] => {

  const preferences = _.map(nautJsonData as Naut[], (pref) => {
    pref.tier = undefined;
    pref.isGolden = false;
    return pref;
  });

  // Set legendary pref
  _.forEach(legendaryNautList, (legendaryNaut) => {
    const legendaryNautEmoji = parseNaut(msg, legendaryNaut);
    const pref = _.find(preferences, (naut) => naut.id === legendaryNautEmoji?.value);
    pref.tier = 'legendary';
  });

  // Set epic pref
  _.forEach(epicNautList, (epicNaut) => {
    const epicNautEmoji = parseNaut(msg, epicNaut);
    const pref = _.find(preferences, (naut) => naut.id === epicNautEmoji?.value);
    pref.tier = 'epic';
  });

  // Set common/ban pref
  _.forEach(banNautList, (banNaut) => {
    const banNautEmoji = parseNaut(msg, banNaut);
    const pref = _.find(preferences, (naut) => naut.id === banNautEmoji?.value);
    pref.tier = 'common';
  });

  return preferences;
}

/** Returns naut from string */
const parseNaut = (msg, nautEmojiString: string): NautToEmoji|null => {
  const regexResult = nautEmojiString.match(/:(.*?):/);
  const emojiDescription = _.get(regexResult, '[1]', null);
  if (emojiDescription === null) throw 'Unknown naut';

  const nautEmoji = NautToEmoji.getEnumFromDescription(emojiDescription)
  return nautEmoji;
};

/** Returns the naut preference as a string */
export const nautPrefToString = (msg, nautPref: Naut[]): string => {
  const legendaryNauts = getNautString(msg, _.filter(nautPref, (pref) => pref.tier === 'legendary'));
  const epicNauts = getNautString(msg, _.filter(nautPref, (pref) => pref.tier === 'epic'));
  const banNauts = getNautString(msg, _.filter(nautPref, (pref) => pref.tier === 'common'));

  return `${getEmoji(msg, TierToEmoji.LEGENDARY.description)} ${legendaryNauts} ${getEmoji(msg, TierToEmoji.EPIC.description)} ${epicNauts} ${getEmoji(msg, TierToEmoji.BAN.description)} ${banNauts}`;
};

const getNautString = (msg, nautList: Naut[]): string => {
  return _.reduce(nautList, (resultSoFar, naut) => {
    const name = getEmoji(msg, NautToEmoji.getEnumFromValue(naut.name).description);
    if (resultSoFar === '') {
      resultSoFar = `${name}`;
    } else {
      resultSoFar += ` ${name}`;
    }
    return resultSoFar;
  }, '');
};

/** Returns the emoji or name if not found */
export const getEmoji = (msg, emojiName): Emoji|string => {
  const emoji = _.get(msg, 'guild.emojis.cache', []).find(emoji => emoji.name == emojiName);
  return _.defaultTo(emoji, `:${emojiName}:`);
}
