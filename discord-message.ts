/** Shape of the discord message received */
export interface DiscordMessage {
  reply: (message: string) => Promise<any>,
  author: {
    id: string,
    username: string,
  },
  /** Message */
  content: string,
  /** Users mentioned in message */
  mentions: {
    users: {
      id: string,
      username: string,
      first: () => any,
      toJson: () => any,
    },
  },
  /** Allows the bot to update its message */
  edit: (updatedMessage:string) => Promise<any>,
  /** Add reaction to messages */
  react: (reactionEmoji:string) => Promise<any>,
  /** Listens for reaction events */
  awaitReactions: any,
}
