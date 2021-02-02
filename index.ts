import { defaultTo, isEmpty, trim } from 'lodash';
import { Character } from './services/character';
import { CharacterDataService } from './services/character-data.service';
import { CharacterToEmoji } from './services/character-to-emoji';
import { TierToEmoji } from './services/tier-to-emoji';
import { setupConnection } from './db/mongodbConnection';
import { getEmoji, getPlayer, getPlayerList, characterPrefToString, parseCharacterPref, savePlayer } from './services/player-data/player-data.service';
import { connection, connections, Mongoose } from 'mongoose';

const _ = require('lodash');
require('dotenv').config();
const Discord = require('discord.js');
const bot = new Discord.Client();
const TOKEN = process.env.TOKEN;
const characterDataService = new CharacterDataService();

export const commands = {};
let resolveReadyForCommands;
export const readyForCommands = new Promise((resolve, reject) => {
  resolveReadyForCommands = resolve;
});

console.log(JSON.stringify({
  TOKEN: process.env.TOKEN,
  MONGO_URL: process.env.MONGO_URL
}, null, '\t'));

bot.login(TOKEN);

/** Cleaning up discord bot and mongo connection */
export const destroy = async () => {
  await connection.close();
  await bot.destroy();
};

bot.on('ready', async () => {
  console.info(`Logged in as ${bot.user.tag}!`);

  const dbConnection = await setupConnection(process.env.MONGO_URL);
  resolveReadyForCommands();

  // Uncomment to test commands
  await commands['drop']({ reply: (m) => {console.log(m)}}, ['drop']);
});

/**
 * Displays all possible funtionality to help the user
 * @param msg Discord message object
 */
commands['help'] = (msg, args) => {
  msg.reply(`Command: Help
Command format is: @character-packs <command> <argument1> <argument2>
All <command> options: verbose-help, drop, setup, reroll, users, characters, goldens-add, goldens, preference, teams, health
`);
}

/**
 * Displays all possible funtionality to help the user
 * @param msg Discord message object
 */
commands['verbose-help'] = (msg, args) => {
  msg.reply(`Command: Verbose Help
Command format is: @character-packs <command> <arguments1> <argument2>
All <command> options: verbose-help, drop, setup, reroll, users, characters, goldens-add, goldens, preference, teams, health, verbose-help

@character-packs users
@character-packs characters
@setup <userTag> :Legendary: <character1> <character2> <character3> :Epic: <character1> <character2> <character3> <character4> <character5> :Ban: <character1> <character2> <character3> <character4> <character5>
- userTag is the person the preference is for
@character-packs drop <userTag1> <userTag2> <...>
- userTag is the people to roll for
@character-packs preference <userTag>
- userTag is the person display a preference for
@character-packs reroll <userTag>
- userTag is the person the drop is for
@character-packs goldens <userTag>
- userTag is the person the drop is for
@character-packs goldens-add <userTag>
- userTag is the person the drop is for
@character-packs teams <userTag1> <userTag2> <userTag3> <userTag4>
- userTag team members to shuffle
  `);
}

/**
 * Sample discord function
 * @param msg Discord message object
 */
commands['health'] = (msg, args) => {
  if (connections.length < 1) {
    msg.reply('this bot is not connected to the database');
  }

  msg.reply('this bot is up and running');
}

commands['users'] = async (msg, args) => {
  const userList = await getPlayerList();
  const userListString = _.reduce(userList, (resultSoFar, player) => {
    if (resultSoFar === '') {
      resultSoFar = player.player;
    } else {
      resultSoFar += `, ${player.player}`;
    }
    return resultSoFar;
  }, '');
  msg.reply(`Command: Get User Names
${userListString}
`);
}

commands['characters'] = (msg, args) => {
  const allCharacters = CharacterToEmoji.getAllPairs();
  const allCharactersString = _.reduce(allCharacters, (resultSoFar, character) => {
    if (resultSoFar === '') {
      resultSoFar = character.description;
    } else {
      resultSoFar += `, ${character.description}`;
    }
    return resultSoFar;
  }, '');
  msg.reply(`Command: Get Character Names
${allCharactersString}
`);
}

commands['preference'] = async (msg, args) => {
  const [command, nameTag] = args;
  if (isEmpty(nameTag)) {
    msg.reply(`Command: Get Character Preference
Invalid message format, missing nameTag argument. See @character-drop help for details.
    `);
    return;
  }

  const player = await getPlayer(nameTag);
  const characterPrefString = characterPrefToString(msg, player.characterPref);

  msg.reply(`Command: Get Character Preference
${nameTag} ${characterPrefString}
`);
}

