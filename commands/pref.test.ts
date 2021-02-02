import * as seed from 'seed-random';
seed('123', { global: true });

let importedCommands, importedReadyForCommands, destroy;

describe('preference', () => {
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

  it('setup works correctly', async () => {
    await importedReadyForCommands;
    await importedCommands['setup'](mockMessageObject, ['setup', 'test',
      ':Legendary:', ':Swiggins:', ':Sentry:', ':Yoolip:',
      ':Epic:', ':Coco:', ':Jimmy:', ':Lonestar:', ':MaxFocus:', ':Skolldir:',
      ':Ban:', ':ChuchoKrokk:', ':Derpl:', ':Dizzy:', ':Rocco:', ':Yuri:']);
  });

  it('preference works correctly', async () => {
    await importedReadyForCommands;
    await importedCommands['preference'](mockMessageObject, ['preference', 'test']);
  });

});
