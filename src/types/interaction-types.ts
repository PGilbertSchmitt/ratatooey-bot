import { InteractionType, MessageComponentTypes } from 'discord-interactions';
import { ValueOf } from '../utils';
import { CommandOptionType, CommandType, ContextType } from './command-types';

export interface BaseInteraction {
  id: string;
  application_id: string;
  guild_id?: string;
  context?: ValueOf<typeof ContextType>;
  // No need for non-member user since this bot only uses guild commands
  member: {
    user: {
      id: string;
    };
    permissions: string;
  };
  message: {
    id: string;
  };
  token: string;
}

interface PingInteraction {
  type: typeof InteractionType.PING;
}

export interface CommandInteraction extends BaseInteraction {
  type:
    | typeof InteractionType.APPLICATION_COMMAND
    | typeof InteractionType.APPLICATION_COMMAND_AUTOCOMPLETE;
  data: {
    id: string;
    name: string;
    type: ValueOf<typeof CommandType>;
    options: Array<{
      name: string;
      // This option object can change based on type, but I don't need that
      // granularity right now
      type: ValueOf<typeof CommandOptionType>;
      value: string;
    }>;
  };
}

export interface MessageComponentInteraction extends BaseInteraction {
  type: typeof InteractionType.MESSAGE_COMPONENT;
  data: {
    custom_id: string;
    component_type: MessageComponentTypes;
    values: Array<{
      custom_id: string;
      values?: string[];
    }>;
  };
}

export type InteractionBody =
  | PingInteraction
  | CommandInteraction
  | MessageComponentInteraction;
