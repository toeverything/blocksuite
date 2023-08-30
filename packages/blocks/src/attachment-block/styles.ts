import { css, html } from 'lit';

import { queryCurrentMode } from '../__internal__/utils/query.js';

export const styles = css`
  .affine-attachment-container {
    position: relative;
    display: flex;
    flex-direction: column;
    padding: 16px 24px;
    margin-top: calc(var(--affine-paragraph-space) + 8px);

    border-radius: 12px;
    border: 3px solid var(--affine-background-overlay-panel-color);
    background: var(--affine-card-background-blue);
    box-shadow: var(--affine-shadow-1);
    cursor: pointer;
  }

  .affine-attachment-name {
    display: flex;
    align-items: center;
    gap: 8px;

    color: var(--affine-text-primary-color);
    font-size: var(--affine-font-sm);
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    fill: var(--affine-icon-color);
    user-select: none;
  }

  .affine-attachment-desc {
    color: var(--affine-text-secondary-color);
    font-size: var(--affine-font-xs);
    user-select: none;
  }

  .affine-attachment-banner {
    position: absolute;
    display: flex;
    right: 24px;
    bottom: 0;
  }

  .affine-attachment-loading {
    display: flex;
    align-items: center;
    gap: 8px;

    color: var(--affine-placeholder-color);
    font-size: var(--affine-font-sm);
    font-weight: 600;
    fill: var(--affine-icon-color);
    user-select: none;
  }

  .affine-attachment-caption {
    width: 100%;
    font-size: var(--affine-font-sm);
    outline: none;
    border: 0;
    font-family: inherit;
    text-align: center;
    color: var(--affine-icon-color);
    background: var(--affine-background-primary-color);
  }
  .affine-attachment-caption::placeholder {
    color: var(--affine-placeholder-color);
  }
`;

export const LoadingIcon = html`<svg
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
    d="M14.6666 7.99992C14.6666 11.6818 11.6818 14.6666 7.99992 14.6666C4.31802 14.6666 1.33325 11.6818 1.33325 7.99992C1.33325 4.31802 4.31802 1.33325 7.99992 1.33325C11.6818 1.33325 14.6666 4.31802 14.6666 7.99992ZM3.30003 7.99992C3.30003 10.5956 5.40424 12.6998 7.99992 12.6998C10.5956 12.6998 12.6998 10.5956 12.6998 7.99992C12.6998 5.40424 10.5956 3.30003 7.99992 3.30003C5.40424 3.30003 3.30003 5.40424 3.30003 7.99992Z"
    fill-opacity="0.1"
  />
  <path
    d="M13.6833 7.99992C14.2263 7.99992 14.674 7.55732 14.5942 7.02014C14.5142 6.48171 14.3684 5.95388 14.1591 5.4487C13.8241 4.63986 13.333 3.90493 12.714 3.28587C12.0949 2.66682 11.36 2.17575 10.5511 1.84072C10.046 1.63147 9.51812 1.48564 8.9797 1.40564C8.44251 1.32583 7.99992 1.77351 7.99992 2.31659C7.99992 2.85967 8.44486 3.28962 8.9761 3.40241C9.25681 3.46201 9.53214 3.54734 9.79853 3.65768C10.3688 3.89388 10.8869 4.24008 11.3233 4.67652C11.7598 5.11295 12.106 5.63108 12.3422 6.20131C12.4525 6.4677 12.5378 6.74303 12.5974 7.02374C12.7102 7.55498 13.1402 7.99992 13.6833 7.99992Z"
    fill="#1E96EB"
    class="spinner"
  />
</svg>`;

