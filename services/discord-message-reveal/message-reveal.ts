/** The configuration data for a discord message reveal */
export interface MessageReveal {
  /** The message to show before reaction is clicked */
  initialMessage: string,
  /** The message to show after reaction is clicked */
  revealMessage: string,
  /** The reaction emoji to reveal the message */
  reactionEmoji: string,
  /** The user to wait for the reaction from */
  userDiscordId: string,
  /** True if the message has been revealed */
  isRevealed: boolean,
}
