declare module 'roughjs' {
  import type { RoughCanvas } from 'roughjs/bin/canvas';
  import type { Config } from 'roughjs/bin/core';
  import type { RoughGenerator } from 'roughjs/bin/generator';
  import type { RoughSVG } from 'roughjs/bin/svg';
  declare const _default: {
    canvas(canvas: HTMLCanvasElement, config?: Config | undefined): RoughCanvas;
    svg(svg: SVGSVGElement, config?: Config | undefined): RoughSVG;
    generator(config?: Config | undefined): RoughGenerator;
    newSeed(): number;
  };
  export default _default;
}
