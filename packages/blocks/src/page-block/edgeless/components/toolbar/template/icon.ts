import { html, svg } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

export const ArrowIcon = html`
  <svg
    width="24"
    height="18"
    viewBox="0 0 24 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      id="Polygon 19"
      d="M12.6809 16.8585C12.2821 17.4176 11.4514 17.4176 11.0526 16.8585L0.754394 2.41961C0.282281 1.75767 0.755483 0.838941 1.56853 0.838941L22.165 0.838943C22.978 0.838943 23.4512 1.75767 22.9791 2.41961L12.6809 16.8585Z"
      fill="currentColor"
    />
  </svg>
`;

const baseStyle = {
  position: 'absolute',
  boxShadow: '1px -1px 4px 0px rgba(66, 65, 73, 0.18)',
  borderRadius: '2px',
  transition: 'width .2s, height .2s, top .2s, left .2s, transform .2s',
};

const CardThree = (expanded: boolean) => html`
  <svg
    width="85"
    height="50"
    viewBox="0 0 85 50"
    fill="none"
    style="${styleMap({
      ...(expanded
        ? {
            width: '30px',
            height: '18px',
            left: '63px',
            top: '7px',
            transform: 'rotate(20.251deg)',
          }
        : {
            width: '86px',
            height: '56.6px',
            top: '36px',
            left: '8px',
            transform: 'rotate(0deg)',
          }),
      ...baseStyle,
    })}"
    xmlns="http://www.w3.org/2000/svg"
  >
    ${svg`
    <g clip-path="url(#clip0_13696_17641)">
      <rect width="85" height="50" fill="currentColor" />
      <rect x="4" y="7" width="7" height="2" rx="1" fill="#FFEACA" />
      <rect x="4" y="11" width="24" height="40" rx="1" fill="#FFEACA" />
      <g filter="url(#filter0_d_13696_17641)">
        <rect x="5" y="14" width="6" height="5" fill="#FFDE6B" />
        <rect
          x="5.05"
          y="14.05"
          width="5.9"
          height="4.9"
          stroke="black"
          stroke-opacity="0.1"
          stroke-width="0.1"
        />
      </g>
      <g filter="url(#filter1_d_13696_17641)">
        <rect x="5" y="22" width="6" height="5" fill="#FFDE6B" />
        <rect
          x="5.05"
          y="22.05"
          width="5.9"
          height="4.9"
          stroke="black"
          stroke-opacity="0.1"
          stroke-width="0.1"
        />
      </g>
      <g filter="url(#filter2_d_13696_17641)">
        <rect x="5" y="29" width="6" height="5" fill="#FFDE6B" />
        <rect
          x="5.05"
          y="29.05"
          width="5.9"
          height="4.9"
          stroke="black"
          stroke-opacity="0.1"
          stroke-width="0.1"
        />
      </g>
      <g filter="url(#filter3_d_13696_17641)">
        <rect x="13" y="14" width="6" height="5" fill="#FFDE6B" />
        <rect
          x="13.05"
          y="14.05"
          width="5.9"
          height="4.9"
          stroke="black"
          stroke-opacity="0.1"
          stroke-width="0.1"
        />
      </g>
      <g filter="url(#filter4_d_13696_17641)">
        <rect x="13" y="22" width="6" height="5" fill="#FFDE6B" />
        <rect
          x="13.05"
          y="22.05"
          width="5.9"
          height="4.9"
          stroke="black"
          stroke-opacity="0.1"
          stroke-width="0.1"
        />
      </g>
      <g filter="url(#filter5_d_13696_17641)">
        <rect x="13" y="29" width="6" height="5" fill="#9DD194" />
        <rect
          x="13.05"
          y="29.05"
          width="5.9"
          height="4.9"
          stroke="black"
          stroke-opacity="0.1"
          stroke-width="0.1"
        />
      </g>
      <g filter="url(#filter6_d_13696_17641)">
        <rect x="21" y="14" width="6" height="5" fill="#FFDE6B" />
        <rect
          x="21.05"
          y="14.05"
          width="5.9"
          height="4.9"
          stroke="black"
          stroke-opacity="0.1"
          stroke-width="0.1"
        />
      </g>
      <g filter="url(#filter7_d_13696_17641)">
        <rect x="21" y="22" width="6" height="5" fill="#FFDE6B" />
        <rect
          x="21.05"
          y="22.05"
          width="5.9"
          height="4.9"
          stroke="black"
          stroke-opacity="0.1"
          stroke-width="0.1"
        />
      </g>
      <g filter="url(#filter8_d_13696_17641)">
        <rect x="21" y="29" width="6" height="5" fill="#F16F6F" />
        <rect
          x="21.05"
          y="29.05"
          width="5.9"
          height="4.9"
          stroke="black"
          stroke-opacity="0.1"
          stroke-width="0.1"
        />
      </g>
      <rect x="31" y="7" width="7" height="2" rx="1" fill="#E1EFFF" />
      <rect x="31" y="11" width="24" height="40" rx="1" fill="#E1EFFF" />
      <g filter="url(#filter9_d_13696_17641)">
        <rect x="32" y="14" width="6" height="5" fill="#B8E3FF" />
        <rect
          x="32.05"
          y="14.05"
          width="5.9"
          height="4.9"
          stroke="black"
          stroke-opacity="0.1"
          stroke-width="0.1"
        />
      </g>
      <g filter="url(#filter10_d_13696_17641)">
        <rect x="32" y="21" width="6" height="5" fill="#B8E3FF" />
        <rect
          x="32.05"
          y="21.05"
          width="5.9"
          height="4.9"
          stroke="black"
          stroke-opacity="0.1"
          stroke-width="0.1"
        />
      </g>
      <g filter="url(#filter11_d_13696_17641)">
        <rect x="40" y="14" width="6" height="5" fill="#B8E3FF" />
        <rect
          x="40.05"
          y="14.05"
          width="5.9"
          height="4.9"
          stroke="black"
          stroke-opacity="0.1"
          stroke-width="0.1"
        />
      </g>
      <g filter="url(#filter12_d_13696_17641)">
        <rect x="40" y="21" width="6" height="5" fill="#FFC46B" />
        <rect
          x="40.05"
          y="21.05"
          width="5.9"
          height="4.9"
          stroke="black"
          stroke-opacity="0.1"
          stroke-width="0.1"
        />
      </g>
      <g filter="url(#filter13_d_13696_17641)">
        <rect x="48" y="14" width="6" height="5" fill="#B8E3FF" />
        <rect
          x="48.05"
          y="14.05"
          width="5.9"
          height="4.9"
          stroke="black"
          stroke-opacity="0.1"
          stroke-width="0.1"
        />
      </g>
      <rect x="58" y="7" width="7" height="2" rx="1" fill="#DFF4E8" />
      <rect x="58" y="11" width="24" height="40" rx="1" fill="#DFF4E8" />
      <g filter="url(#filter14_d_13696_17641)">
        <rect x="59" y="14" width="6" height="5" fill="#9DD194" />
        <rect
          x="59.05"
          y="14.05"
          width="5.9"
          height="4.9"
          stroke="black"
          stroke-opacity="0.1"
          stroke-width="0.1"
        />
      </g>
      <g filter="url(#filter15_d_13696_17641)">
        <rect x="59" y="21" width="6" height="5" fill="#9DD194" />
        <rect
          x="59.05"
          y="21.05"
          width="5.9"
          height="4.9"
          stroke="black"
          stroke-opacity="0.1"
          stroke-width="0.1"
        />
      </g>
      <g filter="url(#filter16_d_13696_17641)">
        <rect x="67" y="14" width="6" height="5" fill="#9DD194" />
        <rect
          x="67.05"
          y="14.05"
          width="5.9"
          height="4.9"
          stroke="black"
          stroke-opacity="0.1"
          stroke-width="0.1"
        />
      </g>
      <g filter="url(#filter17_d_13696_17641)">
        <rect x="67" y="21" width="6" height="5" fill="#FFC46B" />
        <rect
          x="67.05"
          y="21.05"
          width="5.9"
          height="4.9"
          stroke="black"
          stroke-opacity="0.1"
          stroke-width="0.1"
        />
      </g>
      <g filter="url(#filter18_d_13696_17641)">
        <rect x="75" y="14" width="6" height="5" fill="#9DD194" />
        <rect
          x="75.05"
          y="14.05"
          width="5.9"
          height="4.9"
          stroke="black"
          stroke-opacity="0.1"
          stroke-width="0.1"
        />
      </g>
    </g>
    <defs>
      <filter
        id="filter0_d_13696_17641"
        x="-14.1379"
        y="-5.13793"
        width="44.2759"
        height="43.2759"
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
        <feGaussianBlur stdDeviation="9.56896" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.258824 0 0 0 0 0.254902 0 0 0 0 0.286275 0 0 0 0.18 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_13696_17641"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_13696_17641"
          result="shape"
        />
      </filter>
      <filter
        id="filter1_d_13696_17641"
        x="-14.1379"
        y="2.86207"
        width="44.2759"
        height="43.2759"
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
        <feGaussianBlur stdDeviation="9.56896" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.258824 0 0 0 0 0.254902 0 0 0 0 0.286275 0 0 0 0.18 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_13696_17641"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_13696_17641"
          result="shape"
        />
      </filter>
      <filter
        id="filter2_d_13696_17641"
        x="-14.1379"
        y="9.86207"
        width="44.2759"
        height="43.2759"
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
        <feGaussianBlur stdDeviation="9.56896" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.258824 0 0 0 0 0.254902 0 0 0 0 0.286275 0 0 0 0.18 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_13696_17641"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_13696_17641"
          result="shape"
        />
      </filter>
      <filter
        id="filter3_d_13696_17641"
        x="-6.13793"
        y="-5.13793"
        width="44.2759"
        height="43.2759"
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
        <feGaussianBlur stdDeviation="9.56896" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.258824 0 0 0 0 0.254902 0 0 0 0 0.286275 0 0 0 0.18 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_13696_17641"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_13696_17641"
          result="shape"
        />
      </filter>
      <filter
        id="filter4_d_13696_17641"
        x="-6.13793"
        y="2.86207"
        width="44.2759"
        height="43.2759"
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
        <feGaussianBlur stdDeviation="9.56896" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.258824 0 0 0 0 0.254902 0 0 0 0 0.286275 0 0 0 0.18 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_13696_17641"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_13696_17641"
          result="shape"
        />
      </filter>
      <filter
        id="filter5_d_13696_17641"
        x="-6.13793"
        y="9.86207"
        width="44.2759"
        height="43.2759"
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
        <feGaussianBlur stdDeviation="9.56896" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.258824 0 0 0 0 0.254902 0 0 0 0 0.286275 0 0 0 0.18 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_13696_17641"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_13696_17641"
          result="shape"
        />
      </filter>
      <filter
        id="filter6_d_13696_17641"
        x="1.86207"
        y="-5.13793"
        width="44.2759"
        height="43.2759"
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
        <feGaussianBlur stdDeviation="9.56896" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.258824 0 0 0 0 0.254902 0 0 0 0 0.286275 0 0 0 0.18 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_13696_17641"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_13696_17641"
          result="shape"
        />
      </filter>
      <filter
        id="filter7_d_13696_17641"
        x="1.86207"
        y="2.86207"
        width="44.2759"
        height="43.2759"
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
        <feGaussianBlur stdDeviation="9.56896" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.258824 0 0 0 0 0.254902 0 0 0 0 0.286275 0 0 0 0.18 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_13696_17641"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_13696_17641"
          result="shape"
        />
      </filter>
      <filter
        id="filter8_d_13696_17641"
        x="1.86207"
        y="9.86207"
        width="44.2759"
        height="43.2759"
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
        <feGaussianBlur stdDeviation="9.56896" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.258824 0 0 0 0 0.254902 0 0 0 0 0.286275 0 0 0 0.18 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_13696_17641"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_13696_17641"
          result="shape"
        />
      </filter>
      <filter
        id="filter9_d_13696_17641"
        x="12.8621"
        y="-5.13793"
        width="44.2759"
        height="43.2759"
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
        <feGaussianBlur stdDeviation="9.56896" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.258824 0 0 0 0 0.254902 0 0 0 0 0.286275 0 0 0 0.18 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_13696_17641"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_13696_17641"
          result="shape"
        />
      </filter>
      <filter
        id="filter10_d_13696_17641"
        x="12.8621"
        y="1.86207"
        width="44.2759"
        height="43.2759"
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
        <feGaussianBlur stdDeviation="9.56896" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.258824 0 0 0 0 0.254902 0 0 0 0 0.286275 0 0 0 0.18 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_13696_17641"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_13696_17641"
          result="shape"
        />
      </filter>
      <filter
        id="filter11_d_13696_17641"
        x="20.8621"
        y="-5.13793"
        width="44.2759"
        height="43.2759"
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
        <feGaussianBlur stdDeviation="9.56896" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.258824 0 0 0 0 0.254902 0 0 0 0 0.286275 0 0 0 0.18 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_13696_17641"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_13696_17641"
          result="shape"
        />
      </filter>
      <filter
        id="filter12_d_13696_17641"
        x="20.8621"
        y="1.86207"
        width="44.2759"
        height="43.2759"
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
        <feGaussianBlur stdDeviation="9.56896" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.258824 0 0 0 0 0.254902 0 0 0 0 0.286275 0 0 0 0.18 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_13696_17641"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_13696_17641"
          result="shape"
        />
      </filter>
      <filter
        id="filter13_d_13696_17641"
        x="28.8621"
        y="-5.13793"
        width="44.2759"
        height="43.2759"
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
        <feGaussianBlur stdDeviation="9.56896" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.258824 0 0 0 0 0.254902 0 0 0 0 0.286275 0 0 0 0.18 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_13696_17641"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_13696_17641"
          result="shape"
        />
      </filter>
      <filter
        id="filter14_d_13696_17641"
        x="39.8621"
        y="-5.13793"
        width="44.2759"
        height="43.2759"
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
        <feGaussianBlur stdDeviation="9.56896" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.258824 0 0 0 0 0.254902 0 0 0 0 0.286275 0 0 0 0.18 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_13696_17641"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_13696_17641"
          result="shape"
        />
      </filter>
      <filter
        id="filter15_d_13696_17641"
        x="39.8621"
        y="1.86207"
        width="44.2759"
        height="43.2759"
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
        <feGaussianBlur stdDeviation="9.56896" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.258824 0 0 0 0 0.254902 0 0 0 0 0.286275 0 0 0 0.18 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_13696_17641"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_13696_17641"
          result="shape"
        />
      </filter>
      <filter
        id="filter16_d_13696_17641"
        x="47.8621"
        y="-5.13793"
        width="44.2759"
        height="43.2759"
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
        <feGaussianBlur stdDeviation="9.56896" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.258824 0 0 0 0 0.254902 0 0 0 0 0.286275 0 0 0 0.18 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_13696_17641"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_13696_17641"
          result="shape"
        />
      </filter>
      <filter
        id="filter17_d_13696_17641"
        x="47.8621"
        y="1.86207"
        width="44.2759"
        height="43.2759"
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
        <feGaussianBlur stdDeviation="9.56896" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.258824 0 0 0 0 0.254902 0 0 0 0 0.286275 0 0 0 0.18 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_13696_17641"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_13696_17641"
          result="shape"
        />
      </filter>
      <filter
        id="filter18_d_13696_17641"
        x="55.8621"
        y="-5.13793"
        width="44.2759"
        height="43.2759"
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
        <feGaussianBlur stdDeviation="9.56896" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.258824 0 0 0 0 0.254902 0 0 0 0 0.286275 0 0 0 0.18 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_13696_17641"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_13696_17641"
          result="shape"
        />
      </filter>
      <clipPath id="clip0_13696_17641">
        <rect width="85" height="50" fill="white" />
      </clipPath>
    </defs>
    `}
  </svg>
`;

