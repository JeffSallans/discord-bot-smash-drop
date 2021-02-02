/** Different characters in Smash */
export interface Character {
    /* The unique identifier of the character */
    id: string;
    /* The display name of the character */
    name: string;
    /* Type of rarity */
    tier?: string;
    /* True if the character is golden */
    isGolden: boolean;
}