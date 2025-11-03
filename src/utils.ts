import 'dotenv/config';
import { Env } from './consts';

type BodylessRequestInit = Omit<RequestInit, 'body'>;
export type CustomRequestInit = BodylessRequestInit & { body?: any };

export const discordRequest = async (endpoint: string, options: CustomRequestInit) => {
  const url = `https://discord.com/api/v10/${endpoint}`;
  if (options.body && typeof options.body !== 'string') {
    options.body = JSON.stringify(options.body);
  }

  const res = await fetch(
    url,
    {
      headers: {
        Authorization: `Bot ${Env.DISCORD_TOKEN}`,
        'Content-Type': 'application/json; charset=UTF-8',
        // Should replace when I get my own 
        'User-Agent': `DiscordBot (https://github.com/pgilbertschmitt/santa-bort, 1.0.0)`,
      },
      ...options,
    }
  );

  if (!res.ok) {
    const data = await res.json();
    console.log(`${res.status} error:`, data);
    throw new Error(JSON.stringify(data, null, 2));
  }

  return res;
};

const ADMIN_PERMISSION = BigInt(1<<3);
const MANAGE_GUILD_PERMISSION = BigInt(1<<5);
export const hasAdminPermissions = (permissions: string) => {
  const permInt = BigInt(permissions);
  return Boolean((permInt & ADMIN_PERMISSION) || (permInt & MANAGE_GUILD_PERMISSION))
}

export type ValueOf<T> = T[keyof T];
