import {
  ButtonStyleTypes,
  MessageComponentTypes,
} from "discord-interactions";
import {
  InteractionResponse,
  wrapChannelMessage,
} from "./types/interaction-response-types";
import { BaseInteraction, CommandInteraction, MessageComponentInteraction } from "./types/interaction-types";
import { Names } from "./consts";
import { hasAdminPermissions } from "./utils";

// TODO: Replace these with a SQLite DB connection

type RotationType =  "auto" | "manual" | "magic";

let rotations: Array<{
  interactionId: string; // primary id
  guildId: string;
  initiatorId: string;
  memberIds: string[];
  selections: Array<{
    sender: string;
    receiver: string;
  }>;
  filling: boolean;
  type: RotationType;
}> = [];

const selectStartedRotations = (guildId: string) => {
  return rotations.find(r => r.guildId === guildId && r.filling);
}

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
  body: CommandInteraction
): Promise<InteractionResponse> => {
  const userId = body.member.user.id;
  const interactionId = body.id;

  const guildId = body.guild_id;
  if (!guildId) {
    return textMessage('No guild ID found for this server');
  }

  const rotationType = body.data.options[0].value as RotationType;
  if (!["auto", "manual", "magic"].includes(rotationType)) {
    return textMessage(`Rotation type can only be 'auto', 'manual', or 'magic'. Instead, got '${rotationType}'`);
  }

  if (selectStartedRotations(guildId)) {
    return textMessage(`This server already has an active (unstarted) rotation`);
  }

  rotations.push({
    filling: true,
    initiatorId: userId,
    type: rotationType,
    memberIds: [],
    selections: [],
    guildId,
    interactionId,
  });

  return wrapChannelMessage([
    {
      type: MessageComponentTypes.TEXT_DISPLAY,
      content: `<@${userId}> has started ${rotationType === 'auto' ? 'an' : 'a'} ${rotationType} rotation`,
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

// Can be done either by /delete_rotation command or by the `delete_rotation:...` interaction
export const handleDeleteRotation = async (
  body: BaseInteraction,
) => {
  const guildId = body.guild_id;
  if (!guildId) {
    return textMessage('No guild ID found for this server');
  } else {
    console.log(`guildId: ${guildId}`);
  }
  const userId = body.member.user.id;
  const selectedRotation = selectStartedRotations(guildId);
  if (!selectedRotation) {
    return textMessage('No pending rotations in this server');
  }
  if (userId === selectedRotation.initiatorId || hasAdminPermissions(body.member.permissions)) {
    rotations = rotations.filter(r => r.interactionId !== selectedRotation.interactionId);
    return textMessage("Pending rotation deleted. I hope you're pleased with yourself");
  } else {
    return textMessage('Pending rotation can only be deleted by its creator, the admin, or the Almighty Lord Our God');
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
