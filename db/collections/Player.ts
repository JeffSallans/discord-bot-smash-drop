import { Schema, model, Model, Document } from 'mongoose';
import { Character } from '../../services/character';

/** A user of the character-drops app, and their corresponding data */
export interface IPlayer {
    /** The name of the given player */
    player: string,
    /** Discord user id */
    discordUserId: string,
    /** How many goldens the player has */
    goldenCount: number,
    /** How many goldens the player has earned total */
    earnedGoldenCount: number,
    /** The character preferences of the player */
    characterPref: Character[],
};

const playerSchema = new Schema({
  player: String,
  discordUserId: String,
  goldenCount: Number,
  earnedGoldenCount: Number,
  characterPref: [{
    id: String,
    name: String,
    tier: String,
  }],
});

/** The mongoose Model for interacting with the db */
export const Player: Model<Document<IPlayer>> = model('players', playerSchema);