const CardTwo = (expanded: boolean) => html`
  <svg
    width="85"
    height="50"
    viewBox="0 0 85 50"
    fill="none"
    style=${styleMap({
      ...(expanded
        ? {
            width: '26px',
            height: '15px',
            left: '9px',
            top: '9px',
            transform: 'rotate(-20.56deg)',
          }
        : {
            width: '41.5px',
            height: '24.4px',
            left: '11px',
            top: '19px',
            transform: 'rotate(-7.2deg)',
          }),
      ...baseStyle,
    })}
    xmlns="http://www.w3.org/2000/svg"
  >
    ${svg`<rect width="85" height="50" fill="currentColor" />
    <line
      x1="16"
      y1="31.8907"
      x2="22"
      y2="31.8907"
      stroke="#6B6B6B"
      stroke-width="0.218649"
    />
    <line
      x1="16"
      y1="31.8907"
      x2="22"
      y2="31.8907"
      stroke="#6B6B6B"
      stroke-width="0.218649"
    />
    <path
      d="M33 31H36.1325V22.8918V19.0001L40 19"
      stroke="#6B6B6B"
      stroke-width="0.218649"
    />
    <path
      d="M52 19H64.1883V13V10L68 10.0001"
      stroke="#6B6B6B"
      stroke-width="0.218649"
    />
    <path
      d="M29 31H35.8083L35.8089 36.8873V39.9999L40 40"
      stroke="#6B6B6B"
      stroke-width="0.218649"
    />
    <path
      d="M62 19H64.685V24.9999V27.9999L68 28"
      stroke="#6B6B6B"
      stroke-width="0.218649"
    />
    <rect x="40" y="36" width="12" height="7" rx="0.728829" fill="#9DD194" />
    <rect
      x="40.0364"
      y="36.0364"
      width="11.9271"
      height="6.92712"
      rx="0.692388"
      stroke="black"
      stroke-opacity="0.1"
      stroke-width="0.0728829"
    />
    <rect x="3" y="28" width="13" height="6" rx="0.728829" fill="#FFDE6B" />
    <rect
      x="3.03644"
      y="28.0364"
      width="12.9271"
      height="5.92712"
      rx="0.692388"
      stroke="black"
      stroke-opacity="0.1"
      stroke-width="0.0728829"
    />
    <rect
      x="54.7686"
      y="19.1265"
      width="6.22715"
      height="6.22715"
      transform="rotate(-45 54.7686 19.1265)"
      fill="#937EE7"
    />
    <rect
      x="54.8201"
      y="19.1265"
      width="6.15427"
      height="6.15427"
      transform="rotate(-45 54.8201 19.1265)"
      stroke="black"
      stroke-opacity="0.1"
      stroke-width="0.0728829"
    />
    <rect
      x="21.4038"
      y="30.8835"
      width="6.22715"
      height="6.22715"
      transform="rotate(-45 21.4038 30.8835)"
      fill="#937EE7"
    />
    <rect
      x="21.4553"
      y="30.8835"
      width="6.15427"
      height="6.15427"
      transform="rotate(-45 21.4553 30.8835)"
      stroke="black"
      stroke-opacity="0.1"
      stroke-width="0.0728829"
    />
    <rect x="40" y="16" width="12" height="7" rx="0.728829" fill="#FFDE6B" />
    <rect
      x="40.0364"
      y="16.0364"
      width="11.9271"
      height="6.92712"
      rx="0.692388"
      stroke="black"
      stroke-opacity="0.1"
      stroke-width="0.0728829"
    />
    <rect x="68" y="8" width="13" height="6" rx="0.728829" fill="#937EE7" />
    <rect
      x="68.0364"
      y="8.03644"
      width="12.9271"
      height="5.92712"
      rx="0.692388"
      stroke="black"
      stroke-opacity="0.1"
      stroke-width="0.0728829"
    />
    <rect x="68" y="24" width="13" height="7" rx="0.728829" fill="#937EE7" />
    <rect
      x="68.0364"
      y="24.0364"
      width="12.9271"
      height="6.92712"
      rx="0.692388"
      stroke="black"
      stroke-opacity="0.1"
      stroke-width="0.0728829"
    />`}
  </svg>
`;

