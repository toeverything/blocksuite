import { css, html } from 'lit';

import type { BookmarkBlockType } from './bookmark-model.js';

export const BookmarkWidth: Record<BookmarkBlockType, number> = {
  horizontal: 752,
  list: 752,
  vertical: 364,
  cube: 170,
};

export const BookmarkHeight: Record<BookmarkBlockType, number> = {
  horizontal: 116,
  list: 46,
  vertical: 390,
  cube: 114,
};

export const styles = css`
  .affine-bookmark-card {
    margin: 0 auto;
    box-sizing: border-box;
    display: flex;
    width: 100%;
    max-width: ${BookmarkWidth['horizontal']}px;
    height: ${BookmarkHeight['horizontal']}px;

    border-radius: 8px;
    border: 1px solid var(--affine-background-tertiary-color);

    opacity: var(--add, 1);
    background: var(--affine-background-primary-color);
    box-shadow: var(--affine-shadow-1);
    user-select: none;
  }

  .affine-bookmark-content {
    width: 536px;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-self: stretch;
    gap: 4px;
    padding: 12px;
    border-radius: var(--1, 0px);
    opacity: var(--add, 1);
  }

  .affine-bookmark-content-title {
    display: flex;
    flex-direction: row;
    gap: 8px;
    align-items: center;

    align-self: stretch;
    padding: var(--1, 0px);
    border-radius: var(--1, 0px);
    opacity: var(--add, 1);
  }

  .affine-bookmark-content-title-icon {
    display: flex;
    width: 16px;
    height: 16px;
    justify-content: center;
    align-items: center;
  }

  .affine-bookmark-content-title-icon img,
  .affine-bookmark-content-title-icon object,
  .affine-bookmark-content-title-icon svg {
    width: 16px;
    height: 16px;
    fill: var(--affine-background-primary-color);
  }

  .affine-bookmark-content-title-text {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;

    word-break: break-word;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--affine-text-primary-color);

    font-family: var(--affine-font-family);
    font-size: var(--affine-font-sm);
    font-style: normal;
    font-weight: 600;
    line-height: 22px;
  }

  .affine-bookmark-content-description {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;

    flex-grow: 1;

    white-space: normal;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--affine-text-primary-color);

    font-family: var(--affine-font-family);
    font-size: var(--affine-font-xs);
    font-style: normal;
    font-weight: 400;
    line-height: 20px;
  }

  .affine-bookmark-content-url {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 4px;
  }
  .affine-bookmark-content-url > span {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;

    word-break: break-all;
    white-space: normal;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--affine-text-secondary-color);

    font-family: var(--affine-font-family);
    font-size: var(--affine-font-xs);
    font-style: normal;
    font-weight: 400;
    line-height: 20px;
  }
  .affine-bookmark-content-url-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 12px;
    height: 12px;
  }
  .affine-bookmark-content-url-icon svg {
    height: 12px;
    width: 12px;
  }

  .affine-bookmark-banner {
    margin: 12px 12px 0px 0px;
    width: 204px;
    height: 102px;
    opacity: var(--add, 1);
  }

  .affine-bookmark-banner img,
  .affine-bookmark-banner object,
  .affine-bookmark-banner svg {
    width: 204px;
    height: 102px;
    object-fit: fill;
    border-radius: 4px 4px var(--1, 0px) var(--1, 0px);
  }

  .affine-bookmark-card.loading {
    .affine-bookmark-content-title-text {
      color: var(--affine-placeholder-color);
    }
  }

  .affine-bookmark-card.list {
    height: ${BookmarkHeight['list']}px;

    .affine-bookmark-content {
      width: 100%;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }

    .affine-bookmark-content-title {
      width: 536px;
    }

    .affine-bookmark-content-url {
      width: 204px;
      justify-content: flex-end;
    }

    .affine-bookmark-content-description {
      display: none;
    }

    .affine-bookmark-banner {
      display: none;
    }
  }

  .affine-bookmark-card.vertical {
    flex-direction: column-reverse;
    height: ${BookmarkHeight['vertical']}px;
    width: ${BookmarkWidth['vertical']}px;

    .affine-bookmark-content {
      width: 100%;
    }

    .affine-bookmark-content-description {
      -webkit-line-clamp: 6;
    }

    .affine-bookmark-banner {
      width: 340px;
      height: 170px;
      margin-left: 12px;
    }

    .affine-bookmark-banner img,
    .affine-bookmark-banner object,
    .affine-bookmark-banner svg {
      width: 340px;
      height: 170px;
    }
  }

  .affine-bookmark-card.cube {
    height: ${BookmarkHeight['cube']}px;
    width: ${BookmarkWidth['cube']}px;

    .affine-bookmark-content {
      width: 100%;
      flex-direction: column;
      align-items: flex-start;
      justify-content: space-between;
    }

    .affine-bookmark-content-title {
      flex-direction: column;
      gap: 4px;
      align-items: flex-start;
    }

    .affine-bookmark-content-title-text {
      -webkit-line-clamp: 2;
    }

    .affine-bookmark-content-description {
      display: none;
    }

    .affine-bookmark-banner {
      display: none;
    }
  }
`;

