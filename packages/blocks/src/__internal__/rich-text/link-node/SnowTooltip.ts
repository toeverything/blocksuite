// Ported from https://github.com/quilljs/quill/blob/6fb1532fbdcfb2d5df4830a81e707160a72da47b/themes/snow.ts
// @ts-nocheck
import Emitter from 'quill/core/emitter';
import { Range } from 'quill/core/selection';
import LinkBlot from 'quill/formats/link';
import { BaseTooltip } from 'quill/themes/base';

import style from './tooltip.css';

export class SnowTooltip extends BaseTooltip {
  static TEMPLATE = [
    `<style type="text/css">${style}</style>`,
    '<a class="ql-preview" rel="noopener noreferrer" target="_blank" href="about:blank"></a>',
    '<input type="text" data-formula="e=mc^2" data-link="https://quilljs.com" data-video="Embed URL">',
    '<a class="ql-action"></a>',
    '<a class="ql-remove"></a>',
  ].join('');

  preview = this.root.querySelector('a.ql-preview');

  listen() {
    super.listen();
    this.root.querySelector('a.ql-action').addEventListener('click', event => {
      if (this.root.classList.contains('ql-editing')) {
        this.save();
      } else {
        this.edit('link', this.preview.textContent);
      }
      event.preventDefault();
    });
    this.root.querySelector('a.ql-remove').addEventListener('click', event => {
      if (this.linkRange != null) {
        const range = this.linkRange;
        this.restoreFocus();
        this.quill.formatText(range, 'link', false, Emitter.sources.USER);
        delete this.linkRange;
      }
      event.preventDefault();
      this.hide();
    });
    this.quill.on(
      Emitter.events.SELECTION_CHANGE,
      (range, oldRange, source) => {
        if (range == null) return;
        if (range.length === 0 && source === Emitter.sources.USER) {
          const [link, offset] = this.quill.scroll.descendant(
            // @ts-expect-error
            LinkBlot,
            range.index
          );
          if (link != null) {
            this.linkRange = new Range(range.index - offset, link.length());
            const preview = LinkBlot.formats(link.domNode);
            this.preview.textContent = preview;
            this.preview.setAttribute('href', preview);
            this.show();
            this.position(this.quill.getBounds(this.linkRange));
            return;
          }
        } else {
          delete this.linkRange;
        }
        this.hide();
      }
    );
  }

  show() {
    super.show();
    this.root.removeAttribute('data-mode');
  }
}
