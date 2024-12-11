import type { ExtensionType } from '@blocksuite/block-std';
import type { DeltaInsert } from '@blocksuite/inline';

import {
  createIdentifier,
  type ServiceIdentifier,
} from '@blocksuite/global/di';

import type { AffineTextAttributes } from '../../types/index.js';
import type { HtmlAST, InlineHtmlAST } from '../types/hast.js';

import {
  type ASTToDeltaMatcher,
  DeltaASTConverter,
  type DeltaASTConverterOptions,
  type InlineDeltaMatcher,
} from '../types/adapter.js';
import { TextUtils } from '../utils/text.js';

export type InlineDeltaToHtmlAdapterMatcher = InlineDeltaMatcher<InlineHtmlAST>;

export const InlineDeltaToHtmlAdapterMatcherIdentifier =
  createIdentifier<InlineDeltaToHtmlAdapterMatcher>(
    'InlineDeltaToHtmlAdapterMatcher'
  );

export function InlineDeltaToHtmlAdapterExtension(
  matcher: InlineDeltaToHtmlAdapterMatcher
): ExtensionType & {
  identifier: ServiceIdentifier<InlineDeltaToHtmlAdapterMatcher>;
} {
  const identifier = InlineDeltaToHtmlAdapterMatcherIdentifier(matcher.name);
  return {
    setup: di => {
      di.addImpl(identifier, () => matcher);
    },
    identifier,
  };
}

export type HtmlASTToDeltaMatcher = ASTToDeltaMatcher<HtmlAST>;

export const HtmlASTToDeltaMatcherIdentifier =
  createIdentifier<HtmlASTToDeltaMatcher>('HtmlASTToDeltaMatcher');

export function HtmlASTToDeltaExtension(
  matcher: HtmlASTToDeltaMatcher
): ExtensionType & {
  identifier: ServiceIdentifier<HtmlASTToDeltaMatcher>;
} {
  const identifier = HtmlASTToDeltaMatcherIdentifier(matcher.name);
  return {
    setup: di => {
      di.addImpl(identifier, () => matcher);
    },
    identifier,
  };
}

export class HtmlDeltaConverter extends DeltaASTConverter<
  AffineTextAttributes,
  HtmlAST
> {
  constructor(
    readonly configs: Map<string, string>,
    readonly inlineDeltaMatchers: InlineDeltaToHtmlAdapterMatcher[],
    readonly htmlASTToDeltaMatchers: HtmlASTToDeltaMatcher[]
  ) {
    super();
  }

  private _applyTextFormatting(
    delta: DeltaInsert<AffineTextAttributes>
  ): InlineHtmlAST {
    let mdast: InlineHtmlAST = {
      type: 'text',
      value: delta.insert,
    };

    const context: {
      configs: Map<string, string>;
      current: InlineHtmlAST;
    } = {
      configs: this.configs,
      current: mdast,
    };
    for (const matcher of this.inlineDeltaMatchers) {
      if (matcher.match(delta)) {
        mdast = matcher.toAST(delta, context);
        context.current = mdast;
      }
    }

    return mdast;
  }

  private _spreadAstToDelta(
    ast: HtmlAST,
    options: DeltaASTConverterOptions = Object.create(null)
  ): DeltaInsert<AffineTextAttributes>[] {
    const context = {
      configs: this.configs,
      options,
      toDelta: (ast: HtmlAST, options?: DeltaASTConverterOptions) =>
        this._spreadAstToDelta(ast, options),
    };
    for (const matcher of this.htmlASTToDeltaMatchers) {
      if (matcher.match(ast)) {
        return matcher.toDelta(ast, context);
      }
    }
    return 'children' in ast
      ? ast.children.flatMap(child => this._spreadAstToDelta(child, options))
      : [];
  }

  astToDelta(
    ast: HtmlAST,
    options: DeltaASTConverterOptions = Object.create(null)
  ): DeltaInsert<AffineTextAttributes>[] {
    return this._spreadAstToDelta(ast, options).reduce((acc, cur) => {
      return TextUtils.mergeDeltas(acc, cur);
    }, [] as DeltaInsert<AffineTextAttributes>[]);
  }

  deltaToAST(
    deltas: DeltaInsert<AffineTextAttributes>[],
    depth = 0
  ): InlineHtmlAST[] {
    if (depth > 0) {
      deltas.unshift({ insert: ' '.repeat(4).repeat(depth) });
    }

    return deltas.map(delta => this._applyTextFormatting(delta));
  }
}