export const LightLoadingIcon = html`<svg
  width="16"
  height="16"
  viewBox="0 0 16 16"
  xmlns="http://www.w3.org/2000/svg"
>
  <style xmlns="http://www.w3.org/2000/svg">
    .spinner {
      transform-origin: center;
      animation: spinner_animate 0.75s infinite linear;
    }
    @keyframes spinner_animate {
      100% {
        transform: rotate(360deg);
      }
    }
  </style>
  <path
    d="M14.6666 8.00004C14.6666 11.6819 11.6818 14.6667 7.99992 14.6667C4.31802 14.6667 1.33325 11.6819 1.33325 8.00004C1.33325 4.31814 4.31802 1.33337 7.99992 1.33337C11.6818 1.33337 14.6666 4.31814 14.6666 8.00004ZM3.30003 8.00004C3.30003 10.5957 5.40424 12.6999 7.99992 12.6999C10.5956 12.6999 12.6998 10.5957 12.6998 8.00004C12.6998 5.40436 10.5956 3.30015 7.99992 3.30015C5.40424 3.30015 3.30003 5.40436 3.30003 8.00004Z"
    fill="black"
    fill-opacity="0.1"
  />
  <path
    d="M13.6833 8.00004C14.2263 8.00004 14.674 7.55745 14.5942 7.02026C14.5142 6.48183 14.3684 5.954 14.1591 5.44882C13.8241 4.63998 13.333 3.90505 12.714 3.286C12.0949 2.66694 11.36 2.17588 10.5511 1.84084C10.046 1.63159 9.51812 1.48576 8.9797 1.40576C8.44251 1.32595 7.99992 1.77363 7.99992 2.31671C7.99992 2.85979 8.44486 3.28974 8.9761 3.40253C9.25681 3.46214 9.53214 3.54746 9.79853 3.65781C10.3688 3.894 10.8869 4.2402 11.3233 4.67664C11.7598 5.11307 12.106 5.6312 12.3422 6.20143C12.4525 6.46782 12.5378 6.74315 12.5974 7.02386C12.7102 7.5551 13.1402 8.00004 13.6833 8.00004Z"
    fill="#1C9EE4"
    class="spinner"
  />
</svg>`;

export const DarkLoadingIcon = html`<svg
  width="16"
  height="16"
  viewBox="0 0 16 16"
  xmlns="http://www.w3.org/2000/svg"
>
  <style xmlns="http://www.w3.org/2000/svg">
    .spinner {
      transform-origin: center;
      animation: spinner_animate 0.75s infinite linear;
    }
    @keyframes spinner_animate {
      100% {
        transform: rotate(360deg);
      }
    }
  </style>
  <path
    d="M14.6666 8.00004C14.6666 11.6819 11.6818 14.6667 7.99992 14.6667C4.31802 14.6667 1.33325 11.6819 1.33325 8.00004C1.33325 4.31814 4.31802 1.33337 7.99992 1.33337C11.6818 1.33337 14.6666 4.31814 14.6666 8.00004ZM3.30003 8.00004C3.30003 10.5957 5.40424 12.6999 7.99992 12.6999C10.5956 12.6999 12.6998 10.5957 12.6998 8.00004C12.6998 5.40436 10.5956 3.30015 7.99992 3.30015C5.40424 3.30015 3.30003 5.40436 3.30003 8.00004Z"
    fill="white"
    fill-opacity="0.1"
  />
  <path
    d="M13.6833 8.00004C14.2263 8.00004 14.674 7.55745 14.5942 7.02026C14.5142 6.48183 14.3684 5.954 14.1591 5.44882C13.8241 4.63998 13.333 3.90505 12.714 3.286C12.0949 2.66694 11.36 2.17588 10.5511 1.84084C10.046 1.63159 9.51812 1.48576 8.9797 1.40576C8.44251 1.32595 7.99992 1.77363 7.99992 2.31671C7.99992 2.85979 8.44486 3.28974 8.9761 3.40253C9.25681 3.46214 9.53214 3.54746 9.79853 3.65781C10.3688 3.894 10.8869 4.2402 11.3233 4.67664C11.7598 5.11307 12.106 5.6312 12.3422 6.20143C12.4525 6.46782 12.5378 6.74315 12.5974 7.02386C12.7102 7.5551 13.1402 8.00004 13.6833 8.00004Z"
    fill="#1C9EE4"
    class="spinner"
  />
</svg>`;