const AttachmentBannerLight = html`<svg
  width="90"
  height="67"
  viewBox="0 0 90 67"
  xmlns="http://www.w3.org/2000/svg"
>
  <g filter="url(#filter0_d_2804_28633)">
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M55.8256 13.2652C56.0233 11.8523 55.0434 10.546 53.6371 10.3475L20.5338 5.67357C18.4243 5.37573 16.4739 6.85229 16.1774 8.97157L6.51483 78.0428C6.21836 80.162 7.68812 82.1215 9.79763 82.4193L69.6381 90.8683C71.7476 91.1662 73.6981 89.6896 73.9945 87.5703L79.8994 45.3601C80.0971 43.9473 79.1172 42.641 77.7109 42.4424L59.8861 39.9257C55.6671 39.33 52.7276 35.4111 53.3205 31.1725L55.8256 13.2652ZM26.8035 44.3852C26.9517 43.3256 27.9269 42.5873 28.9817 42.7363L60.8117 47.2304C61.8665 47.3793 62.6014 48.359 62.4531 49.4187C62.3049 50.4783 61.3297 51.2166 60.2749 51.0677L28.4449 46.5735C27.3901 46.4246 26.6552 45.4449 26.8035 44.3852ZM27.4607 53.6086C26.406 53.4596 25.4308 54.1979 25.2825 55.2576C25.1343 56.3172 25.8692 57.2969 26.9239 57.4459L58.754 61.94C59.8087 62.0889 60.7839 61.3506 60.9322 60.291C61.0804 59.2314 60.3455 58.2516 59.2908 58.1027L27.4607 53.6086Z"
      fill="url(#paint0_linear_2804_28633)"
      shape-rendering="crispEdges"
    />
    <path
      d="M62.3244 14.341C61.4678 13.199 59.6644 13.6675 59.4663 15.0836L57.1401 31.7118C56.8436 33.8311 58.3134 35.7906 60.4229 36.0884L76.9745 38.4254C78.384 38.6244 79.3295 37.012 78.4728 35.87L62.3244 14.341Z"
      fill="url(#paint1_linear_2804_28633)"
      shape-rendering="crispEdges"
    />
  </g>
  <defs>
    <filter
      id="filter0_d_2804_28633"
      x="1.47681"
      y="0.635498"
      width="83.448"
      height="95.271"
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
      <feGaussianBlur stdDeviation="2.5" />
      <feComposite in2="hardAlpha" operator="out" />
      <feColorMatrix
        type="matrix"
        values="0 0 0 0 0.258824 0 0 0 0 0.254902 0 0 0 0 0.286275 0 0 0 0.08 0"
      />
      <feBlend
        mode="normal"
        in2="BackgroundImageFix"
        result="effect1_dropShadow_2804_28633"
      />
      <feBlend
        mode="normal"
        in="SourceGraphic"
        in2="effect1_dropShadow_2804_28633"
        result="shape"
      />
    </filter>
    <linearGradient
      id="paint0_linear_2804_28633"
      x1="50.4541"
      y1="9.89806"
      x2="39.6202"
      y2="86.63"
      gradientUnits="userSpaceOnUse"
    >
      <stop stop-color="white" />
      <stop offset="1" stop-color="white" stop-opacity="0.2" />
    </linearGradient>
    <linearGradient
      id="paint1_linear_2804_28633"
      x1="50.4541"
      y1="9.89806"
      x2="39.6202"
      y2="86.63"
      gradientUnits="userSpaceOnUse"
    >
      <stop stop-color="white" />
      <stop offset="1" stop-color="white" stop-opacity="0.2" />
    </linearGradient>
  </defs>
</svg>`;

