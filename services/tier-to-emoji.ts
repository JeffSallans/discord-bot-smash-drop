import { Enum } from './enum';

export class TierToEmoji extends Enum {
    static RAREGOLDEN = new TierToEmoji('rare-golden', '🟡') // yellow_circle
    static RARE = new TierToEmoji('rare-', '🔵') // blue_circle
    static EPICGOLDEN = new TierToEmoji('epic-golden', '🟨') // yellow_square
    static EPIC = new TierToEmoji('epic-', '🟪') // purple_square
    static LEGENDARYGOLDEN = new TierToEmoji('legendary-golden', '✨') // sparkles
    static LEGENDARY = new TierToEmoji('legendary-', '🔶') // large_orange_diamond
    static BAN = new TierToEmoji('ban-', '❎') // negative_squared_cross_mark

    constructor(value, description) {
        super(value, description);
    }
}