import type {
  ModelOperationsOptions,
  ModelResult,
} from '@vscode/vscode-languagedetection';
import { ModelOperations } from '@vscode/vscode-languagedetection';
import type { BundledLanguageInfo } from 'shiki';

/*---------------------------------------------------------------------------------------------
 *  Ported from https://github.com/microsoft/vscode/blob/19ecb4b8337d0871f0a204853003a609d716b04e/src/vs/workbench/services/languageDetection/browser/languageDetectionSimpleWorker.ts
 *
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

const expectedRelativeConfidence = 0.2;
const positiveConfidenceCorrectionBucket1 = 0.05;
const positiveConfidenceCorrectionBucket2 = 0.025;
const negativeConfidenceCorrection = 0.5;

const adjustLanguageConfidence = (modelResult: ModelResult): ModelResult => {
  switch (modelResult.languageId) {
    // For the following languages, we increase the confidence because
    // these are commonly used languages in VS Code and supported
    // by the model.
    case 'js':
    case 'html':
    case 'json':
    case 'ts':
    case 'css':
    case 'py':
    case 'xml':
    case 'php':
      modelResult.confidence += positiveConfidenceCorrectionBucket1;
      break;
    // case 'yaml': // YAML has been know to cause incorrect language detection because the language is pretty simple. We don't want to increase the confidence for this.
    case 'cpp':
    case 'sh':
    case 'java':
    case 'cs':
    case 'c':
      modelResult.confidence += positiveConfidenceCorrectionBucket2;
      break;

    // For the following languages, we need to be extra confident that the language is correct because
    // we've had issues like #131912 that caused incorrect guesses. To enforce this, we subtract the
    // negativeConfidenceCorrection from the confidence.

    // languages that are provided by default in VS Code
    case 'bat':
    case 'ini':
    case 'makefile':
    case 'sql':
    // languages that aren't provided by default in VS Code
    // eslint-disable-next-line no-fallthrough -- There is no a fallthrough here!
    case 'csv':
    case 'toml':
      // Other considerations for negativeConfidenceCorrection that
      // aren't built in but suported by the model include:
      // * Assembly, TeX - These languages didn't have clear language modes in the community
      // * Markdown, Dockerfile - These languages are simple but they embed other languages
      modelResult.confidence -= negativeConfidenceCorrection;
      break;

    default:
      break;
  }
  return modelResult;
};

// --------------------------------------------------------------------------------------------

export type DetectionOptions = {
  expectedRelativeConfidence: number;
  // langBiases: Record<string, number>;
};

export type DetectionResult<T> = {
  language: T;
  confidence: number;
};

export type LanguageDetector<Lang extends BundledLanguageInfo> = ReturnType<
  typeof createLanguageDetector<Lang>
>;

const DEFAULT_DETECTION_OPTIONS: DetectionOptions = {
  expectedRelativeConfidence: expectedRelativeConfidence,
};

export const createLanguageDetector = <Lang extends BundledLanguageInfo>({
  supportedLangs = [],
  modelOperationsOptions,
}: {
  modelOperationsOptions?: ModelOperationsOptions;
  supportedLangs?: Lang[];
} = {}) => {
  // See https://github.com/microsoft/vscode-languagedetection#advanced-options
  const modelOperations = new ModelOperations({
    modelJsonLoaderFunc: async () => {
      return import('@vscode/vscode-languagedetection/model/model.json');
    },
    weightsLoaderFunc: async () => {
      const url =
        'https://unpkg.com/@vscode/vscode-languagedetection@1.0.21/model/group1-shard1of1.bin';
      // 'https://cdn.jsdelivr.net/npm/@vscode/vscode-languagedetection@1.0.21/model/group1-shard1of1.bin';
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      return buffer;
    },
    ...modelOperationsOptions,
  });

  const loadModel = async () => {
    if (
      'loadModel' in modelOperations &&
      // @ts-expect-error https://github.com/microsoft/vscode-languagedetection/issues/22
      typeof modelOperations.loadModel === 'function'
    ) {
      // @ts-expect-error we check it above so it is safe!
      await modelOperations.loadModel();
    } else {
      console.warn('`loadModel` is not supported! Please check the version!');
      await modelOperations.runModel('');
    }
  };

  const queryLangConfidence = async (text: string) => {
    const modelResults = await modelOperations.runModel(text);
    const normalizedModelResults = modelResults
      .map(modelResult => adjustLanguageConfidence(modelResult))
      .map(modelResult => {
        const lang = supportedLangs.find(
          l =>
            l.id === modelResult.languageId ||
            l.aliases?.includes(modelResult.languageId)
        );
        if (!lang) {
          return null;
        }
        return {
          language: lang,
          confidence: modelResult.confidence,
        } satisfies DetectionResult<Lang>;
      })
      .filter(Boolean) as DetectionResult<Lang>[];

    return normalizedModelResults;
  };

  const detectLanguages = async (
    sampleContent: string,
    opts: Partial<DetectionOptions> = DEFAULT_DETECTION_OPTIONS
  ): Promise<DetectionResult<Lang> | null> => {
    const options = { ...DEFAULT_DETECTION_OPTIONS, ...opts };
    const modelResults = (await queryLangConfidence(sampleContent)).sort(
      (a, b) => b.confidence - a.confidence
    );
    const mostPossibleLang = modelResults.at(0);

    if (
      !mostPossibleLang ||
      mostPossibleLang.confidence < options.expectedRelativeConfidence
    )
      return null;

    return {
      language: mostPossibleLang.language,
      confidence: mostPossibleLang.confidence,
    };
  };

  return {
    modelOperations,
    loadModel,
    isReady: () => {
      // @ts-expect-error
      return !!modelOperations._model;
    },
    queryLangConfidence,
    detectLanguages,
    dispose: () => {
      modelOperations.dispose();
    },
  };
};
