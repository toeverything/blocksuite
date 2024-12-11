import type { BaseTextAttributes, DeltaInsert } from '@blocksuite/inline';

import {
  type AssetsManager,
  type ASTWalker,
  type ASTWalkerContext,
  type BlockSnapshot,
  BlockSnapshotSchema,
  type Job,
  type NodeProps,
} from '@blocksuite/store';

import type { AffineTextAttributes } from '../../types/index.js';

export const isBlockSnapshotNode = (node: unknown): node is BlockSnapshot =>
  BlockSnapshotSchema.safeParse(node).success;

export type TextBuffer = {
  content: string;
};

export type DeltaASTConverterOptions = {
  trim?: boolean;
  pre?: boolean;
  pageMap?: Map<string, string>;
};

export type AdapterContext<
  ONode extends object,
  TNode extends object = never,
  TConverter extends DeltaASTConverter = DeltaASTConverter,
> = {
  walker: ASTWalker<ONode, TNode>;
  walkerContext: ASTWalkerContext<TNode>;
  configs: Map<string, string>;
  job: Job;
  deltaConverter: TConverter;
  textBuffer: TextBuffer;
  assets?: AssetsManager;
  updateAssetIds?: (assetsId: string) => void;
};

/**
 * Defines the interface for adapting between different blocks and target formats.
 * Used to convert blocks between a source format (TNode) and BlockSnapshot format.
 *
 * @template TNode - The source/target node type to convert from/to
 * @template TConverter - The converter used for handling delta format conversions
 */
export type BlockAdapterMatcher<
  TNode extends object = never,
  TConverter extends DeltaASTConverter = DeltaASTConverter,
> = {
  /** The block flavour identifier */
  flavour: string;

  /**
   * Function to check if a target node matches this adapter
   * @param o - The target node properties to check
   * @returns true if this adapter can handle the node
   */
  toMatch: (o: NodeProps<TNode>) => boolean;

  /**
   * Function to check if a BlockSnapshot matches this adapter
   * @param o - The BlockSnapshot properties to check
   * @returns true if this adapter can handle the snapshot
   */
  fromMatch: (o: NodeProps<BlockSnapshot>) => boolean;

  /**
   * Handlers for converting from target format to BlockSnapshot
   */
  toBlockSnapshot: {
    /**
     * Called when entering a target walker node during traversal
     * @param o - The target node properties
     * @param context - The adapter context
     */
    enter?: (
      o: NodeProps<TNode>,
      context: AdapterContext<TNode, BlockSnapshot, TConverter>
    ) => void | Promise<void>;

    /**
     * Called when leaving a target walker node during traversal
     * @param o - The target node properties
     * @param context - The adapter context
     */
    leave?: (
      o: NodeProps<TNode>,
      context: AdapterContext<TNode, BlockSnapshot, TConverter>
    ) => void | Promise<void>;
  };

  /**
   * Handlers for converting from BlockSnapshot to target format
   */
  fromBlockSnapshot: {
    /**
     * Called when entering a BlockSnapshot walker node during traversal
     * @param o - The BlockSnapshot properties
     * @param context - The adapter context
     */
    enter?: (
      o: NodeProps<BlockSnapshot>,
      context: AdapterContext<BlockSnapshot, TNode, TConverter>
    ) => void | Promise<void>;

    /**
     * Called when leaving a BlockSnapshot walker node during traversal
     * @param o - The BlockSnapshot properties
     * @param context - The adapter context
     */
    leave?: (
      o: NodeProps<BlockSnapshot>,
      context: AdapterContext<BlockSnapshot, TNode, TConverter>
    ) => void | Promise<void>;
  };
};

export abstract class DeltaASTConverter<
  TextAttributes extends BaseTextAttributes = BaseTextAttributes,
  AST = unknown,
> {
  /**
   * Convert AST format to delta format
   */
  abstract astToDelta(
    ast: AST,
    options?: unknown
  ): DeltaInsert<TextAttributes>[];

  /**
   * Convert delta format to AST format
   */
  abstract deltaToAST(
    deltas: DeltaInsert<TextAttributes>[],
    options?: unknown
  ): AST[];
}

export type InlineDeltaMatcher<TNode extends object = never> = {
  name: keyof AffineTextAttributes | string;
  match: (delta: DeltaInsert<AffineTextAttributes>) => boolean;
  toAST: (
    delta: DeltaInsert<AffineTextAttributes>,
    context: {
      configs: Map<string, string>;
      current: TNode;
    }
  ) => TNode;
};

export type ASTToDeltaMatcher<AST> = {
  name: string;
  match: (ast: AST) => boolean;
  toDelta: (
    ast: AST,
    context: {
      configs: Map<string, string>;
      options: DeltaASTConverterOptions;
      toDelta: (
        ast: AST,
        options?: DeltaASTConverterOptions
      ) => DeltaInsert<AffineTextAttributes>[];
    }
  ) => DeltaInsert<AffineTextAttributes>[];
};
