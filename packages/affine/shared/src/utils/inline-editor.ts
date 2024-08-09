import type { InlineEditor } from '@blocksuite/inline';

// When the user selects a range, check if it matches the previous selection.
// If it does, apply the marks from the previous selection.
// If it does not, remove the marks from the previous selection.
export function clearMarksOnDiscontinuousInput(
  inlineEditor: InlineEditor
): void {
  let inlineRange = inlineEditor.getInlineRange();
  const dispose = inlineEditor.slots.inlineRangeUpdate.on(([r, s]) => {
    if (
      inlineRange &&
      r &&
      ((!s && r.index === inlineRange.index) ||
        (s && r.index === inlineRange.index + 1))
    ) {
      inlineRange = r;
    } else {
      inlineEditor.resetMarks();
      dispose.dispose();
    }
  });
}
