import { html } from 'lit';

import { getThemeMode } from '../../_common/utils/query.js';

export function BookmarkDefaultImage() {
  const theme = getThemeMode();
  return theme === 'light' ? lightBanner : darkBanner;
}

const lightBanner = html`<svg
  width="148"
  height="110"
  viewBox="0 0 148 110"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <g filter="url(#filter0_d_11664_41790)">
    <path
      d="M4 12C4 7.58172 7.58172 4 12 4H136C140.418 4 144 7.58172 144 12V106H4V12Z"
      fill="white"
    />
    <path
      d="M83.5385 40.3587C83.5385 45.3961 87.4993 49.4788 92.3846 49.4788C97.2699 49.4788 101.231 45.3961 101.231 40.3587C101.231 35.3213 97.2699 31.2386 92.3846 31.2386C87.4993 31.2386 83.5385 35.3213 83.5385 40.3587Z"
      fill="#C0BFC1"
      fill-opacity="0.3"
    />
    <path
      d="M133.077 71.1147L133.077 74.2854C133.077 76.3887 133.074 77.7468 132.992 78.7804C132.914 79.7714 132.78 80.1389 132.691 80.3192C132.352 81.0056 131.811 81.5637 131.145 81.9135C130.97 82.0054 130.614 82.1428 129.652 82.2238C128.65 82.3083 127.332 82.3111 125.292 82.3111H91.3231C89.2829 82.3111 87.9657 82.3083 86.9631 82.2238C86.0018 82.1428 85.6454 82.0054 85.4705 81.9135C84.8047 81.5637 84.2634 81.0056 83.9241 80.3192C83.835 80.1389 83.7016 79.7714 83.6231 78.7804C83.5412 77.7468 83.5384 76.3887 83.5384 74.2854L83.5385 64.3242C83.6808 64.1886 83.8207 64.0581 83.9583 63.9331C85.0229 62.9661 86.1837 62.1049 87.6209 61.5997C89.7628 60.8469 92.0821 60.8193 94.2402 61.5213C95.6884 61.9923 96.868 62.8257 97.9539 63.7671C98.6668 64.3852 99.4407 65.1423 100.295 66.0052L103.805 62.4162C105.146 61.0453 106.302 59.8637 107.33 58.9719C108.415 58.0313 109.594 57.1986 111.04 56.7275C113.196 56.0253 115.513 56.0511 117.654 56.8013C119.09 57.3046 120.251 58.1633 121.316 59.1279C121.316 59.1279 129.174 67.1407 133.077 71.1147Z"
      fill="#C0BFC1"
      fill-opacity="0.3"
    />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M19 56.5C19 55.6716 19.6716 55 20.5 55H68.5C69.3284 55 70 55.6716 70 56.5C70 57.3284 69.3284 58 68.5 58H20.5C19.6716 58 19 57.3284 19 56.5Z"
      fill="#C0BFC1"
      fill-opacity="0.4"
    />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M19 31C19 29.8954 19.8954 29 21 29H45C46.1046 29 47 29.8954 47 31C47 32.1046 46.1046 33 45 33H21C19.8954 33 19 32.1046 19 31Z"
      fill="#C0BFC1"
      fill-opacity="0.4"
    />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M19 45.5C19 44.6716 19.6716 44 20.5 44H68.5C69.3284 44 70 44.6716 70 45.5C70 46.3284 69.3284 47 68.5 47H20.5C19.6716 47 19 46.3284 19 45.5Z"
      fill="#C0BFC1"
      fill-opacity="0.4"
    />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M19 67.5C19 66.6716 19.6716 66 20.5 66H68.5C69.3284 66 70 66.6716 70 67.5C70 68.3284 69.3284 69 68.5 69H20.5C19.6716 69 19 68.3284 19 67.5Z"
      fill="#C0BFC1"
      fill-opacity="0.4"
    />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M19 76.5C19 75.6716 19.6716 75 20.5 75H68.5C69.3284 75 70 75.6716 70 76.5C70 77.3284 69.3284 78 68.5 78H20.5C19.6716 78 19 77.3284 19 76.5Z"
      fill="#C0BFC1"
      fill-opacity="0.4"
    />
  </g>
  <defs>
    <filter
      id="filter0_d_11664_41790"
      x="0"
      y="0"
      width="148"
      height="110"
      filterUnits="userSpaceOnUse"
      color-interpolation-filters="sRGB"
    >
      <feFlood flood-opacity="0" result="BackgroundImageFix" />
      <feColorMatrix
        in="SourceAlpha"
        type="matrix"
        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
        result="hardAlpha"
      />
      <feOffset />
      <feGaussianBlur stdDeviation="2" />
      <feComposite in2="hardAlpha" operator="out" />
      <feColorMatrix
        type="matrix"
        values="0 0 0 0 0.258824 0 0 0 0 0.254902 0 0 0 0 0.286275 0 0 0 0.14 0"
      />
      <feBlend
        mode="normal"
        in2="BackgroundImageFix"
        result="effect1_dropShadow_11664_41790"
      />
      <feBlend
        mode="normal"
        in="SourceGraphic"
        in2="effect1_dropShadow_11664_41790"
        result="shape"
      />
    </filter>
  </defs>
</svg>`;

