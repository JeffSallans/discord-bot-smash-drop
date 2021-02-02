import { Enum } from './enum';

export class TierToEmoji extends Enum {
    static RAREGOLDEN = new TierToEmoji('rare-golden', 'GoldenRare')
    static RARE = new TierToEmoji('rare-', 'Rare')
    static EPICGOLDEN = new TierToEmoji('epic-golden', 'GoldenEpic')
    static EPIC = new TierToEmoji('epic-', 'Epic')
    static LEGENDARYGOLDEN = new TierToEmoji('legendary-golden', 'GoldenLegendary')
    static LEGENDARY = new TierToEmoji('legendary-', 'Legendary')
    static BAN = new TierToEmoji('ban-', 'Ban')

    constructor(value, description) {
        super(value, description);
    }
}