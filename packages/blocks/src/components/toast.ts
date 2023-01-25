import { css, html, type TemplateResult } from 'lit';

let ToastContainer: HTMLDivElement | null = null;

/**
 * DO NOT USE FOR USER INPUT
 * See https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro/35385518#35385518
 */
const htmlToElement = <T extends ChildNode>(html: string | TemplateResult) => {
  const template = document.createElement('template');
  if (typeof html === 'string') {
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
  } else {
    const { strings, values } = html;
    const v = [...values, '']; // + last empty part
    const htmlString = strings.reduce((acc, cur, i) => acc + cur + v[i], '');
    template.innerHTML = htmlString;
  }
  return template.content.firstChild as T;
};

const createToastContainer = () => {
  const styles = css`
    position: fixed;
    z-index: 9999;
    top: 16px;
    left: 16px;
    right: 16px;
    bottom: 78px;
    pointer-events: none;
    display: flex;
    flex-direction: column-reverse;
    align-items: center;
  `;
  const template = html`<div style="${styles}"></div>`;
  const element = htmlToElement<HTMLDivElement>(template);
  document.body.appendChild(element);
  return element;
};

/**
 * @example
 * ```ts
 * toast('Hello World');
 * ```
 */
export const toast = (message: string, duration = 2500) => {
  if (!ToastContainer) {
    ToastContainer = createToastContainer();
  }

  const styles = css`
    max-width: 480px;
    text-align: center;
    font-family: var(--affine-font-family);
    font-size: var(--affine-font-sm);
    padding: 6px 12px;
    margin: 10px 0 0 0;
    color: var(--affine-tooltip-color);
    background: var(--affine-tooltip-background);
    box-shadow: var(--affine-tooltip-shadow);
    border-radius: 10px;
    transition: all 230ms cubic-bezier(0.21, 1.02, 0.73, 1);
    opacity: 0;
  `;

  const template = html`<div style="${styles}"></div>`;
  const element = htmlToElement<HTMLDivElement>(template);
  // message is not trusted
  element.textContent = message;
  ToastContainer.appendChild(element);

  const fadeIn = [
    {
      opacity: 0,
    },
    { opacity: 1 },
  ];
  const options = {
    duration: 230,
    easing: 'cubic-bezier(0.21, 1.02, 0.73, 1)',
    fill: 'forwards' as const,
  }; // satisfies KeyframeAnimationOptions;
  element.animate(fadeIn, options);

  setTimeout(async () => {
    const fadeOut = fadeIn.reverse();
    const animation = element.animate(fadeOut, options);
    await animation.finished;
    element.style.maxHeight = '0';
    element.style.margin = '0';
    element.style.padding = '0';
    element.addEventListener(
      'transitionend',
      () => {
        element.remove();
      },
      {
        once: true,
      }
    );
  }, duration);
  return element;
};
