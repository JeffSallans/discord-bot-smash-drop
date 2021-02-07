import { defaultTo, isEmpty, trim } from 'lodash';
import { Character } from './services/character';
import { CharacterDataService } from './services/character-data.service';
import { CharacterToEmoji } from './services/character-to-emoji';
import { TierToEmoji } from './services/tier-to-emoji';
import { setupConnection } from './db/mongodbConnection';
import { getEmoji, getPlayer, getPlayerList, characterPrefToString, parseCharacterPref, savePlayer, getPlayerByDiscordId } from './services/player-data/player-data.service';
import { connection, connections, Mongoose } from 'mongoose';
import { IPlayer } from './db/collections/Player';

const _ = require('lodash');
require('dotenv').config();
const Discord = require('discord.js');
const bot = new Discord.Client();
const TOKEN = process.env.TOKEN;
const characterDataService = new CharacterDataService();

/** Shape of the discord message received */
interface DiscordMessage {
  reply: (message: string) => void,
  author: {
    id: string,
    username: string,
  },
  /** Message */
  content: string,
  /** Users mentioned in message */
  mentions: any,
}

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
  await commands['drop']({ reply: (m) => {console.log(m)}, author: { username: 'Jeffufu', id: '158399207441432576'}}, ['drop']);
});

/**
 * Displays all possible funtionality to help the user
 * @param msg Discord message object
 */
commands['help'] = (msg: DiscordMessage, args) => {
  msg.reply(`Command: Help
Command format is: @character-packs <command> <argument1> <argument2>
All <command> options: drop, setup, reroll, characters, add-goldens, get-goldens, preference
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
  const player = await getPlayerByDiscordId(msg.author.id);
  if (player == null) {
    msg.reply(`Command: Get Character Preference
Player not setup, use @smash-drop setup command.
    `);
    return;
  }

  const characterPrefString = characterPrefToString(msg, player.characterPref);

  msg.reply(`Command: Get Character Preference
${msg.author.username} ${characterPrefString}
`);
}

commands['setup'] = async (msg, args) => {
  const [
    command,
    legendaryIcon, legCharacter1, legCharacter2, legCharacter3,
    epicIcon, epicCharacter1, epicCharacter2, epicCharacter3, epicCharacter4, epicCharacter5,
    banIcon, banCharacter1, banCharacter2, banCharacter3, banCharacter4, banCharacter5
  ] = args;

  if (isEmpty(banCharacter5)) {
    msg.reply(`Command: Get Character Preference
Invalid message format, not enough arguments. Example
:large_orange_diamond: mario luigi peach :purple_square: link zelda sheik younglink toonlink :negative_squared_cross_mark: bowser boswerjr wario piranhaplant donkeykong
    `);
    return;
  }

  if (legendaryIcon !== getEmoji(msg, TierToEmoji.LEGENDARY.description).toString() ||
    epicIcon !== getEmoji(msg, TierToEmoji.EPIC.description).toString() ||
    banIcon !== getEmoji(msg, TierToEmoji.BAN.description).toString()) {
    msg.reply(`Command: Get Character Preference
Invalid message format, incorrect number of legendary or epic characters. Example
:large_orange_diamond: mario luigi peach :purple_square: link zelda sheik younglink toonlink :negative_squared_cross_mark: bowser boswerjr wario piranhaplant donkeykong
    `);
    return;
  }

  let player = await getPlayerByDiscordId(msg.author.id);
  if (!player) {
    player = {
      player: msg.author.username,
      discordUserId: msg.author.id,
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
${msg.author.username} preference updated
`);
}

commands['drop'] = async (msg: DiscordMessage, args) => {
  let allPlayers = msg.mentions.slice(1);
  if (allPlayers.length === 0) {
    const player = await getPlayerByDiscordId(msg.author.id);
    allPlayers.push(player);
  }

  const allMessages = await Promise.all(_.map(allPlayers, (player: {id: string, username: string}): Promise<string> => {
    return getDropMessage(msg, player);
  }));
  const fullMessage = _.reduce(allMessages, (resultSoFar, message) => {
    return `${resultSoFar}
${message}`;
  }, '');

  msg.reply(fullMessage);
}

let dropCount = 0;
let cachedDropMap = {};
let cacheTimeouts = {};
const getDropMessage = async (msg: DiscordMessage, givenPlayer: { id: string, username: string}): Promise<string> => {
  const cachedDrop = getDropCache(msg.author.id);
  if (!_.isNil(cachedDrop)) {
    return cachedDrop;
  }

  const player = await getPlayerByDiscordId(givenPlayer.id);
  const pack = characterDataService.getRandomCharactersPack(player)
  const characterEmojis = _.map(pack, (character: Character|null) => {
    const emojiString = CharacterToEmoji.getEnumFromValue(character?.name)?.description;
    const tierString = TierToEmoji.getEnumFromValue(`${_.defaultTo(_.get(character, 'tier'), 'rare')}-${(character?.isGolden) ? 'golden' : ''}`)?.description;
    return `${getEmoji(msg, tierString)}${getEmoji(msg, emojiString)}`;
  });

  dropCount++;
  const message = `${characterEmojis[0]}  ${characterEmojis[1]}  ${characterEmojis[2]}  ${characterEmojis[3]}  ${characterEmojis[4]} -- Drop #${dropCount} ${player.player} `;
  setDropCache(msg.author.id, message);
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

commands['reroll'] = async (msg: DiscordMessage, args) => {
  const player = await getPlayerByDiscordId(msg.author.id);
  if (player == null) {
    msg.reply(`Command: Get Character Preference
Player not setup, use @smash-drop setup command.
    `);
    return;
  }

  const goldenCount = defaultTo(player.goldenCount, 0);

  if (goldenCount === 0) {
    msg.reply(`Command: Reroll Drop
No golden counts to spend for a reroll
    `);
    return;
  }

  player.goldenCount--;
  await savePlayer(player);
  clearDropCache(msg.author.id);

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
  const message = `${characterEmojis[0]}  ${characterEmojis[1]}  ${characterEmojis[2]}  ${characterEmojis[3]}  ${characterEmojis[4]} -- Drop #${dropCount} ${player.player} `;
  setDropCache(msg.author.id, message);

  msg.reply(message);
}

commands['get-goldens'] = async (msg, args) => {
  const player = await getPlayerByDiscordId(msg.author.id);
  if (player == null) {
    msg.reply(`Command: Get Character Preference
Player not setup, use @smash-drop setup command.
    `);
    return;
  }

  const goldenCount = defaultTo(player.goldenCount, 0);

  msg.reply(`Command: Golden Count
Player: ${msg.author.username} Count: ${goldenCount}
  `);
}

commands['add-goldens'] = async (msg: DiscordMessage, args) => {
  const player = await getPlayerByDiscordId(msg.author.id);
  if (player == null) {
    msg.reply(`Command: Get Character Preference
Player not setup, use @smash-drop setup command.
    `);
    return;
  }

  player.goldenCount = defaultTo(player.goldenCount, 0) + 1;
  player.earnedGoldenCount = defaultTo(player.earnedGoldenCount, 0) + 1;
  await savePlayer(player);

  msg.reply(`Command: Increment Golden Count
Player: ${msg.author.username} Count: ${player.goldenCount}
  `);
}

bot.on('message', async (msg: DiscordMessage) => {
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