commands['setup'] = async (msg, args) => {
  const [
    command,
    nameTag,
    legendaryIcon, legCharacter1, legCharacter2, legCharacter3,
    epicIcon, epicCharacter1, epicCharacter2, epicCharacter3, epicCharacter4, epicCharacter5,
    banIcon, banCharacter1, banCharacter2, banCharacter3, banCharacter4, banCharacter5
  ] = args;
  if (isEmpty(nameTag)) {
    msg.reply(`Command: Get Character Preference
Invalid message format, missing nameTag argument. See @character-drop help for details.
    `);
    return;
  }
  if (isEmpty(banCharacter5)) {
    msg.reply(`Command: Get Character Preference
Invalid message format, not enough arguments. See @character-drop help for details.
    `);
    return;
  }

  if (legendaryIcon !== getEmoji(msg, TierToEmoji.LEGENDARY.description).toString() ||
    epicIcon !== getEmoji(msg, TierToEmoji.EPIC.description).toString() ||
    banIcon !== getEmoji(msg, TierToEmoji.BAN.description).toString()) {
    msg.reply(`Command: Get Character Preference
Invalid message format, incorrect number of legendary/epic characters. See @character-drop help for details.
    `);
    return;
  }

  let player = await getPlayer(nameTag);
  if (!player) {
    player = {
      player: nameTag,
      discordUserId: nameTag,
      goldenCount: 0,
      earnedGoldenCount: 0,
      characterPref: [],
    };
  }

  player.characterPref = parseCharacterPref(msg,
    [legCharacter1, legCharacter2, legCharacter3],
    [epicCharacter1, epicCharacter2, epicCharacter3, epicCharacter4, epicCharacter5],
    [banCharacter1, banCharacter2, banCharacter3, banCharacter4, banCharacter5]
  );

  await savePlayer(player);

  msg.reply(`Command: Setup
${nameTag} preference updated
`);
}

commands['teams'] = async (msg, args) => {
  const allPlayers = args.slice(1);
  const shuffledPlayers = _.shuffle(allPlayers);

  let halfwayThrough = Math.floor(shuffledPlayers.length / 2.0);
  // or instead of floor you can use ceil depending on what side gets the extra data

  let leftTeam = shuffledPlayers.slice(0, halfwayThrough);
  let rightTeam = shuffledPlayers.slice(halfwayThrough, shuffledPlayers.length);

  msg.reply(`Left Team: ${_.join(leftTeam, ', ')}
Right Team: ${_.join(rightTeam, ', ')}`);
}

commands['drop'] = async (msg, args) => {
  let allPlayers = args.slice(1);
  if (allPlayers.length === 0) {
    const playerList = await getPlayerList();
    allPlayers = _.map(playerList, player => player.player);
  }
  const allMessages = await Promise.all(_.map(allPlayers, (player: string): Promise<string> => {
    return getDropMessage(msg, player);
  }));
  const fullMessage = _.reduce(allMessages, (resultSoFar, message) => {
    return `${resultSoFar}
${message}`;
  }, '');

  msg.reply(fullMessage);
}

commands['drop-get'] = async (msg, args) => {
  const [command, nameTag] = args;
  if (isEmpty(nameTag)) {
    msg.reply(`Command: Get Character Preference
Invalid message format, missing nameTag argument. See @character-drop help for details.
    `);
    return;
  }

  const message = await getDropMessage(msg, nameTag);
  msg.reply(message);
}

let dropCount = 0;
let cachedDropMap = {};
let cacheTimeouts = {};
const getDropMessage = async (msg, nameTag: string): Promise<string> => {
  const cachedDrop = getDropCache(nameTag);
  if (!_.isNil(cachedDrop)) {
    return cachedDrop;
  }

  const player = await getPlayer(nameTag);
  const pack = characterDataService.getRandomCharactersPack(player)
  const characterEmojis = _.map(pack, (character: Character|null) => {
    const emojiString = CharacterToEmoji.getEnumFromValue(character?.name)?.description;
    const tierString = TierToEmoji.getEnumFromValue(`${_.defaultTo(_.get(character, 'tier'), 'rare')}-${(character?.isGolden) ? 'golden' : ''}`)?.description;
    return `${getEmoji(msg, tierString)}${getEmoji(msg, emojiString)}`;
  });

  dropCount++;
  const message = `${characterEmojis[0]}  ${characterEmojis[1]}  ${characterEmojis[2]}  ${characterEmojis[3]}  ${characterEmojis[4]} -- Drop #${dropCount} ${nameTag} `;
  setDropCache(nameTag, message);
  return message;
}

const getDropCache = (nameTag) => {
  return cachedDropMap[nameTag];
}

const setDropCache = (nameTag, message) => {
  cachedDropMap[nameTag] = message;
  cacheTimeouts[nameTag] = setTimeout(() => {
    cachedDropMap[nameTag] = null;
  }, 5 * 1000 * 60);
}
const clearDropCache = (nameTag) => {
  clearTimeout(cacheTimeouts[nameTag]);
  cachedDropMap[nameTag] = null;
}

