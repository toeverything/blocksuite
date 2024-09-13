import type { BundledLanguageInfo, ThemeInput } from 'shiki';

export interface CodeBlockConfig {
  theme?: {
    dark?: ThemeInput;
    light?: ThemeInput;
  };
  langs?: BundledLanguageInfo[];
}
