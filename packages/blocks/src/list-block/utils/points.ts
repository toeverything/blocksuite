import { html } from 'lit';

export const point1 = () => {
  return html`<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="2" fill="#7389FD" />
  </svg> `;
};

export const point2 = () => {
  return html` <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M12 13.5C12.8284 13.5 13.5 12.8284 13.5 12C13.5 11.1716 12.8284 10.5 12 10.5C11.1716 10.5 10.5 11.1716 10.5 12C10.5 12.8284 11.1716 13.5 12 13.5ZM12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z"
      fill="#7389FD"
    />
  </svg>`;
};
export const point3 = () => {
  return html`<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M11.6056 10.1634C11.8234 9.94555 12.1766 9.94555 12.3944 10.1634L13.8366 11.6056C14.0545 11.8234 14.0545 12.1766 13.8366 12.3944L12.3944 13.8366C12.1766 14.0545 11.8234 14.0545 11.6056 13.8366L10.1634 12.3944C9.94555 12.1766 9.94555 11.8234 10.1634 11.6056L11.6056 10.1634Z"
      fill="#7389FD"
    />
  </svg> `;
};
export const point4 = () => {
  return html`<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M13.4422 12L12 10.5578L10.5578 12L12 13.4422L13.4422 12ZM12.3944 10.1634C12.1766 9.94555 11.8234 9.94555 11.6056 10.1634L10.1634 11.6056C9.94555 11.8234 9.94555 12.1766 10.1634 12.3944L11.6056 13.8366C11.8234 14.0545 12.1766 14.0545 12.3944 13.8366L13.8366 12.3944C14.0545 12.1766 14.0545 11.8234 13.8366 11.6056L12.3944 10.1634Z"
      fill="#7389FD"
    />
  </svg> `;
};

export const points = [point1(), point2(), point3(), point4()];
