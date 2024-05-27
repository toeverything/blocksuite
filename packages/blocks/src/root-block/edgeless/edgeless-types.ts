export type EdgelessBlockType =
  | 'affine:frame'
  | 'affine:note'
  | 'affine:image'
  | 'affine:attachment'
  | 'affine:bookmark'
  | 'affine:embed-github'
  | 'affine:embed-youtube'
  | 'affine:embed-figma'
  | 'affine:embed-linked-doc'
  | 'affine:embed-synced-doc'
  | 'affine:embed-html'
  | 'affine:embed-loom'
  | 'affine:edgeless-text';

export type EdgelessElementType =
  | EdgelessBlockType
  | 'shape'
  | 'brush'
  | 'connector'
  | 'text'
  | 'group'
  | 'debug'
  | 'mindmap';
