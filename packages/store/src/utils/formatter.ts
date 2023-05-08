import { BaseBlockModel } from '../base.js';

function isBaseBlockModel(a: unknown): a is BaseBlockModel {
  return a instanceof BaseBlockModel;
}

/**
 * Ported from https://github.com/vuejs/core/blob/main/packages/runtime-core/src/customFormatter.ts
 *
 * See [Custom Object Formatters in Chrome DevTools](https://docs.google.com/document/d/1FTascZXT9cxfetuPRT2eXPQKXui4nWFivUnS_335T3U)
 */
function initCustomFormatter() {
  if (
    !(process.env.NODE_ENV === 'development') ||
    typeof window === 'undefined'
  ) {
    return;
  }

  const bannerStyle = {
    style:
      'color: #eee; background: #3F6FDB; margin-right: 5px; padding: 2px; border-radius: 4px',
  };
  const typeStyle = {
    style:
      'color: #eee; background: #DB6D56; margin-right: 5px; padding: 2px; border-radius: 4px',
  };

  // custom formatter for Chrome
  // https://www.mattzeunert.com/2016/02/19/custom-chrome-devtools-object-formatters.html
  const formatter = {
    header(obj: unknown, config = { expand: false }) {
      if (!isBaseBlockModel(obj) || config.expand) {
        return null;
      }

      return [
        'div',
        {},
        ['span', bannerStyle, 'BaseBlockModel'],
        ['span', typeStyle, obj.flavour],
        obj.text?.toString(),
      ];
    },
    hasBody(obj: unknown) {
      return true;
    },
    body(obj: unknown) {
      return ['object', { object: obj, config: { expand: true } }];
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).devtoolsFormatters) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).devtoolsFormatters.push(formatter);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).devtoolsFormatters = [formatter];
  }
}

initCustomFormatter();
