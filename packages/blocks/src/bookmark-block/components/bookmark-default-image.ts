import { html } from 'lit';

import { getThemeMode } from '../../_common/utils/query.js';

export function BookmarkDefaultImage() {
  const theme = getThemeMode();
  return theme === 'light' ? lightBanner : darkBanner;
}

const lightBanner = html`<svg
  width="340"
  height="170"
  viewBox="0 0 340 170"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <g clip-path="url(#clip0_2609_10951)">
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
  </g>
  <defs>
    <clipPath id="clip0_2609_10951">
      <path
        d="M0.000108291 4C4.84837e-05 1.79086 1.79086 0 4 0H336C338.209 0 340 1.79086 340 4L340.005 170H0.00460238L0.000108291 4Z"
        fill="white"
      />
    </clipPath>
  </defs>
</svg>`;

const darkBanner = html`<svg
  width="340"
  height="170"
  viewBox="0 0 340 170"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <g clip-path="url(#clip0_8149_55092)">
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
  </g>
  <defs>
    <clipPath id="clip0_8149_55092">
      <path
        d="M0.000108291 4C4.84837e-05 1.79086 1.79086 0 4 0H336C338.209 0 340 1.79086 340 4L340.005 170H0.00460238L0.000108291 4Z"
        fill="white"
      />
    </clipPath>
  </defs>
</svg>`;