const CardOne = (expanded: boolean) => html`
  <svg
    width="85"
    height="50"
    viewBox="0 0 85 50"
    fill="none"
    style=${styleMap({
      ...(expanded
        ? {
            width: '39px',
            height: '23px',
            left: '30.3px',
            top: '5.4px',
            transform: 'rotate(0deg)',
          }
        : {
            width: '56.7px',
            height: '33.3px',
            left: '31px',
            top: '15.7px',
            transform: 'rotate(9.259deg)',
          }),
      ...baseStyle,
    })}
    xmlns="http://www.w3.org/2000/svg"
  >
    ${svg`<g clip-path="url(#clip0_13703_17928)">
      <rect width="85" height="50" fill="currentColor" />
      <rect
        x="4.17871"
        y="4.62036"
        width="35.0562"
        height="18.4492"
        rx="1"
        fill="#DFF4E8"
      />
      <rect
        x="45.2656"
        y="4.52075"
        width="35.0562"
        height="18.4492"
        rx="1"
        fill="#DFF4F3"
      />
      <rect
        x="4.29248"
        y="27.6343"
        width="35.0562"
        height="18.4492"
        rx="1"
        fill="#FFEACA"
      />
      <rect
        x="45.2798"
        y="27.5554"
        width="35.0562"
        height="18.4492"
        rx="1"
        fill="#FFE1E1"
      />
      <g filter="url(#filter0_d_13703_17928)">
        <rect
          x="6.01074"
          y="6.79297"
          width="6.66992"
          height="5"
          fill="#9DD194"
        />
        <rect
          x="6.06074"
          y="6.84297"
          width="6.56992"
          height="4.9"
          stroke="black"
          stroke-opacity="0.1"
          stroke-width="0.1"
        />
      </g>
      <g filter="url(#filter1_d_13703_17928)">
        <rect x="6.01074" y="15" width="6.66992" height="5" fill="#9DD194" />
        <rect
          x="6.06074"
          y="15.05"
          width="6.56992"
          height="4.9"
          stroke="black"
          stroke-opacity="0.1"
          stroke-width="0.1"
        />
      </g>
      <g filter="url(#filter2_d_13703_17928)">
        <rect x="14.0107" y="6.79297" width="6" height="5" fill="#9DD194" />
        <rect
          x="14.0607"
          y="6.84297"
          width="5.9"
          height="4.9"
          stroke="black"
          stroke-opacity="0.1"
          stroke-width="0.1"
        />
      </g>
      <g filter="url(#filter3_d_13703_17928)">
        <rect x="53.0894" y="10.731" width="6" height="5" fill="#84CFFF" />
        <rect
          x="53.1394"
          y="10.781"
          width="5.9"
          height="4.9"
          stroke="black"
          stroke-opacity="0.1"
          stroke-width="0.1"
        />
      </g>
      <g filter="url(#filter4_d_13703_17928)">
        <rect x="62.0894" y="10.731" width="6" height="5" fill="#84CFFF" />
        <rect
          x="62.1394"
          y="10.781"
          width="5.9"
          height="4.9"
          stroke="black"
          stroke-opacity="0.1"
          stroke-width="0.1"
        />
      </g>
      <g filter="url(#filter5_d_13703_17928)">
        <rect x="71.0894" y="10.731" width="6" height="5" fill="#84CFFF" />
        <rect
          x="71.1394"
          y="10.781"
          width="5.9"
          height="4.9"
          stroke="black"
          stroke-opacity="0.1"
          stroke-width="0.1"
        />
      </g>
      <g filter="url(#filter6_d_13703_17928)">
        <rect x="47.5449" y="29.2566" width="6" height="5" fill="#F16F6F" />
        <rect
          x="47.5949"
          y="29.3066"
          width="5.9"
          height="4.9"
          stroke="black"
          stroke-opacity="0.1"
          stroke-width="0.1"
        />
      </g>
      <g filter="url(#filter7_d_13703_17928)">
        <rect x="55.5449" y="29.2566" width="6" height="5" fill="#F16F6F" />
        <rect
          x="55.5949"
          y="29.3066"
          width="5.9"
          height="4.9"
          stroke="black"
          stroke-opacity="0.1"
          stroke-width="0.1"
        />
      </g>
      <g filter="url(#filter8_d_13703_17928)">
        <rect x="63.5449" y="29.2566" width="6" height="5" fill="#F16F6F" />
        <rect
          x="63.5949"
          y="29.3066"
          width="5.9"
          height="4.9"
          stroke="black"
          stroke-opacity="0.1"
          stroke-width="0.1"
        />
      </g>
      <g filter="url(#filter9_d_13703_17928)">
        <rect x="71.5449" y="29.2566" width="6" height="5" fill="#F16F6F" />
        <rect
          x="71.5949"
          y="29.3066"
          width="5.9"
          height="4.9"
          stroke="black"
          stroke-opacity="0.1"
          stroke-width="0.1"
        />
      </g>
      <g filter="url(#filter10_d_13703_17928)">
        <rect x="71.5449" y="35.2566" width="6" height="5" fill="#F16F6F" />
        <rect
          x="71.5949"
          y="35.3066"
          width="5.9"
          height="4.9"
          stroke="black"
          stroke-opacity="0.1"
          stroke-width="0.1"
        />
      </g>
      <g filter="url(#filter11_d_13703_17928)">
        <rect x="63.5449" y="35.2566" width="6" height="5" fill="#F16F6F" />
        <rect
          x="63.5949"
          y="35.3066"
          width="5.9"
          height="4.9"
          stroke="black"
          stroke-opacity="0.1"
          stroke-width="0.1"
        />
      </g>
      <g filter="url(#filter12_d_13703_17928)">
        <rect x="55.5449" y="35.2566" width="6" height="5" fill="#F16F6F" />
        <rect
          x="55.5949"
          y="35.3066"
          width="5.9"
          height="4.9"
          stroke="black"
          stroke-opacity="0.1"
          stroke-width="0.1"
        />
      </g>
      <g filter="url(#filter13_d_13703_17928)">
        <rect x="47.5449" y="35.2566" width="6" height="5" fill="#F16F6F" />
        <rect
          x="47.5949"
          y="35.3066"
          width="5.9"
          height="4.9"
          stroke="black"
          stroke-opacity="0.1"
          stroke-width="0.1"
        />
      </g>
      <g filter="url(#filter14_d_13703_17928)">
        <rect x="22.0107" y="6.79297" width="6" height="5" fill="#9DD194" />
        <rect
          x="22.0607"
          y="6.84297"
          width="5.9"
          height="4.9"
          stroke="black"
          stroke-opacity="0.1"
          stroke-width="0.1"
        />
      </g>
      <line
        x1="5.04297"
        y1="25.9557"
        x2="79.8418"
        y2="25.9557"
        stroke="#A7A7A7"
        stroke-width="0.3"
      />
      <line
        x1="42.2047"
        y1="6.34009"
        x2="42.2047"
        y2="44.5148"
        stroke="#A7A7A7"
        stroke-width="0.3"
      />
      <g filter="url(#filter15_d_13703_17928)">
        <rect x="6.21729" y="29.7986" width="6" height="5" fill="#FFC46B" />
        <rect
          x="6.26729"
          y="29.8486"
          width="5.9"
          height="4.9"
          stroke="black"
          stroke-opacity="0.1"
          stroke-width="0.1"
        />
      </g>
      <g filter="url(#filter16_d_13703_17928)">
        <rect x="14.4321" y="33.8223" width="6" height="5" fill="#FFC46B" />
        <rect
          x="14.4821"
          y="33.8723"
          width="5.9"
          height="4.9"
          stroke="black"
          stroke-opacity="0.1"
          stroke-width="0.1"
        />
      </g>
      <g filter="url(#filter17_d_13703_17928)">
        <rect x="22.4795" y="30.9722" width="6" height="5" fill="#FFC46B" />
        <rect
          x="22.5295"
          y="31.0222"
          width="5.9"
          height="4.9"
          stroke="black"
          stroke-opacity="0.1"
          stroke-width="0.1"
        />
      </g>
      <g filter="url(#filter18_d_13703_17928)">
        <rect x="25.4971" y="39.0195" width="6" height="5" fill="#FFC46B" />
        <rect
          x="25.5471"
          y="39.0695"
          width="5.9"
          height="4.9"
          stroke="black"
          stroke-opacity="0.1"
          stroke-width="0.1"
        />
      </g>
    </g>
    <defs>
      <filter
        id="filter0_d_13703_17928"
        x="-13.1272"
        y="-12.345"
        width="44.9458"
        height="43.2759"
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
        <feGaussianBlur stdDeviation="9.56896" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.258824 0 0 0 0 0.254902 0 0 0 0 0.286275 0 0 0 0.18 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_13703_17928"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_13703_17928"
          result="shape"
        />
      </filter>
      <filter
        id="filter1_d_13703_17928"
        x="-13.1272"
        y="-4.13793"
        width="44.9458"
        height="43.2759"
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
        <feGaussianBlur stdDeviation="9.56896" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.258824 0 0 0 0 0.254902 0 0 0 0 0.286275 0 0 0 0.18 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_13703_17928"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_13703_17928"
          result="shape"
        />
      </filter>
      <filter
        id="filter2_d_13703_17928"
        x="-5.12719"
        y="-12.345"
        width="44.2759"
        height="43.2759"
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
        <feGaussianBlur stdDeviation="9.56896" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.258824 0 0 0 0 0.254902 0 0 0 0 0.286275 0 0 0 0.18 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_13703_17928"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_13703_17928"
          result="shape"
        />
      </filter>
      <filter
        id="filter3_d_13703_17928"
        x="33.9514"
        y="-8.40697"
        width="44.2759"
        height="43.2759"
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
        <feGaussianBlur stdDeviation="9.56896" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.258824 0 0 0 0 0.254902 0 0 0 0 0.286275 0 0 0 0.18 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_13703_17928"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_13703_17928"
          result="shape"
        />
      </filter>
      <filter
        id="filter4_d_13703_17928"
        x="42.9514"
        y="-8.40697"
        width="44.2759"
        height="43.2759"
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
        <feGaussianBlur stdDeviation="9.56896" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.258824 0 0 0 0 0.254902 0 0 0 0 0.286275 0 0 0 0.18 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_13703_17928"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_13703_17928"
          result="shape"
        />
      </filter>
      <filter
        id="filter5_d_13703_17928"
        x="51.9514"
        y="-8.40697"
        width="44.2759"
        height="43.2759"
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
        <feGaussianBlur stdDeviation="9.56896" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.258824 0 0 0 0 0.254902 0 0 0 0 0.286275 0 0 0 0.18 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_13703_17928"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_13703_17928"
          result="shape"
        />
      </filter>
      <filter
        id="filter6_d_13703_17928"
        x="28.407"
        y="10.1187"
        width="44.2759"
        height="43.2759"
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
        <feGaussianBlur stdDeviation="9.56896" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.258824 0 0 0 0 0.254902 0 0 0 0 0.286275 0 0 0 0.18 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_13703_17928"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_13703_17928"
          result="shape"
        />
      </filter>
      <filter
        id="filter7_d_13703_17928"
        x="36.407"
        y="10.1187"
        width="44.2759"
        height="43.2759"
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
        <feGaussianBlur stdDeviation="9.56896" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.258824 0 0 0 0 0.254902 0 0 0 0 0.286275 0 0 0 0.18 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_13703_17928"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_13703_17928"
          result="shape"
        />
      </filter>
      <filter
        id="filter8_d_13703_17928"
        x="44.407"
        y="10.1187"
        width="44.2759"
        height="43.2759"
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
        <feGaussianBlur stdDeviation="9.56896" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.258824 0 0 0 0 0.254902 0 0 0 0 0.286275 0 0 0 0.18 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_13703_17928"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_13703_17928"
          result="shape"
        />
      </filter>
      <filter
        id="filter9_d_13703_17928"
        x="52.407"
        y="10.1187"
        width="44.2759"
        height="43.2759"
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
        <feGaussianBlur stdDeviation="9.56896" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.258824 0 0 0 0 0.254902 0 0 0 0 0.286275 0 0 0 0.18 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_13703_17928"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_13703_17928"
          result="shape"
        />
      </filter>
      <filter
        id="filter10_d_13703_17928"
        x="52.407"
        y="16.1187"
        width="44.2759"
        height="43.2759"
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
        <feGaussianBlur stdDeviation="9.56896" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.258824 0 0 0 0 0.254902 0 0 0 0 0.286275 0 0 0 0.18 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_13703_17928"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_13703_17928"
          result="shape"
        />
      </filter>
      <filter
        id="filter11_d_13703_17928"
        x="44.407"
        y="16.1187"
        width="44.2759"
        height="43.2759"
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
        <feGaussianBlur stdDeviation="9.56896" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.258824 0 0 0 0 0.254902 0 0 0 0 0.286275 0 0 0 0.18 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_13703_17928"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_13703_17928"
          result="shape"
        />
      </filter>
      <filter
        id="filter12_d_13703_17928"
        x="36.407"
        y="16.1187"
        width="44.2759"
        height="43.2759"
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
        <feGaussianBlur stdDeviation="9.56896" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.258824 0 0 0 0 0.254902 0 0 0 0 0.286275 0 0 0 0.18 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_13703_17928"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_13703_17928"
          result="shape"
        />
      </filter>
      <filter
        id="filter13_d_13703_17928"
        x="28.407"
        y="16.1187"
        width="44.2759"
        height="43.2759"
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
        <feGaussianBlur stdDeviation="9.56896" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.258824 0 0 0 0 0.254902 0 0 0 0 0.286275 0 0 0 0.18 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_13703_17928"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_13703_17928"
          result="shape"
        />
      </filter>
      <filter
        id="filter14_d_13703_17928"
        x="2.87281"
        y="-12.345"
        width="44.2759"
        height="43.2759"
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
        <feGaussianBlur stdDeviation="9.56896" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.258824 0 0 0 0 0.254902 0 0 0 0 0.286275 0 0 0 0.18 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_13703_17928"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_13703_17928"
          result="shape"
        />
      </filter>
      <filter
        id="filter15_d_13703_17928"
        x="-12.9206"
        y="10.6607"
        width="44.2759"
        height="43.2759"
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
        <feGaussianBlur stdDeviation="9.56896" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.258824 0 0 0 0 0.254902 0 0 0 0 0.286275 0 0 0 0.18 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_13703_17928"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_13703_17928"
          result="shape"
        />
      </filter>
      <filter
        id="filter16_d_13703_17928"
        x="-4.7058"
        y="14.6843"
        width="44.2759"
        height="43.2759"
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
        <feGaussianBlur stdDeviation="9.56896" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.258824 0 0 0 0 0.254902 0 0 0 0 0.286275 0 0 0 0.18 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_13703_17928"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_13703_17928"
          result="shape"
        />
      </filter>
      <filter
        id="filter17_d_13703_17928"
        x="3.34156"
        y="11.8342"
        width="44.2759"
        height="43.2759"
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
        <feGaussianBlur stdDeviation="9.56896" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.258824 0 0 0 0 0.254902 0 0 0 0 0.286275 0 0 0 0.18 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_13703_17928"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_13703_17928"
          result="shape"
        />
      </filter>
      <filter
        id="filter18_d_13703_17928"
        x="6.35914"
        y="19.8816"
        width="44.2759"
        height="43.2759"
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
        <feGaussianBlur stdDeviation="9.56896" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.258824 0 0 0 0 0.254902 0 0 0 0 0.286275 0 0 0 0.18 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_13703_17928"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_13703_17928"
          result="shape"
        />
      </filter>
      <clipPath id="clip0_13703_17928">
        <rect width="85" height="50" fill="white" />
      </clipPath>
    </defs>`}
  </svg>
`;