const AttachmentBannerDark = html`<svg
  xmlns="http://www.w3.org/2000/svg"
  width="91"
  height="67"
  viewBox="0 0 91 67"
  fill="none"
>
  <g filter="url(#filter0_d_5306_36117)">
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M56.6675 13.2652C56.866 11.8523 55.8816 10.546 54.4688 10.3475L21.2123 5.67357C19.093 5.37573 17.1335 6.85229 16.8357 8.97157L7.12838 78.0428C6.83054 80.162 8.3071 82.1215 10.4264 82.4193L70.5439 90.8683C72.6632 91.1662 74.6226 89.6896 74.9205 87.5703L80.8527 45.3601C81.0513 43.9473 80.0669 42.641 78.6541 42.4424L60.7467 39.9257C56.5082 39.33 53.555 35.4111 54.1507 31.1725L56.6675 13.2652ZM27.511 44.3852C27.6599 43.3256 28.6396 42.5873 29.6993 42.7363L61.6767 47.2304C62.7363 47.3793 63.4746 48.359 63.3257 49.4187C63.1767 50.4783 62.197 51.2166 61.1374 51.0677L29.16 46.5735C28.1003 46.4246 27.362 45.4449 27.511 44.3852ZM28.1712 53.6086C27.1116 53.4597 26.1319 54.1979 25.983 55.2576C25.834 56.3172 26.5723 57.2969 27.632 57.4459L59.6094 61.94C60.669 62.0889 61.6487 61.3506 61.7976 60.291C61.9466 59.2314 61.2083 58.2516 60.1487 58.1027L28.1712 53.6086Z"
      fill="url(#paint0_linear_5306_36117)"
      fill-opacity="0.16"
      shape-rendering="crispEdges"
    />
    <path
      d="M63.1963 14.341C62.3357 13.199 60.524 13.6675 60.325 15.0836L57.988 31.7118C57.6902 33.8311 59.1667 35.7906 61.286 36.0884L77.9143 38.4254C79.3303 38.6244 80.2801 37.012 79.4195 35.87L63.1963 14.341Z"
      fill="url(#paint1_linear_5306_36117)"
      fill-opacity="0.16"
      shape-rendering="crispEdges"
    />
  </g>
  <defs>
    <filter
      id="filter0_d_5306_36117"
      x="2.09021"
      y="0.635498"
      width="83.788"
      height="95.271"
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
      <feGaussianBlur stdDeviation="2.5" />
      <feComposite in2="hardAlpha" operator="out" />
      <feColorMatrix
        type="matrix"
        values="0 0 0 0 0.258824 0 0 0 0 0.254902 0 0 0 0 0.286275 0 0 0 0.08 0"
      />
      <feBlend
        mode="normal"
        in2="BackgroundImageFix"
        result="effect1_dropShadow_5306_36117"
      />
      <feBlend
        mode="normal"
        in="SourceGraphic"
        in2="effect1_dropShadow_5306_36117"
        result="shape"
      />
    </filter>
    <linearGradient
      id="paint0_linear_5306_36117"
      x1="51.271"
      y1="9.89806"
      x2="40.4851"
      y2="86.6438"
      gradientUnits="userSpaceOnUse"
    >
      <stop stop-color="white" />
      <stop offset="1" stop-color="#777777" stop-opacity="0" />
    </linearGradient>
    <linearGradient
      id="paint1_linear_5306_36117"
      x1="51.271"
      y1="9.89806"
      x2="40.4851"
      y2="86.6438"
      gradientUnits="userSpaceOnUse"
    >
      <stop stop-color="white" />
      <stop offset="1" stop-color="#777777" stop-opacity="0" />
    </linearGradient>
  </defs>
</svg>`;

export const AttachmentBanner = () => {
  const mode = queryCurrentMode();
  const isDarkMode = mode === 'dark';
  return isDarkMode ? AttachmentBannerDark : AttachmentBannerLight;
};

const ErrorBannerLight = html`<svg
  xmlns="http://www.w3.org/2000/svg"
  width="90"
  height="67"
  viewBox="0 0 90 67"
  fill="none"
>
  <g filter="url(#filter0_d_5306_36148)">
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M41.2256 8.42193L48.7032 23.7281L34.7987 39.9427L37.6963 43.7936L29.2604 42.602C28.2056 42.453 27.2304 43.1913 27.0821 44.2509C26.9338 45.3105 27.6686 46.2903 28.7233 46.4393L40.991 48.1721L44.5772 52.9381L43.1938 55.6573L27.7387 53.4743C26.684 53.3253 25.7087 54.0635 25.5604 55.1231C25.4121 56.1828 26.147 57.1625 27.2017 57.3115L41.3365 59.3081L36.1886 69.4269L39.6425 86.4606L10.0739 82.284C7.96442 81.986 6.49478 80.0264 6.79138 77.9072L16.4581 8.83657C16.7547 6.71732 18.7052 5.24087 20.8147 5.53884L41.2256 8.42193ZM53.9296 28.6836L41.7299 40.9218L43.7473 44.6484L61.0901 47.0981C62.1449 47.2471 62.8797 48.2268 62.7314 49.2865C62.5831 50.3461 61.6078 51.0843 60.5531 50.9353L46.0411 48.8855L48.5379 53.4976L47.0729 56.2053L59.5685 57.9703C60.6233 58.1193 61.3581 59.0991 61.2098 60.1587C61.0615 61.2183 60.0862 61.9565 59.0315 61.8076L45.1059 59.8405L39.6542 69.9165L40.7424 86.616L69.9139 90.7365C72.0234 91.0345 73.9739 89.5581 74.2705 87.4388L80.178 45.229C80.3757 43.8161 79.3959 42.5098 77.9896 42.3111L60.1649 39.7933C55.9459 39.1974 53.0067 35.2783 53.5999 31.0398L53.9296 28.6836ZM59.7466 14.9512C59.9448 13.5352 61.7482 13.0667 62.6048 14.2088L78.7519 35.7387C79.6085 36.8808 78.663 38.4931 77.2534 38.294L60.702 35.9561C58.5925 35.6581 57.1228 33.6986 57.4194 31.5793L59.7466 14.9512Z"
      fill="#E6E6E6"
    />
  </g>
  <defs>
    <filter
      id="filter0_d_5306_36148"
      x="1.7533"
      y="0.500732"
      width="83.4501"
      height="95.2739"
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
      <feGaussianBlur stdDeviation="2.5" />
      <feComposite in2="hardAlpha" operator="out" />
      <feColorMatrix
        type="matrix"
        values="0 0 0 0 0.258824 0 0 0 0 0.254902 0 0 0 0 0.286275 0 0 0 0.08 0"
      />
      <feBlend
        mode="normal"
        in2="BackgroundImageFix"
        result="effect1_dropShadow_5306_36148"
      />
      <feBlend
        mode="normal"
        in="SourceGraphic"
        in2="effect1_dropShadow_5306_36148"
        result="shape"
      />
    </filter>
  </defs>
</svg>`;

