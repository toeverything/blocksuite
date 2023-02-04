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

export const toggleRight = (enabled = true) => {
  return html`
    <svg
      xmlns="http://www.w3.org/2000/svg"
      data-is-toggle-icon="true"
      width="1em"
      height="1em"
      viewBox="0 0 20 20"
    >
      <path
        data-is-toggle-icon="true"
        fill="currentColor"
        opacity="${!enabled ? '0.6' : '1'}"
        d="m15.795 11.272l-8 5A1.5 1.5 0 0 1 5.5 15V5a1.5 1.5 0 0 1 2.295-1.272l8 5a1.5 1.5 0 0 1 0 2.544Z"
      />
    </svg>
  `;
};
export const toggleDown = () => {
  return html`
    <svg
      xmlns="http://www.w3.org/2000/svg"
      data-is-toggle-icon="true"
      width="1em"
      height="1em"
      viewBox="0 0 20 20"
      @mousedown="${(e: MouseEvent) => {
        // console.log('preventing def svg');
        // e.preventDefault();
      }}"
    >
      <path
        data-is-toggle-icon="true"
        fill="currentColor"
        d="m8.728 15.795l-5-8A1.5 1.5 0 0 1 5 5.5h10a1.5 1.5 0 0 1 1.272 2.295l-5 8a1.5 1.5 0 0 1-2.544 0Z"
      />
    </svg>
  `;
};

export const chevronCircleRight = (enabled = true) => {
  return html`
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 512 512"
    >
      <path
        fill="currentColor"
        opacity="${!enabled ? '0.6' : '1'}"
        d="M256 8c137 0 248 111 248 248S393 504 256 504S8 393 8 256S119 8 256 8zm113.9 231L234.4 103.5c-9.4-9.4-24.6-9.4-33.9 0l-17 17c-9.4 9.4-9.4 24.6 0 33.9L285.1 256L183.5 357.6c-9.4 9.4-9.4 24.6 0 33.9l17 17c9.4 9.4 24.6 9.4 33.9 0L369.9 273c9.4-9.4 9.4-24.6 0-34z"
      />
    </svg>
  `;
};
export const chevronCircleDown = () => {
  return html`
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 512 512"
    >
      <path
        fill="currentColor"
        d="M504 256c0 137-111 248-248 248S8 393 8 256S119 8 256 8s248 111 248 248zM273 369.9l135.5-135.5c9.4-9.4 9.4-24.6 0-33.9l-17-17c-9.4-9.4-24.6-9.4-33.9 0L256 285.1L154.4 183.5c-9.4-9.4-24.6-9.4-33.9 0l-17 17c-9.4 9.4-9.4 24.6 0 33.9L239 369.9c9.4 9.4 24.6 9.4 34 0z"
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
