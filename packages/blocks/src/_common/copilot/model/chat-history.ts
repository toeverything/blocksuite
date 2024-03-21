import {
  type EditorHost,
  ShadowlessElement,
  WithDisposable,
} from '@blocksuite/block-std';
import { html, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import type {
  ApiData,
  ChatMessage,
  MessageContent,
  MessageContext,
  MessageSchema,
  UserChatMessage,
} from './message-schema.js';
import { MessageSchemas } from './message-type/index.js';

export type CopilotAction<Result> = {
  type: string;
  run: (context: MessageContext) => AsyncIterable<Result>;
};

export interface HistoryItem {
  render(host: EditorHost): TemplateResult;

  toContext(): ChatMessage[];
}

class UserHistoryItem implements HistoryItem {
  constructor(private message: UserChatMessage) {}

  public render(_: EditorHost): TemplateResult {
    return html`${repeat(this.message.content, content => {
      if (content.type === 'text') {
        return html`<div>${content.text}</div>`;
      }
      return html`<div>unsupported content type</div>`;
    })}`;
  }

  public toContext(): ChatMessage[] {
    return [this.message];
  }
}

export class AssistantHistoryItem<Result = unknown, Data = unknown>
  implements HistoryItem
{
  public value: ApiData<Result> = { status: 'loading' };
  public data?: Data;
  private set: Set<() => void> = new Set();
  private abortController: AbortController | null = null;
  private schema: MessageSchema<Result, Data>;

  constructor(
    private action: CopilotAction<Result>,
    private history: HistoryItem[]
  ) {
    const schema = MessageSchemas.find(v => v.type === action.type);
    if (!schema) {
      throw new Error('schema not found');
    }
    this.schema = schema as MessageSchema<Result, Data>;
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
    const result = this.action.run({
      history: this.history.flatMap(v => v.toContext()),
    });
    const process = async () => {
      let lastValue: Result | undefined;
      for await (const value of result) {
        if (abortController.signal.aborted) {
          return;
        }
        lastValue = value;
        this.value = { status: 'success', data: value, done: false };
        this.fire();
      }
      if (lastValue) {
        this.value = { status: 'success', data: lastValue, done: true };
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

  onChange = (cb: () => void) => {
    this.set.add(cb);
    return () => {
      this.set.delete(cb);
    };
  };

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

  render(host: EditorHost): TemplateResult {
    const renderTemplate = () =>
      this.schema.render({
        value: this.value,
        data: this.data,
        changeData: this.changeData,
        retry: this.retry,
        host,
      });
    return html` <copilot-assistant-history-renderer
      .onChange="${this.onChange}"
      .renderTemplate="${renderTemplate}"
    ></copilot-assistant-history-renderer>`;
  }
}

@customElement('copilot-assistant-history-renderer')
export class copilotAssistantHistoryRenderer extends WithDisposable(
  ShadowlessElement
) {
  @property({ attribute: false })
  onChange!: (cb: () => void) => () => void;
  @property({ attribute: false })
  renderTemplate!: () => TemplateResult;

  override connectedCallback() {
    super.connectedCallback();
    this.disposables.add(
      this.onChange(() => {
        this.requestUpdate();
      })
    );
  }

  override render() {
    return this.renderTemplate();
  }
}

export class ChatHistory {
  history: HistoryItem[] = [];
  private subSet: Set<() => void> = new Set();
  onChange(cb: () => void) {
    this.subSet.add(cb);
    return () => {
      this.subSet.delete(cb);
    };
  }
  private fire() {
    this.subSet.forEach(v => v());
  }

  addUserMessage(contents: MessageContent[]) {
    this.history.push(new UserHistoryItem({ role: 'user', content: contents }));
    this.fire();
  }

  requestAssistantMessage<Result>(
    action: CopilotAction<Result>,
    userMessage: MessageContent[]
  ): AssistantHistoryItem<Result> {
    const history = this.history.slice();
    this.addUserMessage(userMessage);
    const assistantHistoryItem = new AssistantHistoryItem(action, history);
    this.history.push(assistantHistoryItem);
    this.fire();
    return assistantHistoryItem;
  }
}
