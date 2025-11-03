import 'dotenv/config';

export const Env = {
  PUBLIC_KEY: process.env.PUBLIC_KEY || '',
  APP_ID: process.env.APP_ID || '',
  DISCORD_TOKEN: process.env.DISCORD_TOKEN || '',
  PORT: process.env.PORT || 9001,
} as const;

export const Names = {
  NEW_ROTATION: 'new_rotation',
  DELETE_ACTIVE_ROTATION: 'delete_rotation',
  OPT_ROTATION_TYPE: 'rotation_type',
  ACTION_JOIN_ROTATION: 'join_rotation',
  ACTION_START_ROTATION: 'start_rotation',
} as const;

export const Endpoints = {
  COMMAND: `applications/${Env.APP_ID}/commands`,
  MESSAGE: (token: string, messageId: string) =>
    `webhooks/${Env.APP_ID}/${token}/messages/${messageId}`,
}