import Sqlite, { Database } from "sqlite3";

type ValueOf<T> = T[keyof T];

export const SelectionType = {
  AUTO: "auto",
  MANUAL: "manual",
  MAGIC: "magic",
};

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

class Client {
  private db: Database;

  constructor() {
    this.db = new Sqlite.Database("ratatooey.db");
  }

  async createRotation(
    id: string,
    selectionType: SelectionType,
    initiatorId: string,
    guildId: string,
  ) {
    await this._rotationRun(
      `INSERT INTO rotations (id, selection_type, initiator_id, guild_id, message_id, done)
      values (?, ?, ?, ?, ?, ?)`,
      id,
      selectionType,
      initiatorId,
      guildId,
      '@@', // needs to be filled in later
      0,
    );
  }

  async deleteRotation(id: string) {
    await this._rotationRun(
      `DELETE FROM rotations WHERE id = ?`,
      id,
    );
  }

  async saveMessageId(id: string, messageId: string) {
    await this._rotationRun(
      `UPDATE rotations SET message_id = ? WHERE id = ?`,
      messageId,
      id,
    );
  }

  async getRotation(id: string) {
    return this._rotationGet(`SELECT * FROM rotations WHERE id = ?`, id);
  }
  
  async getStartedRotation(guildId: string) {
    return this._rotationGet(`SELECT * FROM rotations WHERE guild_id = ? AND done = 0`, guildId);
  }

  private async _rotationGet(query: string, ...params: unknown[]): Promise<Rotation | null> {
    return await new Promise((res, rej) => {
      this.db.get(query, ...params, (err: unknown, data: any) => {
        if (err) {
          rej(err);
        } else {
          if (data === undefined) {
            res(null);
          } else {
            res({
              id: data.id,
              done: data.done === 1,
              guildId: data.guild_id,
              initiatorId: data.initiator_id,
              selectionType: data.selection_type,
              messageId: data.message_id,
              createdAt: data.created_at,
            });
          }
        }
      });
    });
  }

  private async _rotationRun(query: string, ...params: unknown[]) {
    await new Promise<void>((res, rej) => {
      this.db.run(
        query,
        ...params,
        (err: unknown) => {
          err ? rej(err) : res();
        }
      );
    });
  }
}

export const db = new Client();
