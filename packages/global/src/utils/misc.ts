export function launchIntoFullscreen(element: Element) {
  if (element.requestFullscreen) {
    element.requestFullscreen();
    // @ts-ignore
  } else if (element.mozRequestFullScreen) {
    // Firefox
    // @ts-ignore
    element.mozRequestFullScreen();
    // @ts-ignore
  } else if (element.webkitRequestFullscreen) {
    // Chrome, Safari and Opera
    // @ts-ignore
    element.webkitRequestFullscreen();
    // @ts-ignore
  } else if (element.msRequestFullscreen) {
    // IE/Edge
    // @ts-ignore
    element.msRequestFullscreen();
  }
}

export const createDelayHoverSignal = (
  abortController: AbortController,
  hoverDelay = 300
) => {
  let hoverState = false;
  let hoverTimeout = 0;

  const onHover = () => {
    if (abortController.signal.aborted) {
      console.warn(
        'AbortSignal has been aborted! Did you forget to remove the listener?'
      );
    }
    if (!hoverState) {
      hoverState = true;
      // abortController.signal.dispatchEvent(new Event('hover'));
    }
    clearTimeout(hoverTimeout);
  };
  const onHoverLeave = () => {
    if (abortController.signal.aborted) {
      console.warn(
        'AbortSignal has been aborted! Did you forget to remove the listener?'
      );
    }
    clearTimeout(hoverTimeout);
    hoverTimeout = window.setTimeout(() => {
      abortController.abort();
      hoverState = false;
      // abortController.signal.dispatchEvent(new Event('hoverleave'));
    }, hoverDelay);
  };
  return {
    onHover,
    onHoverLeave,
  };
};
