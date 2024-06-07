import type { BlockElement } from '@blocksuite/block-std';
import type { Disposable } from '@blocksuite/global/utils';
import type { TemplateResult } from 'lit';

import type { QuickSearchResult } from '../../root-block/root-service.js';
import type { DocMode } from '../types.js';

export interface NotificationService {
  toast(
    message: string,
    options?: {
      duration?: number;
      portal?: HTMLElement;
    }
  ): void;
  confirm(options: {
    title: string | TemplateResult;
    message: string | TemplateResult;
    confirmText?: string;
    cancelText?: string;
    abort?: AbortSignal;
  }): Promise<boolean>;
  prompt(options: {
    title: string | TemplateResult;
    message: string | TemplateResult;
    autofill?: string;
    placeholder?: string;
    confirmText?: string;
    cancelText?: string;
    abort?: AbortSignal;
  }): Promise<string | null>; // when cancel, return null
  notify(options: {
    title: string | TemplateResult;
    message?: string | TemplateResult;
    accent?: 'info' | 'success' | 'warning' | 'error';
    duration?: number; // unit ms, give 0 to disable auto dismiss
    abort?: AbortSignal;
    action?: {
      label: string | TemplateResult;
      onClick: () => void;
    };
    onClose: () => void;
  }): void;
}

export interface QuickSearchService {
  searchDoc: (options: {
    action?: 'insert';
    userInput?: string;
    skipSelection?: boolean;
  }) => Promise<QuickSearchResult>;
}

export interface PeekViewService {
  peek(pageRef: { docId: string; blockId?: string }): void;
  peek(target: HTMLElement): void;
  peek<Element extends BlockElement>(target: Element): void;
}

export interface DocModeService {
  setMode: (mode: DocMode, docId?: string) => void;
  getMode: (docId?: string) => DocMode | null;
  toggleMode: (docId?: string) => DocMode | null;
  onModeChange: (
    handler: (mode: DocMode | null) => void,
    docId?: string
  ) => Disposable;
}
