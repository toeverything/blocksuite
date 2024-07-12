import type { Chain, EditorHost, InitCommandCtx } from '@blocksuite/block-std';
import type { TemplateResult } from 'lit';

import type { DocMode } from '../../utils/index.js';

export interface AIItemGroupConfig {
  items: AIItemConfig[];
  name?: string;
}

export interface AIItemConfig {
  beta?: boolean;
  handler?: (host: EditorHost) => void;
  icon: (() => HTMLElement) | TemplateResult;
  name: string;
  showWhen?: (
    chain: Chain<InitCommandCtx>,
    editorMode: DocMode,
    host: EditorHost
  ) => boolean;
  subItem?: AISubItemConfig[];
  subItemOffset?: [number, number];
}

export interface AISubItemConfig {
  handler?: (host: EditorHost) => void;
  type: string;
}

abstract class BaseAIError extends Error {
  abstract readonly type: AIErrorType;
}

export enum AIErrorType {
  GeneralNetworkError = 'GeneralNetworkError',
  PaymentRequired = 'PaymentRequired',
  Unauthorized = 'Unauthorized',
}

export class UnauthorizedError extends BaseAIError {
  readonly type = AIErrorType.Unauthorized;

  constructor() {
    super('Unauthorized');
  }
}

// user has used up the quota
export class PaymentRequiredError extends BaseAIError {
  readonly type = AIErrorType.PaymentRequired;

  constructor() {
    super('Payment required');
  }
}

// general 500x error
export class GeneralNetworkError extends BaseAIError {
  readonly type = AIErrorType.GeneralNetworkError;

  constructor(message: string = 'Network error') {
    super(message);
  }
}

export type AIError =
  | GeneralNetworkError
  | PaymentRequiredError
  | UnauthorizedError;
