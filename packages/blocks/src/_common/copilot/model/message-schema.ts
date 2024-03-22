import type { EditorHost } from '@blocksuite/block-std';
import type { TemplateResult } from 'lit';

import type { CopilotServiceResult } from '../service/service-base.js';
import type { AssistantHistoryItem } from './chat-history.js';
import { type CopilotAction } from './chat-history.js';

export type MessageContent =
  | {
      type: 'text';
      text: string;
    }
  | {
      type: 'image_url';
      image_url: {
        url: string;
      };
    };
type BackgroundSource = {
  id: string;
  slice: string[];
};

export type UserChatMessage = {
  role: 'user';
  content: MessageContent[];
};
export type AssistantChatMessage = {
  role: 'assistant';
  content: string;
  sources: BackgroundSource[];
};
export type SystemChatMessage = {
  role: 'system';
  content: string;
};
export type ChatMessage =
  | UserChatMessage
  | SystemChatMessage
  | AssistantChatMessage;

export type ApiData<T> =
  | {
      status: 'loading';
    }
  | {
      status: 'error';
      message: string;
    }
  | {
      status: 'stop';
    }
  | {
      status: 'success';
      data: T;
      done: boolean;
    };
export type MessageRenderer<Result, Data = unknown> = (props: {
  value: ApiData<Result>;
  data?: Data;
  changeData: (value: Data) => void;
  host: EditorHost;
  item: AssistantHistoryItem<Result, Data>;
}) => TemplateResult;
export type AssistantMessageSchema<Result, Data = unknown> = {
  type: string;
  render: MessageRenderer<Result, Data>;
  toContext: (value: Result, data?: Data) => Array<ChatMessage>;
};
export const createMessageSchema = <Result, Data = unknown>(
  config: AssistantMessageSchema<Result, Data>
): AssistantMessageSchema<Result, Data> & {
  createActionBuilder: <Arg>(
    fn: (arg: Arg) => CopilotServiceResult<Result>
  ) => (arg: Arg) => CopilotAction<Result>;
} => {
  return {
    ...config,
    createActionBuilder: fn => arg => {
      return {
        type: config.type,
        run: fn(arg),
      };
    },
  };
};

export type MessageContext = {
  history: ChatMessage[];
};
