import {
  InteractionResponseFlags,
  InteractionResponseType,
  MessageComponent,
} from "discord-interactions";

export interface InteractionResponse {
  // Don't have any other types right now
  type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE;
  data: {
    flags: InteractionResponseFlags;
    components: Array<MessageComponent>;
  };
}

export const wrapChannelMessage = (
  components: MessageComponent[],
  ephemeral = false,
): InteractionResponse => {
  const flags = InteractionResponseFlags.IS_COMPONENTS_V2 | (
    ephemeral ? InteractionResponseFlags.EPHEMERAL : 0
  );

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      flags,
      components,
    },
  };
}
