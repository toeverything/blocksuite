import type { BundledLanguageInfo, ThemeInput } from 'shiki';

export interface CodeBlockConfig {
  theme?: {
    dark?: ThemeInput;
    light?: ThemeInput;
  };
  langs?: BundledLanguageInfo[];

  /**
   * Whether to show line numbers in the code block.
   * @default true
   */
  showLineNumbers?: boolean;
}
