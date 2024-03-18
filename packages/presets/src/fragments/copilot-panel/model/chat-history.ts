import { html, type TemplateResult } from 'lit';

type MessageContent =
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
export type ChatMessage =
  | UserChatMessage
  | {
      role: 'system';
      content: string;
    }
  | {
      role: 'assistant';
      content: string;
      sources: BackgroundSource[];
    };

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
    };
export type MessageSchema<Result, Data = unknown> = {
  render: (props: {
    value: ApiData<Result>;
    data?: Data;
    changeData: (value: Data) => void;
    retry: () => void;
  }) => TemplateResult;
  toContext: (value: Result, data?: Data) => Array<ChatMessage>;
};
export const createMessageSchema = <Result, Data = unknown>(
  config: MessageSchema<Result, Data>
): MessageSchema<Result, Data> => config;
type MessageContext = {
  history: ChatMessage[];
};
export type CopilotActionFromSchema<T extends MessageSchema<never>> =
  T extends MessageSchema<infer R, infer _> ? CopilotAction<R> : never;
export type CopilotAction<Result> = (
  context: MessageContext
) => AsyncIterable<Result>;
interface HistoryItem {
  render(): TemplateResult;

  toContext(): ChatMessage[];
}

class UserHistoryItem implements HistoryItem {
  constructor(private message: UserChatMessage) {}

  public render(): TemplateResult {
    return html``;
  }

  public toContext(): ChatMessage[] {
    return [this.message];
  }
}

class AssistantHistoryItem<Result = unknown, Data = unknown>
  implements HistoryItem
{
  public value: ApiData<Result> = { status: 'loading' };
  public data?: Data;
  private set: Set<() => void> = new Set();
  private abortController: AbortController | null = null;

  constructor(
    private schema: MessageSchema<Result, Data>,
    private action: CopilotAction<Result>,
    private history: HistoryItem[]
  ) {
    this.start();
  }

  stop() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  start() {
    this.stop();
    const abortController = new AbortController();
    this.abortController = abortController;
    const result = this.action({
      history: this.history.flatMap(v => v.toContext()),
    });
    const process = async () => {
      for await (const value of result) {
        if (abortController.signal.aborted) {
          return;
        }
        this.value = { status: 'success', data: value };
        this.fire();
      }
    };
    process().catch(e => {
      if (e.name === 'AbortError') {
        return;
      }
      this.value = { status: 'error', message: e.message };
      this.fire();
    });
  }

  retry = () => {
    this.start();
  };

  onChange(cb: () => void) {
    this.set.add(cb);
  }

  changeData = (data: Data) => {
    this.data = data;
    this.fire();
  };

  fire() {
    this.set.forEach(v => v());
  }

  toContext() {
    if (this.value.status !== 'success') {
      return [];
    }
    return this.schema.toContext(this.value.data, this.data);
  }

  render(): TemplateResult {
    return this.schema.render({
      value: this.value,
      data: this.data,
      changeData: this.changeData,
      retry: this.retry,
    });
  }
}

export class ChatHistory {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  history: HistoryItem[] = [];

  addUserMessage(contents: MessageContent[]) {
    this.history.push(new UserHistoryItem({ role: 'user', content: contents }));
  }

  addAssistantMessage<Result>(
    schema: MessageSchema<Result>,
    action: CopilotAction<Result>
  ) {
    this.history.push(
      new AssistantHistoryItem(schema, action, this.history.slice())
    );
  }
}
