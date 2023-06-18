export const getRect = (ele: HTMLElement, scale: number) => {
  const rect = ele.getBoundingClientRect();
  return {
    left: rect.left / scale,
    right: rect.right / scale,
    top: rect.top / scale,
    bottom: rect.bottom / scale,
    width: rect.width / scale,
    height: rect.height / scale,
  };
};
