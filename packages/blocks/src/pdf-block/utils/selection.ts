export const isEmptyRange = (
  selection: Selection | null
): selection is null => {
  return (
    !selection ||
    selection.isCollapsed ||
    !selection.anchorNode ||
    !selection.focusNode
  );
};