export const LightBanner = html`<svg
  width="340"
  height="170"
  viewBox="0 0 340 170"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    d="M0.000108291 4C4.84837e-05 1.79086 1.79086 0 4 0H336C338.209 0 340 1.79086 340 4L340.005 170H0.00460238L0.000108291 4Z"
    fill="#F4F4F5"
  />
  <path
    d="M47.4226 181.578L133.723 53.5251C136.164 49.904 141.057 48.9089 144.718 51.2892L345.111 181.578H47.4226Z"
    fill="#C0BFC1"
  />
  <path
    d="M0.00305283 184.375L71.1716 78.1816C73.6115 74.5409 78.5267 73.5413 82.195 75.9397L248.044 184.375H0.00305283Z"
    fill="#E3E2E4"
  />
  <ellipse
    cx="19.6135"
    cy="19.8036"
    rx="19.6135"
    ry="19.8036"
    transform="matrix(1 0 2.70729e-05 1 38 17)"
    fill="#C0BFC1"
  />
</svg>`;

export const DarkBanner = html`<svg
  width="340"
  height="170"
  viewBox="0 0 340 170"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    d="M0.000108291 4C4.84837e-05 1.79086 1.79086 0 4 0H336C338.209 0 340 1.79086 340 4L340.005 170H0.00460238L0.000108291 4Z"
    fill="#252525"
  />
  <path
    d="M47.4226 181.578L133.723 53.5251C136.164 49.904 141.057 48.9089 144.718 51.2892L345.111 181.578H47.4226Z"
    fill="#3E3E3F"
  />
  <path
    d="M0.00305283 184.375L71.1716 78.1816C73.6115 74.5409 78.5267 73.5413 82.195 75.9397L248.044 184.375H0.00305283Z"
    fill="#727272"
  />
  <ellipse
    cx="19.6135"
    cy="19.8036"
    rx="19.6135"
    ry="19.8036"
    transform="matrix(1 0 2.70729e-05 1 38 17)"
    fill="#3E3E3F"
  />
</svg>`;

export const LightLargeHorizontalCardIcon = html`
  <svg
    width="70"
    height="32"
    viewBox="0 0 70 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="0.25" y="0.25" width="69.5" height="31.5" rx="3.75" fill="white" />
    <rect
      x="0.25"
      y="0.25"
      width="69.5"
      height="31.5"
      rx="3.75"
      stroke="#E3E2E4"
      stroke-width="0.5"
    />
    <rect x="4" y="4" width="21" height="3" rx="1.5" fill="#DBDBDB" />
    <rect x="4" y="11" width="34.1467" height="2" rx="1" fill="#E9E9E9" />
    <rect x="4" y="17" width="34.1467" height="2" rx="1" fill="#E9E9E9" />
    <rect x="4" y="23" width="30" height="2" rx="1" fill="#E9E9E9" />
    <g clip-path="url(#clip0_8629_12484)">
      <rect
        width="23.8527"
        height="24"
        rx="2"
        transform="matrix(1 0 2.70729e-05 1 42.1467 4)"
        fill="#EDEDED"
      />
      <path
        d="M47.0005 30.0001L57.6988 14.2824C58.6142 12.9375 60.4347 12.5674 61.8027 13.448L87.5143 30.0001H47.0005Z"
        fill="#CCCCCC"
      />
      <circle
        cx="2.10328"
        cy="2.10328"
        r="2.10328"
        transform="matrix(1 0 2.70729e-05 1 47.7163 9)"
        fill="#CCCCCC"
      />
    </g>
    <defs>
      <clipPath id="clip0_8629_12484">
        <rect
          width="23.8527"
          height="24"
          rx="2"
          transform="matrix(1 0 2.70729e-05 1 42.1467 4)"
          fill="white"
        />
      </clipPath>
    </defs>
  </svg>
`;

