export function isSelectionBackwards(selection: Selection): boolean {
  let backwards = false;
  if (!selection.isCollapsed && selection.anchorNode && selection.focusNode) {
    const range = document.createRange();
    range.setStart(selection.anchorNode, selection.anchorOffset);
    range.setEnd(selection.focusNode, selection.focusOffset);
    backwards = range.collapsed;
    range.detach();
  }
  return backwards;
}