const darkBanner = html`<svg
  width="148"
  height="110"
  viewBox="0 0 148 110"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <g filter="url(#filter0_d_11664_41838)">
    <path
      d="M4 12C4 7.58172 7.58172 4 12 4H136C140.418 4 144 7.58172 144 12V106H4V12Z"
      fill="white"
      fill-opacity="0.08"
      shape-rendering="crispEdges"
    />
    <path
      d="M81 39.2857C81 44.4146 85.1577 48.5714 90.2857 48.5714C95.4137 48.5714 99.5714 44.4146 99.5714 39.2857C99.5714 34.1568 95.4137 30 90.2857 30C85.1577 30 81 34.1568 81 39.2857Z"
      fill="#C0BFC1"
      fill-opacity="0.3"
    />
    <path
      d="M133 70.6003L133 73.8286C133 75.9701 132.997 77.3528 132.911 78.4052C132.829 79.4142 132.689 79.7883 132.595 79.972C132.239 80.6709 131.671 81.2391 130.972 81.5952C130.788 81.6887 130.414 81.8287 129.405 81.9111C128.353 81.9971 126.97 82 124.829 82H89.1714C87.0299 82 85.6472 81.9971 84.5948 81.9111C83.5858 81.8287 83.2117 81.6887 83.028 81.5952C82.3291 81.2391 81.7609 80.6709 81.4048 79.972C81.3113 79.7883 81.1713 79.4142 81.0889 78.4052C81.0029 77.3528 81 75.9701 81 73.8286L81 63.6865C81.1494 63.5483 81.2962 63.4155 81.4407 63.2882C82.5582 62.3037 83.7767 61.4269 85.2854 60.9125C87.5337 60.1459 89.9682 60.1179 92.2335 60.8326C93.7537 61.3121 94.9919 62.1607 96.1318 63.1193C96.88 63.7485 97.6924 64.5194 98.5891 65.398L102.274 61.7438C103.681 60.348 104.895 59.1449 105.974 58.2369C107.113 57.2793 108.35 56.4315 109.868 55.9518C112.131 55.2368 114.564 55.2631 116.811 56.0269C118.318 56.5393 119.537 57.4137 120.654 58.3957C120.654 58.3957 128.903 66.5541 133 70.6003Z"
      fill="#C0BFC1"
      fill-opacity="0.3"
    />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M19 58.5C19 57.6716 19.6716 57 20.5 57H68.5C69.3284 57 70 57.6716 70 58.5C70 59.3284 69.3284 60 68.5 60H20.5C19.6716 60 19 59.3284 19 58.5Z"
      fill="#C0BFC1"
      fill-opacity="0.4"
    />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M19 33C19 31.8954 19.8954 31 21 31H45C46.1046 31 47 31.8954 47 33C47 34.1046 46.1046 35 45 35H21C19.8954 35 19 34.1046 19 33Z"
      fill="#C0BFC1"
      fill-opacity="0.4"
    />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M19 47.5C19 46.6716 19.6716 46 20.5 46H68.5C69.3284 46 70 46.6716 70 47.5C70 48.3284 69.3284 49 68.5 49H20.5C19.6716 49 19 48.3284 19 47.5Z"
      fill="#C0BFC1"
      fill-opacity="0.4"
    />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M19 69.5C19 68.6716 19.6716 68 20.5 68H68.5C69.3284 68 70 68.6716 70 69.5C70 70.3284 69.3284 71 68.5 71H20.5C19.6716 71 19 70.3284 19 69.5Z"
      fill="#C0BFC1"
      fill-opacity="0.4"
    />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M19 78.5C19 77.6716 19.6716 77 20.5 77H68.5C69.3284 77 70 77.6716 70 78.5C70 79.3284 69.3284 80 68.5 80H20.5C19.6716 80 19 79.3284 19 78.5Z"
      fill="#C0BFC1"
      fill-opacity="0.4"
    />
  </g>
  <defs>
    <filter
      id="filter0_d_11664_41838"
      x="0"
      y="0"
      width="148"
      height="110"
      filterUnits="userSpaceOnUse"
      color-interpolation-filters="sRGB"
    >
      <feFlood flood-opacity="0" result="BackgroundImageFix" />
      <feColorMatrix
        in="SourceAlpha"
        type="matrix"
        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
        result="hardAlpha"
      />
      <feOffset />
      <feGaussianBlur stdDeviation="2" />
      <feComposite in2="hardAlpha" operator="out" />
      <feColorMatrix
        type="matrix"
        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.24 0"
      />
      <feBlend
        mode="normal"
        in2="BackgroundImageFix"
        result="effect1_dropShadow_11664_41838"
      />
      <feBlend
        mode="normal"
        in="SourceGraphic"
        in2="effect1_dropShadow_11664_41838"
        result="shape"
      />
    </filter>
  </defs>
</svg>`;
