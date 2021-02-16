import { defaultTo, forEach, map } from 'lodash'
import { DiscordMessage } from '../../discord-message'
import { MessageReveal } from './message-reveal'

interface ReactionEvent {
  emoji: {
    name: string,
  },
  users: {
    first: () => any,
    last: () => any,
  }
}

/**
 * Reveals the message in chunks when the user interacts with it
 */
export const setupDiscordMessageReveal = async (msg: DiscordMessage, messageConfig: MessageReveal[]) => {
  // Send initial message
  const initialMessage = getInitialMessageFromConfiguration(messageConfig);
  let sentMessage = await msg.reply(initialMessage);

  // Attach reactions and listeners
  attachReactions(sentMessage, messageConfig);

  // When reaction is pressed edit message
  // @see - https://stackoverflow.com/questions/50058056/how-to-use-awaitreactions-in-guildmemberadd
  forEach(messageConfig, (config: MessageReveal, index) => {
    if (config.reactionEmoji !== '') {
      // Set max timeout
      const timeout = setTimeout(() => {
        revealOnReaction(sentMessage, null, config, messageConfig);
      }, (15 + index*2) * 1000); // Reveal all after 20 seconds

      // Listen for user reaction
      sentMessage?.awaitReactions((r: ReactionEvent, user: any) => reactionMatchesConfig(r, user, config),
      {max: 1, time: 20 * 1000}) // Remove reaction listeners after 30 seconds
        .then((e: ReactionEvent) => {
          clearTimeout(timeout);
          revealOnReaction(sentMessage, e, config, messageConfig);
        });

    }
  });
}

/** Returns the initial message for the given configuration */
export const getInitialMessageFromConfiguration = (messageConfig: MessageReveal[]): string => {
  return map(messageConfig, (config) => config.initialMessage).join('');
}

/** Returns the fully revealed message for the given configuration */
export const getRevealMessageFromConfiguration = (messageConfig: MessageReveal[]): string => {
  return map(messageConfig, (config) => config.revealMessage).join('');
}

const attachReactions = (sentMessage: DiscordMessage, messageConfig: MessageReveal[]) => {
  forEach(messageConfig, async (config) => {
    if (config.reactionEmoji !== '') {
      await sentMessage?.react(config.reactionEmoji);
    }
  });
}

/** Returns true if the event matches the config conditions */
const reactionMatchesConfig = (event: ReactionEvent, user: { id: string, bot: boolean}, config: MessageReveal):boolean => {
  return event.emoji.name === config.reactionEmoji &&
        user.id === config.userDiscordId;
}

/**
 * Identifies the reaction and updates the current message accoringly
 * @modifies reactionEvent
 */
const revealOnReaction = (sentMessage: DiscordMessage, reactionEvent: ReactionEvent, config: MessageReveal, allConfigs: MessageReveal[]) => {
  config.isRevealed = true;
  const message = getMessageFromAllConfigs(allConfigs)
  return sentMessage?.edit(message);
}

/** Returns the message from all the given configs */
const getMessageFromAllConfigs = (allConfigs: MessageReveal[]) => {
  const messageParts = map(allConfigs, (config) => {
    if (config.isRevealed) return config.revealMessage;
    return config.initialMessage;
  });
  return messageParts.join('');
}