export const ArrowDown = (expanded: boolean) => html`
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    style=${expanded
      ? 'width: 26px; height: 26px; top: 0; left: 0; transform: translate(37px, 31px); transition: transform .2s;'
      : 'width: 26px; height: 26px; top: 0; left: 0; transform: translate(37px, 64px); transition: transform .2s;'}
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="28" height="28" rx="14" fill="black" fill-opacity="0.1" />
    <g clip-path="url(#clip0_5974_1841)">
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M19.5804 10.9697C19.8733 11.2626 19.8733 11.7374 19.5804 12.0303L14.5804 17.0303C14.2875 17.3232 13.8126 17.3232 13.5197 17.0303L8.51972 12.0303C8.22683 11.7374 8.22683 11.2626 8.51972 10.9697C8.81261 10.6768 9.28749 10.6768 9.58038 10.9697L14.05 15.4393L18.5197 10.9697C18.8126 10.6768 19.2875 10.6768 19.5804 10.9697Z"
        fill="#77757D"
      />
    </g>
    <defs>
      <clipPath id="clip0_5974_1841">
        <rect width="24" height="24" fill="white" transform="translate(2 2)" />
      </clipPath>
    </defs>
  </svg>
`;

export function renderIcon(expandingStyle: boolean) {
  return html`
    ${CardOne(expandingStyle)} ${CardTwo(expandingStyle)}
    ${CardThree(expandingStyle)} ${ArrowDown(expandingStyle)}
  `;
}