const ErrorBannerDark = html`<svg
  xmlns="http://www.w3.org/2000/svg"
  width="90"
  height="67"
  viewBox="0 0 90 67"
  fill="none"
>
  <g filter="url(#filter0_d_5306_36172)">
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M41.2257 8.42193L48.7033 23.7281L34.7988 39.9427L37.6964 43.7936L29.2604 42.602C28.2057 42.453 27.2304 43.1913 27.0821 44.2509C26.9338 45.3105 27.6686 46.2903 28.7234 46.4393L40.991 48.1721L44.5773 52.9381L43.1939 55.6573L27.7388 53.4743C26.6841 53.3253 25.7088 54.0635 25.5605 55.1231C25.4122 56.1828 26.147 57.1625 27.2018 57.3115L41.3366 59.3081L36.1886 69.4269L39.6425 86.4606L10.074 82.284C7.96449 81.986 6.49485 80.0264 6.79145 77.9072L16.4582 8.83657C16.7548 6.71732 18.7053 5.24087 20.8148 5.53884L41.2257 8.42193ZM53.9297 28.6836L41.73 40.9218L43.7474 44.6484L61.0902 47.0981C62.1449 47.2471 62.8798 48.2268 62.7315 49.2865C62.5832 50.3461 61.6079 51.0843 60.5532 50.9353L46.0412 48.8855L48.538 53.4976L47.0729 56.2053L59.5686 57.9703C60.6233 58.1193 61.3581 59.0991 61.2098 60.1587C61.0615 61.2183 60.0863 61.9565 59.0315 61.8076L45.106 59.8405L39.6542 69.9165L40.7424 86.616L69.9139 90.7365C72.0234 91.0345 73.974 89.5581 74.2706 87.4388L80.178 45.229C80.3758 43.8161 79.396 42.5098 77.9897 42.3111L60.165 39.7933C55.946 39.1974 53.0067 35.2783 53.5999 31.0398L53.9297 28.6836ZM59.7467 14.9512C59.9449 13.5352 61.7483 13.0667 62.6048 14.2088L78.752 35.7387C79.6085 36.8808 78.663 38.4931 77.2535 38.294L60.702 35.9561C58.5925 35.6581 57.1229 33.6986 57.4195 31.5793L59.7467 14.9512Z"
      fill="#181818"
      fill-opacity="0.8"
      shape-rendering="crispEdges"
    />
  </g>
  <defs>
    <filter
      id="filter0_d_5306_36172"
      x="1.75342"
      y="0.500732"
      width="83.45"
      height="95.2739"
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
      <feGaussianBlur stdDeviation="2.5" />
      <feComposite in2="hardAlpha" operator="out" />
      <feColorMatrix
        type="matrix"
        values="0 0 0 0 0.258824 0 0 0 0 0.254902 0 0 0 0 0.286275 0 0 0 0.08 0"
      />
      <feBlend
        mode="normal"
        in2="BackgroundImageFix"
        result="effect1_dropShadow_5306_36172"
      />
      <feBlend
        mode="normal"
        in="SourceGraphic"
        in2="effect1_dropShadow_5306_36172"
        result="shape"
      />
    </filter>
  </defs>
</svg>`;

export const ErrorBanner = () => {
  const mode = queryCurrentMode();
  const isDarkMode = mode === 'dark';
  return isDarkMode ? ErrorBannerDark : ErrorBannerLight;
};
