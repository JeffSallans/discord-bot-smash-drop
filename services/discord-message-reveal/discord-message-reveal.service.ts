import { forEach, map } from 'lodash'
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
  const sentMessage = await msg.reply(initialMessage);

  // Attach reactions and listeners
  attachReactions(sentMessage, messageConfig);

  // When reaction is pressed edit message
  // @see - https://stackoverflow.com/questions/50058056/how-to-use-awaitreactions-in-guildmemberadd
  forEach(messageConfig, (config: MessageReveal, index) => {
    if (config.reactionEmoji !== '') {
      // Set max timeout
      const timeout = setTimeout(() => {
        revealOnReaction(sentMessage, null, config);
      }, (30 + index) * 1000); // Reveal all after 30 seconds

      // Listen for user reaction
      sentMessage.awaitReactions((r: ReactionEvent, user: any) => reactionMatchesConfig(r, user, config),
      {max: 1, time: (30 + index) * 1000})
        .then((e: ReactionEvent) => {
          clearTimeout(timeout);
          revealOnReaction(sentMessage, e, config);
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
  forEach(messageConfig, (config) => {
    if (config.reactionEmoji !== '') {
      sentMessage.react(config.reactionEmoji);
    }
  });
}

/** Returns true if the event matches the config conditions */
const reactionMatchesConfig = (event: ReactionEvent, user: { id: string, bot: boolean}, config: MessageReveal):boolean => {
  return event.emoji.name === config.reactionEmoji &&
        user.id === config.userDiscordId;
}

/** Identifies the reaction and updates the current messag accoringly */
const revealOnReaction = (sentMessage: DiscordMessage, reactionEvent: ReactionEvent, config: MessageReveal) => {
  let currentMessage = sentMessage.content;
  currentMessage = currentMessage.replace(config.initialMessage, config.revealMessage);
  sentMessage.edit(currentMessage);
}

/** Returns true if all reveals have been made */
const areRevealsFinished = (sentMessage: DiscordMessage, messageConfig: MessageReveal[]):boolean => {
  const revealedMessage = getRevealMessageFromConfiguration(messageConfig);
  return (sentMessage.content === revealedMessage);
}