export const defaultPreview = html`
  <svg
    width="85"
    height="50"
    viewBox="0 0 85 50"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="85" height="50" fill="white" />
    <line
      x1="16"
      y1="31.8907"
      x2="22"
      y2="31.8907"
      stroke="#6B6B6B"
      stroke-width="0.218649"
    />
    <line
      x1="16"
      y1="31.8907"
      x2="22"
      y2="31.8907"
      stroke="#6B6B6B"
      stroke-width="0.218649"
    />
    <path
      d="M33 31H36.1325V22.8918V19.0001L40 19"
      stroke="#6B6B6B"
      stroke-width="0.218649"
    />
    <path
      d="M52 19H64.1883V13V10L68 10.0001"
      stroke="#6B6B6B"
      stroke-width="0.218649"
    />
    <path
      d="M29 31H35.8083L35.8089 36.8873V39.9999L40 40"
      stroke="#6B6B6B"
      stroke-width="0.218649"
    />
    <path
      d="M62 19H64.685V24.9999V27.9999L68 28"
      stroke="#6B6B6B"
      stroke-width="0.218649"
    />
    <rect x="40" y="36" width="12" height="7" rx="0.728829" fill="#9DD194" />
    <rect
      x="40.0364"
      y="36.0364"
      width="11.9271"
      height="6.92712"
      rx="0.692388"
      stroke="black"
      stroke-opacity="0.1"
      stroke-width="0.0728829"
    />
    <rect x="3" y="28" width="13" height="6" rx="0.728829" fill="#FFDE6B" />
    <rect
      x="3.03644"
      y="28.0364"
      width="12.9271"
      height="5.92712"
      rx="0.692388"
      stroke="black"
      stroke-opacity="0.1"
      stroke-width="0.0728829"
    />
    <rect
      x="54.7686"
      y="19.1265"
      width="6.22715"
      height="6.22715"
      transform="rotate(-45 54.7686 19.1265)"
      fill="#937EE7"
    />
    <rect
      x="54.8201"
      y="19.1265"
      width="6.15427"
      height="6.15427"
      transform="rotate(-45 54.8201 19.1265)"
      stroke="black"
      stroke-opacity="0.1"
      stroke-width="0.0728829"
    />
    <rect
      x="21.4038"
      y="30.8835"
      width="6.22715"
      height="6.22715"
      transform="rotate(-45 21.4038 30.8835)"
      fill="#937EE7"
    />
    <rect
      x="21.4553"
      y="30.8835"
      width="6.15427"
      height="6.15427"
      transform="rotate(-45 21.4553 30.8835)"
      stroke="black"
      stroke-opacity="0.1"
      stroke-width="0.0728829"
    />
    <rect x="40" y="16" width="12" height="7" rx="0.728829" fill="#FFDE6B" />
    <rect
      x="40.0364"
      y="16.0364"
      width="11.9271"
      height="6.92712"
      rx="0.692388"
      stroke="black"
      stroke-opacity="0.1"
      stroke-width="0.0728829"
    />
    <rect x="68" y="8" width="13" height="6" rx="0.728829" fill="#937EE7" />
    <rect
      x="68.0364"
      y="8.03644"
      width="12.9271"
      height="5.92712"
      rx="0.692388"
      stroke="black"
      stroke-opacity="0.1"
      stroke-width="0.0728829"
    />
    <rect x="68" y="24" width="13" height="7" rx="0.728829" fill="#937EE7" />
    <rect
      x="68.0364"
      y="24.0364"
      width="12.9271"
      height="6.92712"
      rx="0.692388"
      stroke="black"
      stroke-opacity="0.1"
      stroke-width="0.0728829"
    />
  </svg>
`;
