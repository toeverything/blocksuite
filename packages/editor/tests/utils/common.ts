export function wait(time: number = 100) {
  return new Promise(resolve => {
    setTimeout(resolve, time);
  });
}
