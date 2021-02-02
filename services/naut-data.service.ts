import { get, filter, shuffle, random, map, flatten, union, includes, some, isNil } from 'lodash';
import { Naut } from './naut';
import * as nautJsonData from './naut-data.json';
import * as haspData from './hasp.json';
import * as mathmaticalData from './mathmatical.json';
import * as mlripperData from './mlripper.json';
import * as thynixData from './thynix.json';
import * as qazwodeData from './qazwode.json';
import * as cgsData from './cgs.json';
import { getPlayer } from './player-data/player-data.service';
import { IPlayer } from '../db/collections/Player';

export class NautDataService {

  allNauts: Naut[];

  constructor() {
    this.allNauts = nautJsonData as Naut[];
    console.debug('nauts: ', this.allNauts);
  }

  getNautsForPlayer(player: IPlayer): Naut[] {
    let playerNauts = player.nautPref;

    // Remove any golden flags
    playerNauts.forEach((naut) => {
      naut.isGolden = false;
    });
    return playerNauts;
  }

  getRandomNautsPack(player: IPlayer) {
    const nauts = this.getNautsForPlayer(player);

    const legendaryNauts = filter(nauts, (naut) => naut.tier === 'legendary') || [];
    const epicNauts = filter(nauts, (naut) => naut.tier === 'epic') || [];
    const rareNauts = filter(nauts, (naut) => naut.tier !== 'legendary' && naut.tier !== 'epic' && naut.tier !== 'common') || [];

    const shuffledLegendaryNauts = shuffle(legendaryNauts);
    const shuffledEpicNauts = shuffle(epicNauts);
    const shuffledRareNauts = shuffle(rareNauts);

    const nautPoolRolls = [
      random(20),
      random(20),
      random(20),
      random(20),
      random(20),
    ];

    const nautPool = map(nautPoolRolls, (roll) => {
      if (roll === 19) {
        return shuffledLegendaryNauts.pop();
      } else if (includes([15, 16, 17, 18], roll)) {
        return shuffledEpicNauts.pop();
      } else {
        return shuffledRareNauts.pop();
      }
    });

    const hasLegendaryOrEpicNauts = some(nautPool, (naut) => naut && (naut.tier === 'legendary' || naut.tier === 'epic'));

    if (!hasLegendaryOrEpicNauts) {
      nautPool[0] = shuffledEpicNauts.pop();
    }

    // Add golden plating
    const goldPlatingIndex = random(15);
    if (!isNil(nautPool[goldPlatingIndex]) && nautPool[goldPlatingIndex].tier !== 'legendary') {
      nautPool[goldPlatingIndex].isGolden = true;
    }

    return shuffle(nautPool);
  }
}
