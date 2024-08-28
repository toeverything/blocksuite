import type { BundledLanguageInfo, ThemeInput } from 'shiki';

export interface CodeBlockConfig {
  theme?: {
    dark?: ThemeInput;
    light?: ThemeInput;
  };
  langs?: BundledLanguageInfo[];
}

declare global {
  namespace BlockSuite {
    interface BlockConfigs {
      'affine:code': CodeBlockConfig;
    }
  }
}
