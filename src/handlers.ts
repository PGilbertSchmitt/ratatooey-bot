import {
  ButtonStyleTypes,
  MessageComponentTypes,
} from "discord-interactions";
import {
  InteractionResponse,
  wrapChannelMessage,
} from "./types/interaction-response-types";
import { BaseInteraction, CommandInteraction, MessageComponentInteraction } from "./types/interaction-types";
import { Endpoints, Names } from "./consts";
import { discordRequest, hasAdminPermissions } from "./utils";
import { db, SelectionType } from './db-client';

const textMessage = (content: string) => wrapChannelMessage(
  [
    {
      type: MessageComponentTypes.TEXT_DISPLAY,
      content,
    },
  ],
  true
);

export const handleNewRotation = async (
  body: CommandInteraction,
): Promise<InteractionResponse> => {
  const userId = body.member.user.id;
  const interactionId = body.id;
  
  const guildId = body.guild_id;
  if (!guildId) {
    return textMessage('No guild ID found for this server');
  }
  
  const selectionType = body.data.options[0].value as SelectionType;
  if (!["auto", "manual", "magic"].includes(selectionType)) {
    return textMessage(`Rotation type can only be 'auto', 'manual', or 'magic'. Instead, got '${selectionType}'`);
  }

  if (await db.getStartedRotation(guildId)) {
    return textMessage(`This server already has an active (unstarted) rotation`);
  }

  await db.createRotation(interactionId, selectionType, userId, guildId);

  return wrapChannelMessage([
    {
      type: MessageComponentTypes.TEXT_DISPLAY,
      content: `<@${userId}> has started ${selectionType === 'auto' ? 'an' : 'a'} ${selectionType} rotation`,
    },
    {
      type: MessageComponentTypes.ACTION_ROW,
      components: [
        {
          type: MessageComponentTypes.BUTTON,
          custom_id: `${Names.ACTION_JOIN_ROTATION}:${interactionId}`,
          label: "Join",
          style: ButtonStyleTypes.PRIMARY,
        },
        {
          type: MessageComponentTypes.BUTTON,
          custom_id: `${Names.ACTION_START_ROTATION}:${interactionId}`,
          label: "Start",
          style: ButtonStyleTypes.SECONDARY,
        },
        {
          type: MessageComponentTypes.BUTTON,
          custom_id: `${Names.DELETE_ACTIVE_ROTATION}:${interactionId}`,
          label: "Delete",
          style: ButtonStyleTypes.DANGER,
        },
      ],
    },
  ]);
};

export const handleMessageId = async (
  body: BaseInteraction,
) => {
  const followUpResponse = await discordRequest(Endpoints.FOLLOW_UP(body.token), {
    method: 'GET',
  });
  const followUp = await followUpResponse.json();
  await db.saveMessageId(body.id, followUp.id);
};

type DeleteAction = {
  response: InteractionResponse;
  messageId?: string | null;
  deleteIfCan?: boolean;
}

// Can be done either by /delete_rotation command or by the `delete_rotation:...` interaction
export const handleDeleteRotation = async (
  body: BaseInteraction,
): Promise<DeleteAction> => {
  const guildId = body.guild_id;
  if (!guildId) {
    return {
      response: textMessage('No guild ID found for this server'),
      deleteIfCan: true,
    };
  }
  const userId = body.member.user.id;
  const selectedRotation = await db.getStartedRotation(guildId);
  if (!selectedRotation) {
    return {
      response: textMessage('No pending rotations in this server'),
      deleteIfCan: true,
    };
  }
  const messageId = selectedRotation.messageId;
  if (userId === selectedRotation.initiatorId || hasAdminPermissions(body.member.permissions)) {
    // rotations = rotations.filter(r => r.id !== selectedRotation.id);
    await db.deleteRotation(selectedRotation.id);
    return {
      response: textMessage("Pending rotation deleted. I hope you're pleased with yourself"),
      messageId,
      deleteIfCan: true,
    };
  } else {
    return {
      response: textMessage('Pending rotation can only be deleted by its creator, the admin, or the Almighty Lord Our God'),
    };
  }
};

export const handleJoinRotation = async (
  body: MessageComponentInteraction,
): Promise<InteractionResponse> => {
  return wrapChannelMessage([
    {
      type: MessageComponentTypes.TEXT_DISPLAY,
      content: `You already joined. Do not test my patience. >:(`
    }
  ], true);
};

export const handleStartRotation = async (
  body: MessageComponentInteraction,
): Promise<InteractionResponse> => {
  return wrapChannelMessage([
    {
      type: MessageComponentTypes.TEXT_DISPLAY,
      content: 'Only the person who created this poll can start this rotation.',
    },
    {
      type: MessageComponentTypes.TEXT_DISPLAY,
      content: "This is a blatant violation of server rules. This incident has been reported.",
    },
  ], true);
};