commands['reroll'] = async (msg, args) => {
  const [command, nameTag] = args;
  if (isEmpty(nameTag)) {
    msg.reply(`Command: Reroll Drop
Invalid message format, missing nameTag argument. See @character-drop help for details.
    `);
    return;
  }

  const player = await getPlayer(nameTag);
  const goldenCount = defaultTo(player.goldenCount, 0);

  if (goldenCount === 0) {
    msg.reply(`Command: Reroll Drop
No golden counts to spend for a reroll
    `);
    return;
  }

  player.goldenCount--;
  await savePlayer(player);
  clearDropCache(nameTag);

  const pack1 = characterDataService.getRandomCharactersPack(player)
  const pack2 = characterDataService.getRandomCharactersPack(player)
  const pack3 = characterDataService.getRandomCharactersPack(player)
  const haul = [...pack1, ...pack2, ...pack3];
  const sortedHaul: Character[] = _.sortBy(_.uniqBy(haul, 'id'), (character) => {
    if (character.tier === 'legendary' && character.isGolden) return 1;
    if (character.tier === 'legendary') return 2;
    if (character.tier === 'epic' && character.isGolden) return 3;
    if (character.tier === 'epic') return 4;
    if (character.tier === 'rare' && character.isGolden) return 5;
    return 6;
  });

  // Guarentee a legendary with golden roll
  const hasLegendaryCharacters = _.some(sortedHaul, (character) => character && (character.tier === 'legendary'));
  if (!hasLegendaryCharacters) {
    const legendaryCharacters = _.filter(player.characterPref, (character) => character.tier === 'legendary') || [];
    const shuffledLegendaryCharacters = _.shuffle(legendaryCharacters);
    sortedHaul[0] = shuffledLegendaryCharacters.pop();
  }

  // Keep top 5 results, then shuffle them
  const finalHaul: Character[] = _.shuffle(sortedHaul.slice(0, 5));

  const characterEmojis = _.map(finalHaul, (character: Character|null) => {
    const emojiString = CharacterToEmoji.getEnumFromValue(character?.name)?.description;
    const tierString = TierToEmoji.getEnumFromValue(`${_.get(character, 'tier', 'rare')}-${(character?.isGolden) ? 'golden' : ''}`)?.description;
    return `${getEmoji(msg, tierString)}${getEmoji(msg, emojiString)}`;
  });

  dropCount++;
  const message = `${characterEmojis[0]}  ${characterEmojis[1]}  ${characterEmojis[2]}  ${characterEmojis[3]}  ${characterEmojis[4]} -- Drop #${dropCount} ${nameTag} `;
  setDropCache(nameTag, message);

  msg.reply(message);
}

commands['goldens'] = async (msg, args) => {
  const [command, nameTag] = args;
  if (isEmpty(nameTag)) {
    msg.reply(`Command: Golden Count
Invalid message format, missing nameTag argument. See @character-drop help for details.
    `);
    return;
  }

  const player = await getPlayer(nameTag);
  const goldenCount = defaultTo(player.goldenCount, 0);

  msg.reply(`Command: Golden Count
Player: ${nameTag} Count: ${goldenCount}
  `);
}

commands['goldens-add'] = async (msg, args) => {
  const [command, nameTag] = args;
  if (isEmpty(nameTag)) {
    msg.reply(`Command: Increment Golden Count
Invalid message format, missing nameTag argument. See @character-drop help for details.
    `);
    return;
  }

  const player = await getPlayer(nameTag);
  player.goldenCount = defaultTo(player.goldenCount, 0) + 1;
  player.earnedGoldenCount = defaultTo(player.earnedGoldenCount, 0) + 1;
  await savePlayer(player);

  msg.reply(`Command: Increment Golden Count
Player: ${nameTag} Count: ${player.goldenCount}
  `);
}

bot.on('message', async msg => {
  const content: string = msg.content;
  const taggedUser = msg.mentions.users.first();

  // Only run logic if bot is mentioned
  if (bot.user.id === _.get(taggedUser, 'id', '')) {

    try {
      // Trigger the appropriate function from the given command
      const parsedCommandArray = content.split(`<@!${bot.user.id}>`);
      const parsedCommand = _.trim(_.get(parsedCommandArray, '[1]'));
      const args = _.map(parsedCommand.split(' '), (argument) => {
        return _.trim(argument)
      });
      const command = _.get(commands, args[0], commands['help']);

      await command(msg, args);
    } catch (e) {
      console.error(e);
      msg.reply('An error has occured, talk to Jeff.');
    }
  }
});
