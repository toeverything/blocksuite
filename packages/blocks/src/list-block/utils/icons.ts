import { html, svg } from 'lit';

const Level1Icon = html`
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="7" cy="12" r="3" fill="currentColor" />
  </svg>
`;

const Level2Icon = html`
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M7 14.25C8.24264 14.25 9.25 13.2426 9.25 12C9.25 10.7574 8.24264 9.75 7 9.75C5.75736 9.75 4.75 10.7574 4.75 12C4.75 13.2426 5.75736 14.25 7 14.25ZM7 15C8.65685 15 10 13.6569 10 12C10 10.3431 8.65685 9 7 9C5.34315 9 4 10.3431 4 12C4 13.6569 5.34315 15 7 15Z"
      fill="currentColor"
    />
  </svg>
`;

const Level3Icon = html`
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6.40841 9.24504C6.73514 8.91832 7.26486 8.91832 7.59159 9.24505L9.75496 11.4084C10.0817 11.7351 10.0817 12.2649 9.75495 12.5916L7.59159 14.755C7.26486 15.0817 6.73514 15.0817 6.40841 14.755L4.24504 12.5916C3.91832 12.2649 3.91832 11.7351 4.24505 11.4084L6.40841 9.24504Z"
      fill="currentColor"
    />
  </svg>
`;

const Level4Icon = html`
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M9.16336 12L7 9.83664L4.83664 12L7 14.1634L9.16336 12ZM7.59159 9.24505C7.26486 8.91832 6.73514 8.91832 6.40841 9.24504L4.24505 11.4084C3.91832 11.7351 3.91832 12.2649 4.24504 12.5916L6.40841 14.755C6.73514 15.0817 7.26486 15.0817 7.59159 14.755L9.75495 12.5916C10.0817 12.2649 10.0817 11.7351 9.75496 11.4084L7.59159 9.24505Z"
      fill="currentColor"
    />
  </svg>
`;

const toggleSVG = svg`
  <path
    d="M16.5 11.134C17.1667 11.5189 17.1667 12.4811 16.5 12.866L9 17.1962C8.33333 17.5811 7.5 17.0999 7.5 16.3301L7.5 7.66989C7.5 6.90009 8.33333 6.41896 9 6.80386L16.5 11.134Z"
    fill="#77757D"
  />
`;

export const toggleRight = html`
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    ${toggleSVG}
  </svg>
`;

export const toggleDown = html`
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    style="transform: rotate(90deg)"
    xmlns="http://www.w3.org/2000/svg"
  >
    ${toggleSVG}
  </svg>
`;

export const checkboxChecked = () => {
  return html`
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M3.25 6C3.25 4.48122 4.48122 3.25 6 3.25H18C19.5188 3.25 20.75 4.48122 20.75 6V18C20.75 19.5188 19.5188 20.75 18 20.75H6C4.48122 20.75 3.25 19.5188 3.25 18V6ZM16.5303 9.53033C16.8232 9.23744 16.8232 8.76256 16.5303 8.46967C16.2374 8.17678 15.7626 8.17678 15.4697 8.46967L10.5 13.4393L9.03033 11.9697C8.73744 11.6768 8.26256 11.6768 7.96967 11.9697C7.67678 12.2626 7.67678 12.7374 7.96967 13.0303L9.96967 15.0303C10.2626 15.3232 10.7374 15.3232 11.0303 15.0303L16.5303 9.53033Z"
        fill="#1E96EB"
      />
    </svg>
  `;
};

export const checkboxUnchecked = () => {
  return html`
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M6 3.25C4.48122 3.25 3.25 4.48122 3.25 6V18C3.25 19.5188 4.48122 20.75 6 20.75H18C19.5188 20.75 20.75 19.5188 20.75 18V6C20.75 4.48122 19.5188 3.25 18 3.25H6ZM4.75 6C4.75 5.30964 5.30964 4.75 6 4.75H18C18.6904 4.75 19.25 5.30964 19.25 6V18C19.25 18.6904 18.6904 19.25 18 19.25H6C5.30964 19.25 4.75 18.6904 4.75 18V6Z"
        fill="currentColor"
      />
    </svg>
  `;
};

export const playCheckAnimation = async (
  refElement: Element,
  { left = 0, size = 20 }: { left?: number; size?: number } = {}
) => {
  const sparkingEl = document.createElement('div');
  sparkingEl.classList.add('affine-check-animation');
  if (size < 20) {
    console.warn('If the size is less than 20, the animation may be abnormal.');
  }
  sparkingEl.style.cssText = `
    position: absolute;
    width: ${size}px;
    height: ${size}px;
    border-radius: 50%;
  `;
  sparkingEl.style.left = `${left}px`;
  refElement.append(sparkingEl);

  await sparkingEl.animate(
    [
      {
        boxShadow:
          '0 -18px 0 -8px #1e96eb, 16px -8px 0 -8px #1e96eb, 16px 8px 0 -8px #1e96eb, 0 18px 0 -8px #1e96eb, -16px 8px 0 -8px #1e96eb, -16px -8px 0 -8px #1e96eb',
      },
    ],
    { duration: 240, easing: 'ease', fill: 'forwards' }
  ).finished;
  await sparkingEl.animate(
    [
      {
        boxShadow:
          '0 -36px 0 -10px transparent, 32px -16px 0 -10px transparent, 32px 16px 0 -10px transparent, 0 36px 0 -10px transparent, -32px 16px 0 -10px transparent, -32px -16px 0 -10px transparent',
      },
    ],
    { duration: 360, easing: 'ease', fill: 'forwards' }
  ).finished;

  sparkingEl.remove();
};

export const BulletIcons = [Level1Icon, Level2Icon, Level3Icon, Level4Icon];
