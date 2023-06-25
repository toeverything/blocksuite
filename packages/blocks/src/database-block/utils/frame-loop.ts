export const startFrameLoop = (fn: (delta: number) => void) => {
  let handle = 0;
  let preTime = 0;
  const run = () => {
    handle = requestAnimationFrame(time => {
      try {
        fn(time - preTime);
      } finally {
        preTime = time;
        run();
      }
    });
  };
  run();
  return () => {
    cancelAnimationFrame(handle);
  };
};
