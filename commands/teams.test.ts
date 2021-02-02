import * as seed from 'seed-random';
seed('123', { global: true });

let importedCommands, importedReadyForCommands, destroy;

describe('teams', () => {
  let mockMessageObject;

  beforeAll(() => {
    const { commands, readyForCommands, destroy } = require('..');
    importedCommands = commands;
    importedReadyForCommands = readyForCommands;
    mockMessageObject = {};
    mockMessageObject.reply = (message) => {
      expect(message).toMatchSnapshot();
    }
  });

  afterAll(async () => {
    await destroy();
  });

  it('works with no players', async () => {
    await importedReadyForCommands;
    await importedCommands['teams'](mockMessageObject, ['teams']);
  });

  it('works with 4 players', async () => {
    await importedReadyForCommands;
    await importedCommands['teams'](mockMessageObject, ['teams', 'math', 'mlripper', 'thynix', 'hasp']);
  });

  it('works with uneven players', async () => {
    await importedReadyForCommands;
    await importedCommands['teams'](mockMessageObject, ['teams', 'math', 'mlripper', 'thynix', 'hasp', 'qazwode']);
  });

  it('works with 6 players', async () => {
    await importedReadyForCommands;
    await importedCommands['teams'](mockMessageObject, ['teams', 'math', 'mlripper', 'thynix', 'hasp', 'qazwode', 'csg']);
  });
});
