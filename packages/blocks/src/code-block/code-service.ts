import { BlockService } from '@blocksuite/block-std';
import { bundledLanguagesInfo } from 'shiki';

import type { CodeBlockModel } from './code-model.js';
import type { LanguageDetector } from './language-detection.js';
import type { StrictLanguageInfo } from './utils/consts.js';

export class CodeService extends BlockService<CodeBlockModel> {
  private _languageDetector: LanguageDetector<StrictLanguageInfo> | null = null;
  private _loading = false;

  override mounted(): void {
    super.mounted();
    // requestIdleCallback(() => {
    //   void this.loadLanguageDetector();
    // });
  }

  override unmounted(): void {
    super.unmounted();
    this._languageDetector?.dispose();
    this._languageDetector = null;
  }

  async loadLanguageDetector() {
    if (this._languageDetector || this._loading) {
      // Already loaded or loading
      return;
    }
    try {
      this._loading = true;
      const { createLanguageDetector } = await import(
        './language-detection.js'
      );
      this._languageDetector = createLanguageDetector({
        supportedLangs: bundledLanguagesInfo as StrictLanguageInfo[],
        modelOperationsOptions: {
          maxContentSize: 3000,
        },
      });
      await this._languageDetector?.loadModel();
    } catch (error) {
      // Reset the language detector to null so that it can be reloaded later
      this._languageDetector = null;
      console.error('Failed to load language detector', error);
    } finally {
      this._loading = false;
    }
  }

  async detectLanguage(model: CodeBlockModel) {
    const text = model.text.yText.toString();
    if (!text || !this._languageDetector || !this._languageDetector.isReady()) {
      return null;
    }
    return this._languageDetector.detectLanguages(text);
  }

  async queryLangConfidence(model: CodeBlockModel) {
    const text = model.text.yText.toString();
    if (!text || !this._languageDetector || !this._languageDetector.isReady()) {
      return {} as Record<StrictLanguageInfo['id'], number>;
    }

    const detectionResults =
      await this._languageDetector.queryLangConfidence(text);

    return detectionResults.reduce(
      (acc, { language, confidence }) => {
        acc[language.id] = confidence;
        return acc;
      },
      {} as Record<StrictLanguageInfo['id'], number>
    );
  }
}
