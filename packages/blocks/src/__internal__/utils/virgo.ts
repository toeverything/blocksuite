import type { VEditor } from '@blocksuite/virgo';

// When the user selects a range, check if it matches the previous selection.
// If it does, apply the marks from the previous selection.
// If it does not, remove the marks from the previous selection.
export function clearMarksOnDiscontinuousInput(vEditor: VEditor): void {
  let vRange = vEditor.getVRange();
  const dispose = vEditor.slots.vRangeUpdated.on(([r, t]) => {
    if (
      vRange &&
      r &&
      ((t === 'native' && r.index === vRange.index) ||
        (t !== 'native' && r.index === vRange.index + 1))
    ) {
      vRange = r;
    } else {
      vEditor.resetMarks();
      dispose.dispose();
    }
  });
}
