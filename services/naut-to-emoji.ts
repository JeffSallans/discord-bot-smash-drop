import { Enum } from './enum';

export class NautToEmoji extends Enum {
    static ADMIRAL = new NautToEmoji('admiral', 'Swiggins')
    static AYLA = new NautToEmoji('ayla', 'Ayla')
    static CHUCHO = new NautToEmoji('chucho', 'ChuchoKrokk')
    static CLUNK = new NautToEmoji('clunk', 'Clunk')
    static COCO = new NautToEmoji('coco', 'Coco')
    static COMMANDER = new NautToEmoji('commander', 'Rocket')
    static DEADLIFT = new NautToEmoji('deadlift', 'SamuelDeadlift')
    static DERPL = new NautToEmoji('derpl', 'Derpl')
    static DIZZY = new NautToEmoji('dizzy', 'Dizzy')
    static FROGGY = new NautToEmoji('froggy', 'Froggy')
    static GENJI = new NautToEmoji('genji', 'Genji')
    static GNAW = new NautToEmoji('gnaw', 'Gnaw')
    static IX = new NautToEmoji('ix', 'Ix')
    static JIMMY = new NautToEmoji('jimmy', 'Jimmy')
    static KSENIA = new NautToEmoji('ksenia', 'Ksenia')
    static LEON = new NautToEmoji('leon', 'Leon')
    static LONESTAR = new NautToEmoji('lonestar', 'Lonestar')
    static MAX = new NautToEmoji('max', 'MaxFocus')
    static NIBBS = new NautToEmoji('nibbs', 'Nibbs')
    static PENNY = new NautToEmoji('penny', 'Penny')
    static QITARA = new NautToEmoji('qitara', 'Qitara')
    static RAELYNN = new NautToEmoji('raelynn', 'Raelynn')
    static ROCCO = new NautToEmoji('rocco', 'Rocco')
    static SCOOP = new NautToEmoji('scoop', 'Scoop')
    static SENTRY = new NautToEmoji('sentry', 'Sentry')
    static SKREE = new NautToEmoji('skree', 'Skree')
    static SKROLLDER = new NautToEmoji('skrollder', 'Skolldir')
    static SMILES = new NautToEmoji('smiles', 'Smiles')
    static SNORK = new NautToEmoji('snork', 'SnorkGunk')
    static TED = new NautToEmoji('ted', 'Ted')
    static VINNIE = new NautToEmoji('vinnie', 'VinnieandSpike')
    static VOLTAR = new NautToEmoji('voltar', 'Voltar')
    static YOOLIP = new NautToEmoji('yoolip', 'Yoolip')
    static YURI = new NautToEmoji('yuri', 'Yuri')

    constructor(value, description) {
        super(value, description);
    }
}