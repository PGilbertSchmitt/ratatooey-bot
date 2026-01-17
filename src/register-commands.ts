import { Command, CommandOptionType, CommandType } from './types/command-types';
import { discordRequest } from './utils';
import { Endpoints, Names } from './consts';
import { SelectionType } from './db-client';

const NEW_ROTATION_COMMAND: Command = {
  name: Names.NEW_ROTATION,
  type: CommandType.CHAT_INPUT,
  description: 'Create a new secret-santa-style rotation',
  integration_types: [0],
  contexts: [0],
  options: [
    {
      name: 'rotation_type',
      type: CommandOptionType.STRING,
      description: 'What kind of rotation?',
      required: true,
      choices: [
        {
          name: 'Random',
          value: SelectionType.RANDOM,
        },
        {
          name: 'Manual',
          value: SelectionType.MANUAL,
        },
        {
          name: 'Magic',
          value: SelectionType.MAGIC,
        },
      ],
    },
  ],
};

const DELETE_ACTIVE_ROTATION_COMMAND: Command = {
  name: Names.DELETE_ACTIVE_ROTATION,
  type: CommandType.CHAT_INPUT,
  description: 'Delete the active rotation for this server',
  integration_types: [0],
  contexts: [0],
};

const SHOW_ACTIVE_ROTATION_COMMAND: Command = {
  name: Names.SHOW_ROTATION,
  type: CommandType.CHAT_INPUT,
  description:
    'Show the active rotation for this server (in case it gets deleted)',
  integration_types: [0],
  contexts: [0],
};

const REVEAL_ALL_SELECTIONS_COMMAND: Command = {
  name: Names.REVEAL_ALL,
  type: CommandType.CHAT_INPUT,
  description:
    'Privately reveal the list of sender/receivers pairs for the most recently started rotation',
  integration_types: [0],
  contexts: [0],
};

const registerCommands = async (commands: Array<Command>) => {
  try {
    const res = await discordRequest(Endpoints.COMMAND, {
      method: 'PUT',
      body: commands,
    });
    console.log('Commands registered');
  } catch (err) {
    console.error(`Failed to register commands:\n\n${err}`);
  }
};

registerCommands([
  NEW_ROTATION_COMMAND,
  DELETE_ACTIVE_ROTATION_COMMAND,
  SHOW_ACTIVE_ROTATION_COMMAND,
  REVEAL_ALL_SELECTIONS_COMMAND,
]);
