import type { AIError } from '@blocksuite/blocks';

export type ChatMessage = {
  attachments?: string[];
  content: string;
  createdAt: string;
  role: 'assistant' | 'user';
};

export type ChatAction = {
  action: string;
  createdAt: string;
  messages: ChatMessage[];
  sessionId: string;
};

export type ChatItem = ChatAction | ChatMessage;

export type ChatStatus =
  | 'error'
  | 'idle'
  | 'loading'
  | 'success'
  | 'transmitting';

export type ChatContextValue = {
  abortController: AbortController | null;
  error: AIError | null;
  images: File[];
  items: ChatItem[];
  markdown: string;
  quote: string;
  status: ChatStatus;
};
