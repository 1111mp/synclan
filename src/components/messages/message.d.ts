interface BasicMessage {
  id: number;
  uuid: string;
  sender: string;
  receiver: string;
  content?: string;
  extra?: string;
  createdAt: number;
  updatedAt: number;
}

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

type Message = TextMessage | ImageMessage | VideoMessage | FileMessage;

type MediaMessageExtra = Record<string, any> & {
  width?: number;
  height?: number;
};
