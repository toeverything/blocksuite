import { html, svg } from 'lit';

export const point1 = () => {
  return html`
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="6" cy="12" r="2" fill="currentColor" />
    </svg>
  `;
};

export const point2 = () => {
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
        d="M6 13.5C6.82843 13.5 7.5 12.8284 7.5 12C7.5 11.1716 6.82843 10.5 6 10.5C5.17157 10.5 4.5 11.1716 4.5 12C4.5 12.8284 5.17157 13.5 6 13.5ZM6 14C7.10457 14 8 13.1046 8 12C8 10.8954 7.10457 10 6 10C4.89543 10 4 10.8954 4 12C4 13.1046 4.89543 14 6 14Z"
        fill="currentColor"
      />
    </svg>
  `;
};

export const point3 = () => {
  return html`
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5.60561 10.1634C5.82342 9.94555 6.17658 9.94555 6.39439 10.1634L7.83664 11.6056C8.05445 11.8234 8.05445 12.1766 7.83664 12.3944L6.39439 13.8366C6.17658 14.0545 5.82342 14.0545 5.60561 13.8366L4.16336 12.3944C3.94555 12.1766 3.94555 11.8234 4.16336 11.6056L5.60561 10.1634Z"
        fill="currentColor"
      />
    </svg>
  `;
};

export const point4 = () => {
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
        d="M7.44224 12L6 10.5578L4.55776 12L6 13.4422L7.44224 12ZM6.39439 10.1634C6.17658 9.94555 5.82342 9.94555 5.60561 10.1634L4.16336 11.6056C3.94555 11.8234 3.94555 12.1766 4.16336 12.3944L5.60561 13.8366C5.82342 14.0545 6.17658 14.0545 6.39439 13.8366L7.83664 12.3944C8.05445 12.1766 8.05445 11.8234 7.83664 11.6056L6.39439 10.1634Z"
        fill="currentColor"
      />
    </svg>
  `;
};

const toggleSVG = svg`<path
d="M16.5 11.134C17.1667 11.5189 17.1667 12.4811 16.5 12.866L9 17.1962C8.33333 17.5811 7.5 17.0999 7.5 16.3301L7.5 7.66989C7.5 6.90009 8.33333 6.41896 9 6.80386L16.5 11.134Z"
fill="#77757D"
/>`;

export const toggleRight = html`
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    ${toggleSVG}
  </svg>
`;

export const toggleDown = html`
  <svg
    width="20"
    height="20"
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
      fill="none"
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
  refElement.appendChild(sparkingEl);

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

export const points = [point1(), point2(), point3(), point4()];
