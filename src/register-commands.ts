import { Command, CommandOptionType, CommandType } from "./types/command-types";
import { discordRequest } from "./utils";
import { Endpoints, Names } from "./consts";

const NEW_ROTATION_COMMAND: Command = {
  name: Names.NEW_ROTATION,
  type: CommandType.CHAT_INPUT,
  description: "Create a new secret-santa-style rotation",
  integration_types: [0],
  contexts: [0],
  options: [
    {
      name: "rotation_type",
      type: CommandOptionType.STRING,
      description: "What kind of rotation?",
      required: true,
      choices: [
        {
          name: "Automatic",
          value: "auto",
        },
        {
          name: "Manual",
          value: "manual",
        },
        {
          name: "Automagic",
          value: "magic",
        },
      ],
    },
  ],
};

const DELETE_ACTIVE_ROTATION_COMMAND: Command = {
  name: Names.DELETE_ACTIVE_ROTATION,
  type: CommandType.CHAT_INPUT,
  description: "Delete the active rotation for this server",
  integration_types: [0],
  contexts: [0],
};

const registerCommands = async (commands: Array<Command>) => {
  try {
    const res = await discordRequest(Endpoints.COMMAND, {
      method: "PUT",
      body: commands,
    });
    console.log(res);
  } catch (err) {
    console.error(`Failed to register commands:\n\n${err}`);
  }
};

registerCommands([NEW_ROTATION_COMMAND, DELETE_ACTIVE_ROTATION_COMMAND]);
