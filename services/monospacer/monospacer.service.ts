import { Emoji } from 'discord.js';
import _ = require('lodash');

/**
 * Return the discord message in the monospace format
 * @param message - message to monospace
 * @param fixedSpacing - length to monospace to
 */
export const getDiscordMonospace = (message: string | Emoji, fixedSpacing: number): string => {
  // Do not monospace emoji because this is handled differently
  if (typeof(message) === 'object') {
    return message.toString();
  }
  return `\`${_.padEnd(message, fixedSpacing, ' ')}\``;
};
