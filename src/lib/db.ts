import Dexie, { type Table } from 'dexie';

class IMDatabase extends Dexie {
  conversations!: Table<IConversations>;

  constructor() {
    super('Synclan_IM_Local_Database');
    this.version(1).stores({
      conversations: 'id, lastAccessed',
    });
  }
}

export const db = new IMDatabase();
