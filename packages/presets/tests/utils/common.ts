export function wait(time: number = 0) {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      setTimeout(resolve, time);
    });
  });
}
