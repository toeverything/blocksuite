import type { ElementModelMap } from '../element-model/index.js';

export type ElementModelMatcher<TNode extends object = never> = {
  name: keyof ElementModelMap;
  match: (elementModel: ElementModelMap[keyof ElementModelMap]) => boolean;
  toAST: (elementModel: ElementModelMap[keyof ElementModelMap]) => TNode;
};

export abstract class ElementModelAdapter<AST = unknown> {
  /**
   * Convert element model to AST format
   */
  abstract fromElementModel(
    elementModel: ElementModelMap[keyof ElementModelMap]
  ): AST;
}
