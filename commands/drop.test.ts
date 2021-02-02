import * as seed from 'seed-random';
seed('123', { global: true });

let importedCommands, importedReadyForCommands, destroy;

describe('drop', () => {
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

  it('works with no arguments', async () => {
    await importedReadyForCommands;
    await importedCommands['drop'](mockMessageObject, ['drop']);
  }, 10000);

  it('works with player args', async () => {
    await importedReadyForCommands;
    await importedCommands['drop'](mockMessageObject, ['drop', 'test']);
  }, 10000);
});
