import { html, render } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

let toastContainer: HTMLDivElement | null = null;

const updateComplete = () => new Promise(r => requestAnimationFrame(r));

const createToastContainer = async () => {
  render(
    html`<div
      data-toast-container="true"
      style=${styleMap({
        position: 'fixed',
        zIndex: 9999,
        top: '16px',
        left: '16px',
        right: '16px',
        bottom: '78px',
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column-reverse',
        alignItems: 'center',
      })}
    ></div>`,
    document.body
  );
  await updateComplete();
  return document.querySelector(
    '[data-toast-container="true"]'
  ) as HTMLDivElement;
};

/**
 * @example
 * ```ts
 * toast('Hello World');
 * ```
 */
export const toast = async (message: string, duration = 2500) => {
  if (!toastContainer) {
    toastContainer = await createToastContainer();
  }

  render(
    html`<div
      style=${styleMap({
        maxWidth: '480px',
        textAlign: 'center',
        fontFamily: 'var(--affine-font-family)',
        fontSize: 'var(--affine-font-sm)',
        padding: '6px 12px',
        margin: '10px 0 0 0',
        color: 'var(--affine-white)',
        background: 'var(--affine-tooltip)',
        boxShadow: 'var(--affine-float-button-shadow)',
        borderRadius: '10px',
        transition: 'all 230ms cubic-bezier(0.21, 1.02, 0.73, 1)',
        opacity: '0',
      })}
    >
      ${message}
    </div>`,
    toastContainer
  );

  await updateComplete();
  const element = toastContainer.lastElementChild as HTMLDivElement;

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