export const DarkLargeHorizontalCardIcon = html`
  <svg
    width="70"
    height="32"
    viewBox="0 0 70 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="0.25"
      y="0.25"
      width="69.5"
      height="31.5"
      rx="3.75"
      fill="#141414"
    />
    <rect
      x="0.25"
      y="0.25"
      width="69.5"
      height="31.5"
      rx="3.75"
      stroke="#484848"
      stroke-width="0.5"
    />
    <rect x="4" y="4" width="21" height="3" rx="1.5" fill="#4A4A4A" />
    <rect x="4" y="11" width="34.1467" height="2" rx="1" fill="#323232" />
    <rect x="4" y="17" width="34.1467" height="2" rx="1" fill="#323232" />
    <rect x="4" y="23" width="30" height="2" rx="1" fill="#323232" />
    <g clip-path="url(#clip0_8635_14321)">
      <rect
        width="23.8527"
        height="24"
        rx="2"
        transform="matrix(1 0 2.70729e-05 1 42.1467 4)"
        fill="#2E2E2E"
      />
      <path
        d="M47.0005 30.0001L57.6988 14.2824C58.6142 12.9375 60.4347 12.5674 61.8027 13.448L87.5143 30.0001H47.0005Z"
        fill="#5D5D5D"
      />
      <circle
        cx="2.10328"
        cy="2.10328"
        r="2.10328"
        transform="matrix(1 0 2.70729e-05 1 47.7163 9)"
        fill="#5D5D5D"
      />
    </g>
    <defs>
      <clipPath id="clip0_8635_14321">
        <rect
          width="23.8527"
          height="24"
          rx="2"
          transform="matrix(1 0 2.70729e-05 1 42.1467 4)"
          fill="white"
        />
      </clipPath>
    </defs>
  </svg>
`;

export const LightSmallHorizontalCardIcon = html`
  <svg
    width="70"
    height="14"
    viewBox="0 0 70 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="0.25" y="0.25" width="69.5" height="13.5" rx="2.75" fill="white" />
    <rect
      x="0.25"
      y="0.25"
      width="69.5"
      height="13.5"
      rx="2.75"
      stroke="#E3E2E4"
      stroke-width="0.5"
    />
    <circle cx="6.5" cy="7" r="2.5" fill="#D9D9D9" />
    <rect x="13" y="5" width="53" height="4" rx="2" fill="#DBDBDB" />
  </svg>
`;

export const DarkSmallHorizontalCardIcon = html`
  <svg
    width="70"
    height="14"
    viewBox="0 0 70 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="0.25"
      y="0.25"
      width="69.5"
      height="13.5"
      rx="2.75"
      fill="#141414"
    />
    <rect
      x="0.25"
      y="0.25"
      width="69.5"
      height="13.5"
      rx="2.75"
      stroke="#484848"
      stroke-width="0.5"
    />
    <circle cx="6.5" cy="7" r="2.5" fill="#4A4A4A" />
    <rect x="13" y="5" width="53" height="4" rx="2" fill="#4A4A4A" />
  </svg>
`;

export const LightLargeVerticalCardIcon = html`
  <svg
    width="60"
    height="66"
    viewBox="0 0 60 66"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="0.25"
      y="1.10718"
      width="59.5"
      height="63.7857"
      rx="3.75"
      fill="white"
    />
    <rect
      x="0.25"
      y="1.10718"
      width="59.5"
      height="63.7857"
      rx="3.75"
      stroke="#E3E2E4"
      stroke-width="0.5"
    />
    <g clip-path="url(#clip0_8629_12498)">
      <path
        d="M3.00005 5.85718C3.00002 4.75261 3.89543 3.85718 5 3.85718H55C56.1046 3.85718 57 4.75261 57.0001 5.85718L57.0008 34.7143H3.00084L3.00005 5.85718Z"
        fill="#EDEDED"
      />
      <path
        d="M18.0007 37.3179L33.5882 14.4172C34.5036 13.0723 36.3241 12.7021 37.692 13.5828L74.5616 37.3179H18.0007Z"
        fill="#CCCCCC"
      />
      <circle
        cx="2.93637"
        cy="2.93637"
        r="2.93637"
        transform="matrix(1 0 2.70729e-05 1 19 8)"
        fill="#CCCCCC"
      />
    </g>
    <rect x="3" y="38.7144" width="30" height="3" rx="1.5" fill="#DBDBDB" />
    <rect x="3" y="45.7144" width="54" height="3" rx="1.5" fill="#E9E9E9" />
    <rect x="3" y="52.7144" width="54" height="3" rx="1.5" fill="#E9E9E9" />
    <defs>
      <clipPath id="clip0_8629_12498">
        <path
          d="M3.00005 5.85718C3.00002 4.75261 3.89543 3.85718 5 3.85718H55C56.1046 3.85718 57 4.75261 57.0001 5.85718L57.0008 34.7143H3.00084L3.00005 5.85718Z"
          fill="white"
        />
      </clipPath>
    </defs>
  </svg>
`;

