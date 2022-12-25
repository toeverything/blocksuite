// TODO support dynamic register
export async function loadBlockSchema() {
  const {
    PageBlockModel,
    ParagraphBlockModel,
    ListBlockModel,
    GroupBlockModel,
    CodeBlockModel,
    DividerBlockModel,
    EmbedBlockModel,
    ShapeBlockModel,
  } = await import('@blocksuite/blocks');

  return {
    'affine:paragraph': ParagraphBlockModel,
    'affine:page': PageBlockModel,
    'affine:list': ListBlockModel,
    'affine:group': GroupBlockModel,
    'affine:code': CodeBlockModel,
    'affine:divider': DividerBlockModel,
    'affine:embed': EmbedBlockModel,
    'affine:shape': ShapeBlockModel,
  } as const;
}
