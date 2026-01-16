import Sqlite, { Database } from 'sqlite3';
import { ValueOf } from './utils';

export const SelectionType = {
  AUTO: 'auto',
  MANUAL: 'manual',
  MAGIC: 'magic',
} as const;

export type SelectionType = ValueOf<typeof SelectionType>;

export type Rotation = {
  id: string;
  done: boolean;
  selectionType: SelectionType;
  initiatorId: string;
  guildId: string;
  messageId: string;
  createdAt: string;
};

export type Member = {
  rotationId: string;
  memberId: string;
};

export type MemberPair = {
  rotationId: string;
  giverId: string;
  receiverId: string;
};

export type SenderReceiverPairs = Array<[string, string]>;

class Client {
  private db: Database;

  constructor() {
    this.db = new Sqlite.Database('ratatooey.db');
  }

  async createRotation(
    id: string,
    selectionType: SelectionType,
    initiatorId: string,
    guildId: string,
  ) {
    await this._run(
      `INSERT INTO rotations (id, selection_type, initiator_id, guild_id, message_id, done)
      VALUES (?, ?, ?, ?, ?, ?)`,
      id,
      selectionType,
      initiatorId,
      guildId,
      '@@', // needs to be filled in by `saveMessageId` which is called immediately afterwards
      0,
    );
  }

  async deleteRotation(id: string) {
    await Promise.all([
      this._run('DELETE FROM rotations WHERE id = ?', id),
      this._run('DELETE FROM memberships WHERE rotation_id = ?', id),
    ]);
  }

  async startRotation(id: string) {
    await this._run('UPDATE rotations SET done = 1 WHERE id = ?', id);
  }

  async saveMessageId(id: string, messageId: string) {
    await this._run(
      'UPDATE rotations SET message_id = ? WHERE id = ?',
      messageId,
      id,
    );
  }

  async getRotation(id: string) {
    return this._get(
      'SELECT * FROM rotations WHERE id = ?',
      this.mapRotation,
      id,
    );
  }

  async getStartedRotation(guildId: string) {
    return this._get(
      'SELECT * FROM rotations WHERE guild_id = ? AND done = 0',
      this.mapRotation,
      guildId,
    );
  }

  async getLastInitiatedRotation(guildId: string) {
    return this._get(
      'SELECT * FROM rotations WHERE guild_id = ? AND done = 1 ORDER BY created_at DESC LIMIT 1',
      this.mapRotation,
      guildId,
    );
  }

  async mostRecentRotation(guildId: string) {
    return await this._get(
      'SELECT * FROM rotations WHERE guild_id = ? ORDER BY created_at DESC LIMIT 1',
      this.mapRotation,
      guildId,
    );
  }

  async addMember(rotationId: string, memberId: string) {
    return this._run(
      'INSERT INTO memberships (rotation_id, sender_id) VALUES (?, ?)',
      rotationId,
      memberId,
    );
  }

  async addReceiver(rotationId: string, senderId: string, receiverId: string) {
    return this._run(
      'UPDATE memberships SET receiver_id = ? WHERE rotation_id = ? AND sender_id = ?',
      receiverId,
      rotationId,
      senderId,
    );
  }

  async getMembers(rotationId: string) {
    return this._all(
      'SELECT * FROM memberships WHERE rotation_id = ?',
      (row: any) => row.sender_id as string,
      rotationId,
    );
  }

  async getSenderReceiver(rotationId: string, senderId: string) {
    return this._get(
      'SELECT * FROM memberships WHERE rotation_id = ? AND sender_id = ?',
      (row: any) => row.receiver_id as string,
      rotationId,
      senderId,
    );
  }

  async getAllSenderReceviers(rotationId: string) {
    return this._all(
      'SELECT * FROM memberships WHERE rotation_id = ?',
      (row: any) => ({
        sender: row.sender_id as string,
        receiver: row.receiver_id as string,
      }),
      rotationId,
    );
  }

  private async _get<T>(
    query: string,
    mapper: (row: any) => T,
    ...params: unknown[]
  ): Promise<T | null> {
    return await new Promise((res, rej) => {
      this.db.get(query, ...params, (err: unknown, data: any) => {
        if (err) {
          rej(err);
        } else {
          if (data === undefined) {
            res(null);
          } else {
            res(mapper(data));
          }
        }
      });
    });
  }

  private async _all<T>(
    query: string,
    mapper: (row: any) => T,
    ...params: unknown[]
  ): Promise<T[]> {
    return await new Promise((res, rej) => {
      this.db.all(query, ...params, (err: unknown, data: any) => {
        if (err) {
          rej(err);
        } else {
          res(data.map(mapper));
        }
      });
    });
  }

  private async _run(query: string, ...params: unknown[]) {
    await new Promise<void>((res, rej) => {
      this.db.run(query, ...params, (err: unknown) => {
        err ? rej(err) : res();
      });
    });
  }

  private mapRotation(row: any): Rotation {
    return {
      id: row.id,
      done: row.done === 1,
      guildId: row.guild_id,
      initiatorId: row.initiator_id,
      selectionType: row.selection_type,
      messageId: row.message_id,
      createdAt: row.created_at,
    };
  }
}

export const db = new Client();
