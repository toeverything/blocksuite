import { html } from 'lit';

export const point1 = () => {
  return html`
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="2" />
    </svg>
  `;
};

export const point2 = () => {
  return html`
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M12 13.5C12.8284 13.5 13.5 12.8284 13.5 12C13.5 11.1716 12.8284 10.5 12 10.5C11.1716 10.5 10.5 11.1716 10.5 12C10.5 12.8284 11.1716 13.5 12 13.5ZM12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z"
      />
    </svg>
  `;
};
export const point3 = () => {
  return html`
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path
        d="M11.6056 10.1634C11.8234 9.94555 12.1766 9.94555 12.3944 10.1634L13.8366 11.6056C14.0545 11.8234 14.0545 12.1766 13.8366 12.3944L12.3944 13.8366C12.1766 14.0545 11.8234 14.0545 11.6056 13.8366L10.1634 12.3944C9.94555 12.1766 9.94555 11.8234 10.1634 11.6056L11.6056 10.1634Z"
      />
    </svg>
  `;
};
export const point4 = () => {
  return html`
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M13.4422 12L12 10.5578L10.5578 12L12 13.4422L13.4422 12ZM12.3944 10.1634C12.1766 9.94555 11.8234 9.94555 11.6056 10.1634L10.1634 11.6056C9.94555 11.8234 9.94555 12.1766 10.1634 12.3944L11.6056 13.8366C11.8234 14.0545 12.1766 14.0545 12.3944 13.8366L13.8366 12.3944C14.0545 12.1766 14.0545 11.8234 13.8366 11.6056L12.3944 10.1634Z"
        fill="#7389FD"
      />
    </svg>
  `;
};
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
        d="M7 4C5.34315 4 4 5.34315 4 7V17C4 18.6569 5.34315 20 7 20H17C18.6569 20 20 18.6569 20 17V7C20 5.34315 18.6569 4 17 4H7ZM17.5665 9.56473C17.8785 9.25181 17.8776 8.74528 17.5647 8.43336C17.2518 8.12144 16.7453 8.12225 16.4334 8.43517L10.3547 14.5333L7.56666 11.7352C7.2548 11.4222 6.74827 11.4213 6.43529 11.7331C6.1223 12.045 6.12139 12.5515 6.43325 12.8645L9.64626 16.0891C10.037 16.4813 10.672 16.4814 11.0629 16.0893L17.5665 9.56473Z"
        fill="#A6ABB7"
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
        d="M17 5.6H7C6.2268 5.6 5.6 6.2268 5.6 7V17C5.6 17.7732 6.2268 18.4 7 18.4H17C17.7732 18.4 18.4 17.7732 18.4 17V7C18.4 6.2268 17.7732 5.6 17 5.6ZM7 4C5.34315 4 4 5.34315 4 7V17C4 18.6569 5.34315 20 7 20H17C18.6569 20 20 18.6569 20 17V7C20 5.34315 18.6569 4 17 4H7Z"
        fill="#A6ABB7"
      />
    </svg>
  `;
};

export const points = [point1(), point2(), point3(), point4()];
