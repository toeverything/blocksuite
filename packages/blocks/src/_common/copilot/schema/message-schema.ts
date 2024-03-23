import type { EditorHost } from '@blocksuite/block-std';
import type { TemplateResult } from 'lit';

import type { CopilotServiceResult } from '../service/service-base.js';
import type { CopilotAction } from './chat-history.js';

export type ContentPayload =
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

export type UserMessage = {
  role: 'user';
  content: ContentPayload[];
};
export type AssistantMessage = {
  role: 'assistant';
  content: string;
  sources: BackgroundSource[];
};
export type SystemMessage = {
  role: 'system';
  content: string;
};
export type CopilotMessage = UserMessage | SystemMessage | AssistantMessage;

export type ApiData<T> =
  | {
      status: 'loading';
    }
  | {
      status: 'error';
      message: string;
    }
  | {
      status: 'success';
      data: T;
      done: boolean;
    };
export type ContentSchema<Result, Data = unknown> = {
  type: string;
  render: (props: {
    value: ApiData<Result>;
    data?: Data;
    changeData: (value: Data) => void;
    host: EditorHost;
    retry: () => void;
  }) => TemplateResult;
  toContext: (value: Result, data?: Data) => Array<CopilotMessage>;
};

export const createActionBuilder = <Result>(type: string) => {
  return <Arg>(
    fn: (arg: Arg) => CopilotServiceResult<Result>
  ): ((arg: Arg) => CopilotAction<Result>) => {
    return (arg: Arg) => {
      return {
        type: type,
        run: fn(arg),
      };
    };
  };
};

export type MessageContext = {
  history: CopilotMessage[];
};
