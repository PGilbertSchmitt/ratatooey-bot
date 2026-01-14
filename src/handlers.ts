import {
  ButtonStyleTypes,
  MessageComponent,
  MessageComponentTypes,
} from 'discord-interactions';
import {
  InteractionResponse,
  wrapChannelMessage,
  wrapChannelMessageUpdate,
} from './types/interaction-response-types';
import {
  BaseInteraction,
  CommandInteraction,
  MessageComponentInteraction,
} from './types/interaction-types';
import { Endpoints, Names } from './consts';
import { discordRequest, hasAdminPermissions } from './utils';
import { db, SelectionType } from './db-client';
import { autoSelection } from './selection';

const textMessage = (content: string) =>
  wrapChannelMessage(
    [
      {
        type: MessageComponentTypes.TEXT_DISPLAY,
        content,
      },
    ],
    true,
  );

export class StructuredErrorResponse extends Error {
  public discordMessageId?: string;

  constructor(message: string, discordMessageId?: string) {
    super(message);
    this.discordMessageId = discordMessageId;
  }

  public toDiscordMessage(): InteractionResponse {
    return textMessage(this.message);
  }
}

const getGuildId = (body: BaseInteraction): string => {
  const guildId = body.guild_id;
  if (!guildId) {
    throw new StructuredErrorResponse('No guild ID found for this server');
  }
  return guildId;
};

const getMembershipString = (memberIds?: string[]): string | null => {
  if (!memberIds || memberIds.length === 0) {
    return null;
  }
  const memberStrings = memberIds.map((id) => `<@${id}>`);
  switch (memberStrings.length) {
    case 1: {
      return memberStrings[0];
    }
    case 2: {
      return memberStrings.join(' and ');
    }
    default: {
      const allButLast = memberStrings.slice(0, memberStrings.length - 1);
      return [
        ...allButLast,
        `and ${memberStrings[memberStrings.length - 1]}`,
      ].join(', ');
    }
  }
};

const rotationMessage = (
  initiatorId: string,
  selectionType: SelectionType,
  rotationId: string,
  members?: string[],
): MessageComponent[] => {
  const topText: MessageComponent = {
    type: MessageComponentTypes.TEXT_DISPLAY,
    content: `<@${initiatorId}> has started ${selectionType === 'auto' ? 'an' : 'a'} ${selectionType} rotation`,
  };

  const startEnabled = !!members && members.length > 2;
  const actionButtons: MessageComponent = {
    type: MessageComponentTypes.ACTION_ROW,
    components: [
      {
        type: MessageComponentTypes.BUTTON,
        custom_id: `${Names.ACTION_JOIN_ROTATION}:${rotationId}`,
        label: 'Join',
        style: ButtonStyleTypes.PRIMARY,
      },
      {
        type: MessageComponentTypes.BUTTON,
        custom_id: `${Names.ACTION_START_ROTATION}:${rotationId}`,
        label: 'Start',
        style: ButtonStyleTypes.SECONDARY,
        disabled: !startEnabled,
      },
      {
        type: MessageComponentTypes.BUTTON,
        custom_id: `${Names.DELETE_ACTIVE_ROTATION}:${rotationId}`,
        label: 'Delete',
        style: ButtonStyleTypes.DANGER,
      },
    ],
  };

  let components: MessageComponent[] = [topText];
  const membershipString = getMembershipString(members);
  if (membershipString !== null) {
    components.push({
      type: MessageComponentTypes.TEXT_DISPLAY,
      content: `Currently includes: ${membershipString}`,
    });
  }

  components.push(actionButtons);

  if (!startEnabled) {
    components.push({
      type: MessageComponentTypes.TEXT_DISPLAY,
      content: '_Cannot start until at least 3 members have joined._',
    });
  }

  return components;
};

const rotationDoneMessage = (
  initiatorId: string,
  selectionType: SelectionType,
  rotationId: string,
  members: string[],
): MessageComponent[] => [
  {
    type: MessageComponentTypes.TEXT_DISPLAY,
    content: `<@${initiatorId}> has started ${selectionType === 'auto' ? 'an' : 'a'} ${selectionType} rotation`,
  },
  {
    type: MessageComponentTypes.TEXT_DISPLAY,
    content: `Members in rotation: ${getMembershipString(members)}`,
  },
  {
    type: MessageComponentTypes.ACTION_ROW,
    components: [
      {
        type: MessageComponentTypes.BUTTON,
        custom_id: `${Names.ACTION_REVEAL_RECEIVER}:${rotationId}`,
        label: 'Reveal',
        style: ButtonStyleTypes.PRIMARY,
      },
    ],
  },
];

export const handleNewRotation = async (
  body: CommandInteraction,
): Promise<InteractionResponse> => {
  const userId = body.member.user.id;
  const interactionId = body.id;
  const guildId = getGuildId(body);

  const selectionType = body.data.options[0].value as SelectionType;
  
  if (!['auto', 'manual', 'magic'].includes(selectionType)) {
    throw new StructuredErrorResponse(
      `Rotation type can only be 'auto', 'manual', or 'magic'. Instead, got '${selectionType}'`,
    );
  }

  // Temp while they're implemented
  if (selectionType !== 'auto') {
    throw new StructuredErrorResponse(
      `Currenly, only Automatic rotation is supported (check back soon!)`,
    );
  }

  if (await db.getStartedRotation(guildId)) {
    throw new StructuredErrorResponse(
      `This server already has an active (unstarted) rotation`,
    );
  }

  await db.createRotation(interactionId, selectionType, userId, guildId);

  return wrapChannelMessage(
    rotationMessage(userId, selectionType, interactionId),
  );
};

