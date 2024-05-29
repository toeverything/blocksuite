import type { TemplateResult } from 'lit';

export interface NotificationService {
  toast(
    message: string,
    options?: {
      duration?: number;
      portal?: HTMLElement;
    }
  ): void;
  confirm(notification: {
    title: string;
    message: string | TemplateResult;
    confirmText: string;
    cancelText: string;
    abort?: AbortSignal;
  }): Promise<boolean>;
  notify(notification: {
    title: string | TemplateResult;
    message?: string | TemplateResult;
    accent?: 'info' | 'success' | 'warning' | 'error';
    duration?: number; // give 0 to disable auto dismiss
    abort?: AbortSignal;
  }): void;
}
