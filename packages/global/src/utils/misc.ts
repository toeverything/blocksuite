export function launchIntoFullscreen(element: HTMLElement) {
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
