interface BasicMessage {
  id?: number;
  uuid: string;
  sender: string;
  receiver: string;
  content?: string;
  plainContent?: string;
  extra?: string;
  createdAt: number;
  updatedAt: number;
}

// export enum MessageType {
//   TEXT = 'text',
//   IMAGE = 'image',
//   VIDEO = 'video',
//   FILE = 'file',
//   AUDIO = 'audio',
//   LOCATION = 'location',
//   STICKER = 'sticker',
// }

interface TextMessage extends BasicMessage {
  type: 'text';
}

interface ImageMessage extends BasicMessage {
  type: 'image';
}

interface VideoMessage extends BasicMessage {
  type: 'video';
}

interface FileMessage extends BasicMessage {
  type: 'file';
}

type IMessage = TextMessage | ImageMessage | VideoMessage | FileMessage;
type IUIMessage = IMessage & { showTimestamp: boolean };

type MediaMessageExtra = Record<string, any> & {
  width?: number;
  height?: number;
};

type CursorPaginatedMessages = {
  messages: IMessage[]; // 当前页的数据（按 id 降序排列）
  hasMore: boolean; // 是否还有更多历史消息
  lastId: number | null; // 下一次请求历史记录应该传入的游标 id
};

type MessageAck = {
  receiver: string;
  lastAck: number;
};

type OfflineMessagesSummary = Record<
  string,
  {
    total?: number;
    lastMsg: IMessage;
  }
>;
