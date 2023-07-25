import { css, html } from 'lit';

export const styles = css`
  .attachment-container {
    position: relative;
    display: flex;
    flex-direction: column;
    padding: 16px 24px;
    margin-top: calc(var(--affine-paragraph-space) + 8px);

    border-radius: 12px;
    border: 3px solid var(--affine-background-overlay-panel-color);
    background: var(--affine-card-background-blue);
    background: var(--light-background-card-background-blue);
    box-shadow: var(--affine-shadow-1);
    cursor: pointer;
  }

  .attachment-name {
    display: flex;
    align-items: center;
    gap: 8px;

    color: var(--affine-text-primary-color);
    font-size: var(--affine-font-sm);
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    fill: var(--affine-icon-color);
  }

  .attachment-size {
    color: var(--affine-text-secondary-color);
    font-size: var(--affine-font-xs);
  }

  .attachment-banner {
    position: absolute;
    display: flex;
    right: 24px;
    bottom: 0;
  }
`;

export const AttachmentBanner = html`<svg
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
