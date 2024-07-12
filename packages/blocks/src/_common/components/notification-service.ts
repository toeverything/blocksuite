import type { TemplateResult } from 'lit';

export interface NotificationService {
  confirm(options: {
    abort?: AbortSignal;
    cancelText?: string;
    confirmText?: string;
    message: TemplateResult | string;
    title: TemplateResult | string;
  }): Promise<boolean>;
  notify(options: {
    abort?: AbortSignal;
    accent?: 'error' | 'info' | 'success' | 'warning';
    action?: {
      label: TemplateResult | string;
      onClick: () => void;
    };
    duration?: number; // unit ms, give 0 to disable auto dismiss
    message?: TemplateResult | string;
    onClose: () => void;
    title: TemplateResult | string;
  }): void;
  prompt(options: {
    abort?: AbortSignal;
    autofill?: string;
    cancelText?: string;
    confirmText?: string;
    message: TemplateResult | string;
    placeholder?: string;
    title: TemplateResult | string;
  }): Promise<null | string>; // when cancel, return null
  toast(
    message: string,
    options?: {
      duration?: number;
      portal?: HTMLElement;
    }
  ): void;
}