export const handleMessageId = async (token: string, rotationId: string) => {
  const followUpResponse = await discordRequest(Endpoints.FOLLOW_UP(token), {
    method: 'GET',
  });
  const followUp = await followUpResponse.json();
  await db.saveMessageId(rotationId, followUp.id);
};

type ShowAction = {
  response: InteractionResponse;
  oldMessageId: string;
  rotationId: string;
};

export const handleShowRotation = async (
  body: BaseInteraction,
): Promise<ShowAction> => {
  const guildId = getGuildId(body);
  const currentRotation = await db.mostRecentRotation(guildId);
  if (!currentRotation) {
    throw new StructuredErrorResponse(
      'No previous rotations exist in this channel.',
    );
  }
  const { id, done, messageId, initiatorId, selectionType } = currentRotation;
  const members = await db.getMembers(currentRotation.id);
  if (done) {
    return {
      rotationId: id,
      oldMessageId: messageId,
      response: wrapChannelMessage([
        {
          type: MessageComponentTypes.TEXT_DISPLAY,
          content: 'TODO',
        },
      ]),
    };
  } else {
    return {
      rotationId: id,
      oldMessageId: messageId,
      response: wrapChannelMessage(
        rotationMessage(initiatorId, selectionType, id, members),
      ),
    };
  }
};

type DeleteAction = {
  response: InteractionResponse;
  messageId?: string;
};

// Can be done either by /delete_rotation command or by the `delete_rotation:...` interaction
export const handleDeleteRotation = async (
  body: BaseInteraction,
): Promise<DeleteAction> => {
  const guildId = getGuildId(body);
  const userId = body.member.user.id;
  const selectedRotation = await db.getStartedRotation(guildId);

  if (!selectedRotation) {
    throw new StructuredErrorResponse(
      'No pending rotations in this server',
      body.message?.id,
    );
  }
  const messageId = selectedRotation.messageId;
  if (
    userId === selectedRotation.initiatorId ||
    hasAdminPermissions(body.member.permissions)
  ) {
    await db.deleteRotation(selectedRotation.id);
    return {
      response: textMessage(
        "Pending rotation deleted. I hope you're pleased with yourself",
      ),
      messageId,
    };
  } else {
    return {
      response: textMessage(
        'Pending rotation can only be deleted by its creator, the admin, or the Almighty Lord Our God',
      ),
    };
  }
};

export const handleJoinRotation = async (
  body: MessageComponentInteraction,
  rotationId: string,
): Promise<InteractionResponse> => {
  const userId = body.member.user.id;
  const currentRotation = await db.getRotation(rotationId);
  if (!currentRotation) {
    throw new StructuredErrorResponse(
      'Rotation does not exist',
      body.message.id,
    );
  }

  const members = await db.getMembers(rotationId);
  if (members.includes(userId)) {
    throw new StructuredErrorResponse(
      'You already joined. Do not test my patience. >:(',
    );
  }

  await db.addMember(rotationId, userId);

  // return textMessage('Woo!');
  return wrapChannelMessageUpdate(
    rotationMessage(
      currentRotation.initiatorId,
      currentRotation.selectionType,
      currentRotation.id,
      await db.getMembers(rotationId),
    ),
  );
};

export const handleStartRotation = async (
  body: MessageComponentInteraction,
  rotationId: string,
): Promise<InteractionResponse> => {
  const userId = body.member.user.id;
  const [currentRotation, members] = await Promise.all([
    db.getRotation(rotationId),
    db.getMembers(rotationId),
  ]);
  if (!currentRotation) {
    throw new StructuredErrorResponse(
      'Rotation does not exist',
      body.message.id,
    );
  }
  if (members.length < 3) {
    throw new StructuredErrorResponse(
      'Rotation does not have enough members (how did you even click the button??)',
    );
  }

  const { id, initiatorId, selectionType } = currentRotation;

  if (userId === initiatorId || hasAdminPermissions(body.member.permissions)) {
    await db.startRotation(rotationId);

    switch (selectionType) {
      case SelectionType.AUTO:
        const selectedPairs = autoSelection(members);
        await Promise.all(selectedPairs.map(([sender, receiver]) => db.addReceiver(rotationId, sender, receiver)));
        return wrapChannelMessageUpdate(rotationDoneMessage(initiatorId, selectionType, id, members));
      case SelectionType.MAGIC:
      case SelectionType.MANUAL:
        return wrapChannelMessageUpdate([{
          type: MessageComponentTypes.TEXT_DISPLAY,
          content:
            'Not implemented yet, only Automatic selection is currently available.',
        }]);
    }
  } else {
    return wrapChannelMessage(
      [
        {
          type: MessageComponentTypes.TEXT_DISPLAY,
          content:
            'Only the person who created this poll can start this rotation.',
        },
        {
          type: MessageComponentTypes.TEXT_DISPLAY,
          content:
            'This is a blatant violation of server rules. This incident has been reported to the authorities.',
        },
      ],
      true,
    );
  }
};

export const handleRevealReceiver = async (
  body: MessageComponentInteraction,
  rotationId: string,
): Promise<InteractionResponse> => {
  const userId = body.member.user.id;
  const receiverId = await db.getSenderReceiver(rotationId, userId);
  return wrapChannelMessage(
    [
      {
        type: MessageComponentTypes.TEXT_DISPLAY,
        content: receiverId
          ? `Your recipient is <@${receiverId}>`
          : 'You are not a member of this rotation',
      }
    ],
    true,
  );
};
