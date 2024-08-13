import type { ThemeInput } from 'shiki';

export interface CodeBlockConfig {
  theme: {
    dark: ThemeInput;
    light: ThemeInput;
  };
}

declare global {
  namespace BlockSuite {
    interface BlockConfigs {
      'affine:code': CodeBlockConfig;
    }
  }
}
