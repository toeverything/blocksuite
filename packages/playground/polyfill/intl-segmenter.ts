if (Intl.Segmenter === undefined) {
  void import('intl-segmenter-polyfill-rs').then(({ Segmenter }) => {
    Object.defineProperty(Intl, 'Segmenter', {
      configurable: true,
      value: Segmenter,
      writable: true,
    });
  });
}
