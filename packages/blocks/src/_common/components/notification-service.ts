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
}
