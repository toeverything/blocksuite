export const translateLangs = [
  'English',
  'Spanish',
  'German',
  'French',
  'Italian',
  'Simplified Chinese',
  'Traditional Chinese',
  'Japanese',
  'Russian',
  'Korean',
] as const;

export const textTones = [
  'professional',
  'informal',
  'friendly',
  'critical',
] as const;

declare global {
  namespace BlockSuitePresets {
    interface AITextActionOptions {
      input: string;
      stream?: boolean;
      attachments?: string[]; // blob could only be strings for the moments (url or data urls)

      // the following seems not necessary?
      docId: string;
      workspaceId: string;
    }

    type TextStream = {
      [Symbol.asyncIterator](): AsyncIterableIterator<string>;
    };

    type AIActionTextResponse<T extends AITextActionOptions> =
      T['stream'] extends true ? TextStream : Promise<string>;

    interface TranslateOptions extends AITextActionOptions {
      lang: (typeof translateLangs)[number];
    }

    interface ChangeToneOptions extends AITextActionOptions {
      tone: (typeof textTones)[number];
    }

    interface AIActions {
      // todo: fine tune chat action here
      chat<T extends AITextActionOptions>(options: T): AIActionTextResponse<T>;

      summary<T extends AITextActionOptions>(
        options: T
      ): AIActionTextResponse<T>;
      improveWriting<T extends AITextActionOptions>(
        options: T
      ): AIActionTextResponse<T>;
      improveGrammar<T extends AITextActionOptions>(
        options: T
      ): AIActionTextResponse<T>;
      fixSpelling<T extends AITextActionOptions>(
        options: T
      ): AIActionTextResponse<T>;
      createHeadings<T extends AITextActionOptions>(
        options: T
      ): AIActionTextResponse<T>;
      makeLonger<T extends AITextActionOptions>(
        options: T
      ): AIActionTextResponse<T>;
      makeShorter<T extends AITextActionOptions>(
        options: T
      ): AIActionTextResponse<T>;
      checkCodeErrors<T extends AITextActionOptions>(
        options: T
      ): AIActionTextResponse<T>;

      explainImage<T extends AITextActionOptions>(
        options: T
      ): AIActionTextResponse<T>;

      // actions with variants
      translate<T extends TranslateOptions>(
        options: T
      ): AIActionTextResponse<T>;
      changeTone<T extends ChangeToneOptions>(
        options: T
      ): AIActionTextResponse<T>;
    }
  }
}
