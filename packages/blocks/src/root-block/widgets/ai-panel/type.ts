import type { TemplateResult, nothing } from 'lit';

import type {
  AIError,
  AIItemGroupConfig,
} from '../../../_common/components/ai-item/types.js';

export interface CopyConfig {
  allowed: boolean;
  onCopy: () => Promise<boolean> | boolean;
}

export interface AIPanelAnswerConfig {
  actions: AIItemGroupConfig[];
  responses: AIItemGroupConfig[];
}

export interface AIPanelErrorConfig {
  cancel: () => void;
  error?: AIError;
  login: () => void;
  responses: AIItemGroupConfig[];
  upgrade: () => void;
}

export interface AIPanelGeneratingConfig {
  generatingIcon: TemplateResult<1>;
  height?: number;
  stages?: string[];
}

export interface AffineAIPanelWidgetConfig {
  answerRenderer: (
    answer: string,
    state?: AffineAIPanelState
  ) => TemplateResult<1> | typeof nothing;
  copy?: CopyConfig;

  discardCallback?: () => void;
  errorStateConfig: AIPanelErrorConfig;
  finishStateConfig: AIPanelAnswerConfig;
  generateAnswer?: (props: {
    finish: (type: 'aborted' | 'error' | 'success', err?: AIError) => void;
    input: string;
    // Used to allow users to stop actively when generating
    signal: AbortSignal;
    update: (answer: string) => void;
  }) => void;
  generatingStateConfig: AIPanelGeneratingConfig;

  hideCallback?: () => void;
}

export type AffineAIPanelState =
  | 'error'
  | 'finished'
  | 'generating'
  | 'hidden'
  | 'input';
