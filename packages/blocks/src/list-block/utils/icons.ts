import { html } from 'lit';

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
      <rect x="3" y="5" width="14" height="14" rx="4" fill="#1E96EB" />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M13.4242 9.57576C13.6585 9.81007 13.6585 10.19 13.4242 10.4243L9.42417 14.4243C9.1977 14.6508 8.83329 14.6594 8.5963 14.444L6.5963 12.6258C6.35111 12.4029 6.33304 12.0234 6.55594 11.7782C6.77885 11.533 7.15832 11.515 7.40351 11.7379L8.98018 13.1712L12.5756 9.57576C12.81 9.34145 13.1899 9.34145 13.4242 9.57576Z"
        fill="white"
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
        d="M13 6.2H7C5.4536 6.2 4.2 7.4536 4.2 9V15C4.2 16.5464 5.4536 17.8 7 17.8H13C14.5464 17.8 15.8 16.5464 15.8 15V9C15.8 7.4536 14.5464 6.2 13 6.2ZM7 5C4.79086 5 3 6.79086 3 9V15C3 17.2091 4.79086 19 7 19H13C15.2091 19 17 17.2091 17 15V9C17 6.79086 15.2091 5 13 5H7Z"
        fill="#77757D"
      />
    </svg>
  `;
};

export const points = [point1(), point2(), point3(), point4()];
