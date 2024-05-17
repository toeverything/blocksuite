import type { nothing, TemplateResult } from 'lit';

import type {
  AIError,
  AIItemGroupConfig,
} from '../../../_common/components/ai-item/types.js';

export interface CopyConfig {
  allowed: boolean;
  onCopy: () => boolean | Promise<boolean>;
}

export type AIPanelAnswerConfig = {
  responses: AIItemGroupConfig[];
  actions: AIItemGroupConfig[];
};

export interface AIPanelErrorConfig {
  login: () => void;
  upgrade: () => void;
  cancel: () => void;
  responses: AIItemGroupConfig[];
  error?: AIError;
}

export interface AffineAIPanelWidgetConfig {
  answerRenderer: (
    answer: string,
    state?: AffineAIPanelState
  ) => TemplateResult<1> | typeof nothing;
  generateAnswer?: (props: {
    input: string;
    update: (answer: string) => void;
    finish: (type: 'success' | 'error' | 'aborted', err?: AIError) => void;
    // Used to allow users to stop actively when generating
    signal: AbortSignal;
  }) => void;

  finishStateConfig: AIPanelAnswerConfig;
  errorStateConfig: AIPanelErrorConfig;
  hideCallback?: () => void;
  discardCallback?: () => void;

  copy?: CopyConfig;

  generatingIcon: TemplateResult<1>;
}

export type AffineAIPanelState =
  | 'hidden'
  | 'input'
  | 'generating'
  | 'finished'
  | 'error';