export const DarkLargeVerticalCardIcon = html`
  <svg
    width="60"
    height="66"
    viewBox="0 0 60 66"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="0.25"
      y="1.10718"
      width="59.5"
      height="63.7857"
      rx="3.75"
      fill="#141414"
    />
    <rect
      x="0.25"
      y="1.10718"
      width="59.5"
      height="63.7857"
      rx="3.75"
      stroke="#484848"
      stroke-width="0.5"
    />
    <g clip-path="url(#clip0_8635_14335)">
      <path
        d="M3.00005 5.85718C3.00002 4.75261 3.89543 3.85718 5 3.85718H55C56.1046 3.85718 57 4.75261 57.0001 5.85718L57.0008 34.7143H3.00084L3.00005 5.85718Z"
        fill="#2E2E2E"
      />
      <path
        d="M18.0007 37.3179L33.5882 14.4172C34.5036 13.0723 36.3241 12.7021 37.692 13.5828L74.5616 37.3179H18.0007Z"
        fill="#5D5D5D"
      />
      <circle
        cx="2.93637"
        cy="2.93637"
        r="2.93637"
        transform="matrix(1 0 2.70729e-05 1 19 8)"
        fill="#5D5D5D"
      />
    </g>
    <rect x="3" y="38.7144" width="30" height="3" rx="1.5" fill="#4A4A4A" />
    <rect x="3" y="45.7144" width="54" height="3" rx="1.5" fill="#323232" />
    <rect x="3" y="52.7144" width="54" height="3" rx="1.5" fill="#323232" />
    <defs>
      <clipPath id="clip0_8635_14335">
        <path
          d="M3.00005 5.85718C3.00002 4.75261 3.89543 3.85718 5 3.85718H55C56.1046 3.85718 57 4.75261 57.0001 5.85718L57.0008 34.7143H3.00084L3.00005 5.85718Z"
          fill="white"
        />
      </clipPath>
    </defs>
  </svg>
`;

export const LightSmallVerticalCardIcon = html`
  <svg
    width="38"
    height="30"
    viewBox="0 0 38 30"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="0.25" y="0.25" width="37.5" height="29.5" rx="3.75" fill="white" />
    <rect
      x="0.25"
      y="0.25"
      width="37.5"
      height="29.5"
      rx="3.75"
      stroke="#E3E2E4"
      stroke-width="0.5"
    />
    <circle cx="6.5" cy="6.5" r="2.5" fill="#D9D9D9" />
    <rect x="4" y="13" width="30" height="3" rx="1.5" fill="#E9E9E9" />
    <rect x="4" y="20" width="30" height="3" rx="1.5" fill="#E9E9E9" />
  </svg>
`;

export const DarkSmallVerticalCardIcon = html`
  <svg
    width="38"
    height="30"
    viewBox="0 0 38 30"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="0.25"
      y="0.25"
      width="37.5"
      height="29.5"
      rx="3.75"
      fill="#141414"
    />
    <rect
      x="0.25"
      y="0.25"
      width="37.5"
      height="29.5"
      rx="3.75"
      stroke="#484848"
      stroke-width="0.5"
    />
    <circle cx="6.5" cy="6.5" r="2.5" fill="#4A4A4A" />
    <rect x="4" y="13" width="30" height="3" rx="1.5" fill="#4A4A4A" />
    <rect x="4" y="20" width="30" height="3" rx="1.5" fill="#4A4A4A" />
  </svg>
`;
