import type { Service } from '../__internal__/index.js';

export class CodeBlockService implements Service {
  hljs: any;
  isLoaded = false;
  load = async () => {
    console.log('loading highlight...');
    // @ts-ignore
    this.hljs = await import('highlight.js');
    console.log('done!');
  };
}

export default CodeBlockService;
