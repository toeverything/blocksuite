import { createIdentifier } from '@blocksuite/global/di';
import type { ExtensionType } from '@blocksuite/store';
import type { TemplateResult } from 'lit';

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
    footer?: string | TemplateResult;
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

export const NotificationProvider = createIdentifier<NotificationService>(
  'AffineNotificationService'
);

export function NotificationExtension(
  notificationService: NotificationService
): ExtensionType {
  return {
    setup: di => {
      di.addImpl(NotificationProvider, notificationService);
    },
  };
}
