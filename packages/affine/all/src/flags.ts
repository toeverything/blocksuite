/**
 * Feature flags for block registration.
 *
 * Each key matches a block (or gfx module) that can be turned off at editor
 * assembly time, through `getAffineSchemas`, `getInternalStoreExtensions` and
 * `getInternalViewExtensions`. Blocks absent from this list form the
 * structural core of the editor (root, surface, note, paragraph, base gfx
 * tools, inline presets, widgets) and are always registered.
 *
 * Flags default to enabled: `{ database: false }` disables the database
 * block, an empty object (or no flags at all) enables everything. This lets
 * an application ship a block "dark" (registered code, disabled flag), enable
 * it progressively and turn it off again without redeploying.
 *
 * Caveats:
 * - Disabling a block does not migrate existing documents: a stored document
 *   containing a disabled block will fail schema validation on load. Only
 *   disable blocks that never reached users' documents, or re-enable the flag
 *   to restore access.
 * - The `embed` store extension also registers the linked/synced doc schemas
 *   for backward compatibility; to fully disable doc embeds, disable both
 *   `embed` and `embed-doc`.
 * - `latex` controls both the latex block and inline latex.
 * - `frame` also controls the frame panel fragment.
 */
export const OPTIONAL_BLOCKS = [
  'attachment',
  'bookmark',
  'callout',
  'code',
  'data-view',
  'database',
  'divider',
  'edgeless-text',
  'embed',
  'embed-doc',
  'frame',
  'image',
  'latex',
  'list',
  'surface-ref',
  'table',
  // gfx modules
  'brush',
  'mindmap',
  'template',
  'link',
  'wardley',
  'edgy',
  'cynefin-estuarine',
  'bpmn',
] as const;

export type OptionalBlock = (typeof OPTIONAL_BLOCKS)[number];

/** Map of optional block -> enabled. Missing keys default to enabled. */
export type BlockFlags = Partial<Record<OptionalBlock, boolean>>;

export function isBlockEnabled(
  flags: BlockFlags | undefined,
  block: OptionalBlock
): boolean {
  return flags?.[block] !== false;
}
