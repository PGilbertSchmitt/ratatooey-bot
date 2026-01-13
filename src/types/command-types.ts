import { ValueOf } from '../utils';

export const ContextType = {
  GUILD: 0,
  BOT_DM: 1,
  PRIVATE_CHANNEL: 2,
} as const;

export const IntegrationType = {
  GUILD_INSTALL: 0,
  USER_INSTALL: 1,
} as const;

export const CommandType = {
  CHAT_INPUT: 1,
  USER: 2,
  MESSAGE: 3,
  PRIMARY_ENTRY_POINT: 4,
} as const;

export const CommandOptionType = {
  SUB_COMMAND: 1,
  SUB_COMMAND_GROUP: 2,
  STRING: 3,
  INTEGER: 4,
  BOOLEAN: 5,
  USER: 6,
  CHANNEL: 7,
  ROLE: 8,
  MENTIONABLE: 9,
  NUMBER: 10,
  ATTACHMENT: 11,
} as const;

export interface CommandOption {
  name: string;
  type: ValueOf<typeof CommandOptionType>;
  description: string;
  required?: boolean;
  choices?: Array<{
    name: string;
    value: string;
  }>;
}

export interface Command {
  name: string;
  description?: string;
  type: ValueOf<typeof CommandType>;
  options?: Array<CommandOption>;
  contexts: ValueOf<typeof ContextType>[];
  integration_types?: ValueOf<typeof IntegrationType>[];
}
