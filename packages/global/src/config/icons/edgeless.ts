import { html, svg } from 'lit';

// Edgeless toolbar

export const SelectIcon = html`<svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M10.3383 3.88231L18.071 8.69778C19.0571 9.31182 19.8404 9.79964 20.4017 10.2216C20.9493 10.6333 21.4318 11.0842 21.62 11.6695C21.8868 12.4988 21.7381 13.4034 21.2188 14.1027C20.852 14.5967 20.2493 14.8668 19.599 15.0782C18.9323 15.2949 18.0344 15.5017 16.9044 15.7619L14.4307 16.3314C14.0188 16.4263 13.91 16.4546 13.8157 16.4966C13.7187 16.5398 13.6281 16.5952 13.546 16.6612C13.4669 16.7248 13.3935 16.807 13.1235 17.1285L11.9305 18.5487C11.162 19.4637 10.552 20.1898 10.0419 20.6983C9.54488 21.1937 9.0177 21.6165 8.39807 21.7155C7.52714 21.8546 6.63964 21.5686 6.0146 20.9464C5.56965 20.5035 5.39026 19.852 5.27806 19.16C5.1629 18.4498 5.09457 17.5048 5.00849 16.3143L4.36527 7.41939C4.2957 6.4575 4.23967 5.68281 4.25165 5.08075C4.26359 4.48099 4.34126 3.90703 4.65756 3.44031C5.11363 2.76734 5.84836 2.33594 6.65832 2.25865C7.21739 2.2053 7.76104 2.406 8.30191 2.67862C8.84485 2.95229 9.51023 3.36666 10.3383 3.88231ZM7.62675 4.01809C7.14246 3.77397 6.9194 3.74055 6.80081 3.75187C6.43097 3.78716 6.10155 3.98334 5.89928 4.28182C5.83742 4.37309 5.762 4.57571 5.75136 5.11059C5.74092 5.635 5.79114 6.34017 5.8642 7.35039L6.50172 16.1665C6.59131 17.4054 6.65553 18.2835 6.75873 18.92C6.86617 19.5826 6.99326 19.8041 7.07279 19.8833C7.35743 20.1666 7.76348 20.2978 8.16142 20.2342C8.27334 20.2164 8.507 20.1103 8.98299 19.6359C9.44028 19.1801 10.0077 18.5057 10.8074 17.5536L11.975 16.1637C11.9876 16.1487 12 16.1338 12.0123 16.1192C12.2275 15.8628 12.3982 15.6594 12.606 15.4923C12.7891 15.345 12.9907 15.222 13.2055 15.1264C13.4489 15.018 13.7084 14.9583 14.0374 14.8828C14.0561 14.8785 14.075 14.8741 14.0941 14.8697L16.5295 14.3089C17.7063 14.038 18.5392 13.8455 19.1353 13.6517C19.7553 13.4501 19.9497 13.2958 20.0146 13.2084C20.2446 12.8987 20.3109 12.4982 20.1921 12.1288C20.1582 12.0234 20.0225 11.8131 19.5003 11.4206C18.9982 11.0431 18.2715 10.5897 17.2448 9.95034L9.57801 5.17595C8.70973 4.63525 8.10185 4.25756 7.62675 4.01809Z"
  />
</svg>`;

export const ShapeIcon = html`<svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M12 3.25C12.2691 3.25 12.5177 3.39421 12.6512 3.6279L16.2067 9.85012C16.3394 10.0822 16.3384 10.3674 16.2042 10.5987C16.07 10.8299 15.8229 10.9722 15.5556 10.9722H8.44444C8.17709 10.9722 7.92995 10.8299 7.79576 10.5987C7.66157 10.3674 7.66062 10.0822 7.79326 9.85012L11.3488 3.6279C11.4823 3.39421 11.7309 3.25 12 3.25ZM9.73683 9.47222H14.2632L12 5.51167L9.73683 9.47222ZM7.11111 14.5278C5.80711 14.5278 4.75 15.5849 4.75 16.8889C4.75 18.1929 5.80711 19.25 7.11111 19.25C8.41512 19.25 9.47222 18.1929 9.47222 16.8889C9.47222 15.5849 8.41512 14.5278 7.11111 14.5278ZM3.25 16.8889C3.25 14.7565 4.97868 13.0278 7.11111 13.0278C9.24354 13.0278 10.9722 14.7565 10.9722 16.8889C10.9722 19.0213 9.24354 20.75 7.11111 20.75C4.97868 20.75 3.25 19.0213 3.25 16.8889ZM13.0278 13.7778C13.0278 13.3636 13.3636 13.0278 13.7778 13.0278H20C20.4142 13.0278 20.75 13.3636 20.75 13.7778V20C20.75 20.4142 20.4142 20.75 20 20.75H13.7778C13.3636 20.75 13.0278 20.4142 13.0278 20V13.7778ZM14.5278 14.5278V19.25H19.25V14.5278H14.5278Z"
  />
</svg>`;

const ImageSVG = svg`<path
fill-rule="evenodd"
clip-rule="evenodd"
d="M15 6.25C13.4812 6.25 12.25 7.48122 12.25 9C12.25 10.5188 13.4812 11.75 15 11.75C16.5188 11.75 17.75 10.5188 17.75 9C17.75 7.48122 16.5188 6.25 15 6.25ZM13.75 9C13.75 8.30964 14.3096 7.75 15 7.75C15.6904 7.75 16.25 8.30964 16.25 9C16.25 9.69036 15.6904 10.25 15 10.25C14.3096 10.25 13.75 9.69036 13.75 9Z"
/>
<path
fill-rule="evenodd"
clip-rule="evenodd"
d="M5 4.25C3.48122 4.25 2.25 5.48122 2.25 7V17C2.25 18.5188 3.48122 19.75 5 19.75H16.9863C16.9956 19.7502 17.0049 19.7502 17.0142 19.75H19C20.5188 19.75 21.75 18.5188 21.75 17V7C21.75 5.48122 20.5188 4.25 19 4.25H5ZM17.3356 18.25H19C19.4585 18.25 19.8593 18.0031 20.0769 17.6351L18.6231 16.1718C18.2208 15.7541 17.9502 15.4738 17.7245 15.275C17.5054 15.0819 17.3784 15.0117 17.2815 14.9786C17.0293 14.8926 16.7562 14.8895 16.5021 14.9697C16.4045 15.0005 16.276 15.0678 16.0524 15.2558C15.8542 15.4224 15.6213 15.6486 15.2976 15.9689L17.3356 18.25ZM20.25 15.681V7C20.25 6.30964 19.6904 5.75 19 5.75H5C4.30964 5.75 3.75 6.30964 3.75 7V17C3.75 17.1543 3.77795 17.302 3.82907 17.4385L7.50733 13.8054L7.52247 13.7897C7.89807 13.4008 8.21139 13.0763 8.48886 12.8325C8.7781 12.5783 9.07737 12.3666 9.43913 12.2436C9.99371 12.0551 10.594 12.0486 11.1525 12.2251C11.5168 12.3402 11.8206 12.5454 12.1153 12.7932C12.398 13.031 12.7182 13.3486 13.1022 13.7293L14.2639 14.8814C14.5765 14.5722 14.8455 14.3108 15.087 14.1077C15.382 13.8597 15.6861 13.6542 16.0508 13.5392C16.6099 13.3628 17.2107 13.3697 17.7656 13.5589C18.1276 13.6823 18.4269 13.8947 18.7161 14.1495C18.9936 14.3939 19.3068 14.7192 19.6824 15.1091L19.6996 15.127L20.25 15.681ZM5.142 18.25H15.3241L13.7197 16.4542L12.0677 14.816C11.6564 14.4081 11.3797 14.1346 11.1498 13.9412C10.9266 13.7535 10.7982 13.6862 10.7006 13.6554C10.4468 13.5752 10.1739 13.5781 9.92184 13.6638C9.825 13.6967 9.6981 13.7667 9.47895 13.9593C9.25327 14.1576 8.98257 14.4371 8.58019 14.8537L8.56773 14.8663L5.142 18.25Z"
/>`;

export const ImageIcon = html`<svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  xmlns="http://www.w3.org/2000/svg"
>
  ${ImageSVG}
</svg>`;

export const ImageIcon20 = html`<svg
  width="20"
  height="20"
  viewBox="0 0 24 24"
  xmlns="http://www.w3.org/2000/svg"
>
  ${ImageSVG}
</svg>`;

export const EmbedIcon = html`
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g clip-path="url(#clip0_3334_82005)">
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M5.144 3.54166H14.856C15.3035 3.54166 15.6722 3.54165 15.9726 3.56312C16.2832 3.58533 16.5712 3.63292 16.8445 3.75478C17.2675 3.94339 17.6272 4.25139 17.8584 4.64842C18.0131 4.91401 18.0726 5.19494 18.0996 5.48406C18.125 5.75652 18.125 6.08757 18.125 6.47237V13.5276C18.125 13.9124 18.125 14.2435 18.0996 14.5159C18.0726 14.8051 18.0131 15.086 17.8584 15.3516C17.6272 15.7486 17.2675 16.0566 16.8445 16.2452C16.5712 16.3671 16.2832 16.4147 15.9726 16.4369C15.6722 16.4583 15.3034 16.4583 14.856 16.4583H5.144C4.69656 16.4583 4.32777 16.4583 4.02744 16.4369C3.71685 16.4147 3.42883 16.3671 3.15552 16.2452C2.73246 16.0566 2.37275 15.7486 2.14156 15.3516C1.9869 15.086 1.92741 14.8051 1.90042 14.5159C1.87497 14.2435 1.87499 13.9124 1.875 13.5276V6.4724C1.87499 6.08759 1.87497 5.75652 1.90042 5.48406C1.92741 5.19494 1.9869 4.91401 2.14156 4.64842C2.37275 4.25139 2.73247 3.94339 3.15552 3.75478C3.42883 3.63292 3.71685 3.58533 4.02744 3.56312C4.32777 3.54165 4.69655 3.54166 5.144 3.54166ZM3.125 8.4375V13.5C3.125 13.9201 3.12563 14.1923 3.145 14.3997C3.16342 14.597 3.19476 14.6762 3.22176 14.7226C3.31014 14.8743 3.46036 15.0125 3.66452 15.1035C3.74772 15.1406 3.87132 15.1725 4.11657 15.1901C4.36702 15.208 4.69092 15.2083 5.16667 15.2083H14.8333C15.3091 15.2083 15.633 15.208 15.8834 15.1901C16.1287 15.1725 16.2523 15.1406 16.3355 15.1035C16.5396 15.0125 16.6899 14.8743 16.7782 14.7226C16.8052 14.6762 16.8366 14.597 16.855 14.3997C16.8744 14.1923 16.875 13.9201 16.875 13.5V8.4375H3.125ZM16.875 7.1875H3.125V6.5C3.125 6.07986 3.12563 5.80768 3.145 5.60027C3.16342 5.40303 3.19476 5.3238 3.22176 5.27744C3.31014 5.12566 3.46036 4.98747 3.66452 4.89645C3.74772 4.85935 3.87132 4.82748 4.11657 4.80994C4.36702 4.79204 4.69092 4.79166 5.16667 4.79166H14.8333C15.3091 4.79166 15.633 4.79204 15.8834 4.80994C16.1287 4.82748 16.2523 4.85935 16.3355 4.89645C16.5396 4.98747 16.6899 5.12566 16.7782 5.27744C16.8052 5.3238 16.8366 5.40303 16.855 5.60027C16.8744 5.80768 16.875 6.07986 16.875 6.5V7.1875Z"
        fill="currentColor"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M8.86926 9.56896C9.10731 9.81892 9.09766 10.2145 8.8477 10.4526L7.57292 11.6667L8.8477 12.8807C9.09766 13.1188 9.10731 13.5144 8.86926 13.7644C8.6312 14.0143 8.23559 14.024 7.98563 13.7859L6.23563 12.1193C6.11177 12.0013 6.04167 11.8377 6.04167 11.6667C6.04167 11.4956 6.11177 11.332 6.23563 11.2141L7.98563 9.54741C8.23559 9.30936 8.6312 9.31901 8.86926 9.56896ZM11.1307 9.56896C11.3688 9.31901 11.7644 9.30936 12.0144 9.54741L13.7644 11.2141C13.8882 11.332 13.9583 11.4956 13.9583 11.6667C13.9583 11.8377 13.8882 12.0013 13.7644 12.1193L12.0144 13.7859C11.7644 14.024 11.3688 14.0143 11.1307 13.7644C10.8927 13.5144 10.9023 13.1188 11.1523 12.8807L12.4271 11.6667L11.1523 10.4526C10.9023 10.2145 10.8927 9.81892 11.1307 9.56896Z"
        fill="currentColor"
      />
      <path
        d="M5.08333 6.04166C5.08333 6.38684 4.80351 6.66666 4.45833 6.66666C4.11316 6.66666 3.83333 6.38684 3.83333 6.04166C3.83333 5.69649 4.11316 5.41666 4.45833 5.41666C4.80351 5.41666 5.08333 5.69649 5.08333 6.04166Z"
        fill="currentColor"
      />
      <path
        d="M6.75008 6.04166C6.75008 6.38684 6.47026 6.66666 6.12508 6.66666C5.77991 6.66666 5.50008 6.38684 5.50008 6.04166C5.50008 5.69649 5.77991 5.41666 6.12508 5.41666C6.47026 5.41666 6.75008 5.69649 6.75008 6.04166Z"
        fill="currentColor"
      />
      <path
        d="M8.41675 6.04166C8.41675 6.38684 8.13693 6.66666 7.79175 6.66666C7.44657 6.66666 7.16675 6.38684 7.16675 6.04166C7.16675 5.69649 7.44657 5.41666 7.79175 5.41666C8.13693 5.41666 8.41675 5.69649 8.41675 6.04166Z"
        fill="currentColor"
      />
    </g>
    <defs>
      <clipPath id="clip0_3334_82005">
        <rect width="20" height="20" fill="white" />
      </clipPath>
    </defs>
  </svg>
`;
export const BookmarkIcon = html`
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g clip-path="url(#clip0_3433_78963)">
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        fill="currentColor"
        d="M4.16667 4.79167C3.59137 4.79167 3.125 5.25804 3.125 5.83334V14.1667C3.125 14.742 3.59137 15.2083 4.16667 15.2083H15.8333C16.4086 15.2083 16.875 14.742 16.875 14.1667V10C16.875 9.65483 17.1548 9.375 17.5 9.375C17.8452 9.375 18.125 9.65483 18.125 10V14.1667C18.125 15.4323 17.099 16.4583 15.8333 16.4583H4.16667C2.90101 16.4583 1.875 15.4323 1.875 14.1667V5.83334C1.875 4.56768 2.90101 3.54167 4.16667 3.54167H10C10.3452 3.54167 10.625 3.82149 10.625 4.16667C10.625 4.51185 10.3452 4.79167 10 4.79167H4.16667Z"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        fill="currentColor"
        d="M13.6063 3.48363C14.64 2.44991 16.316 2.44991 17.3497 3.48363C18.3834 4.51735 18.3834 6.19334 17.3497 7.22706L16.2774 8.29939C16.0333 8.54347 15.6376 8.54347 15.3935 8.29939C15.3371 8.24297 15.2937 8.17845 15.2634 8.10958C15.2915 8.82166 15.0338 9.54296 14.4902 10.0866L13.0604 11.5164C12.0267 12.5501 10.3507 12.5501 9.31696 11.5164C8.28324 10.4827 8.28324 8.80667 9.31696 7.77295L10.3893 6.70062C10.6334 6.45654 11.0291 6.45654 11.2732 6.70062C11.3296 6.75703 11.373 6.82155 11.4033 6.89043C11.3751 6.17834 11.6329 5.45705 12.1765 4.9134L13.6063 3.48363ZM11.4445 7.26331C11.4215 7.38099 11.3643 7.49333 11.2732 7.5845L10.2008 8.65683C9.65528 9.2024 9.65528 10.0869 10.2008 10.6325C10.7464 11.1781 11.6309 11.1781 12.1765 10.6325L13.6063 9.20272C14.1518 8.65716 14.1518 7.77262 13.6063 7.22706C13.5203 7.1411 13.4267 7.06921 13.3279 7.01087C13.0307 6.83533 12.932 6.45209 13.1076 6.15488C13.2831 5.85767 13.6664 5.75903 13.9636 5.93457C14.1521 6.04591 14.3293 6.18228 14.4902 6.34317C14.8849 6.73788 15.1289 7.22622 15.2221 7.7367C15.2452 7.61901 15.3023 7.50668 15.3935 7.4155L16.4658 6.34317C17.0114 5.79761 17.0114 4.91307 16.4658 4.36751C15.9203 3.82194 15.0357 3.82194 14.4902 4.36751L13.0604 5.79728C12.5148 6.34285 12.5148 7.22738 13.0604 7.77295C13.1463 7.8589 13.24 7.9308 13.3388 7.98914C13.636 8.16467 13.7346 8.54791 13.5591 8.84512C13.3835 9.14234 13.0003 9.24097 12.7031 9.06544C12.5146 8.9541 12.3374 8.81773 12.1765 8.65683C11.7818 8.26213 11.5378 7.77378 11.4445 7.26331Z"
      />
    </g>
    <defs>
      <clipPath id="clip0_3433_78963">
        <rect width="20" height="20" fill="white" />
      </clipPath>
    </defs>
  </svg>
`;
export const ConnectorIcon = html`<svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M17.5 4.75C16.5335 4.75 15.75 5.5335 15.75 6.5C15.75 7.4665 16.5335 8.25 17.5 8.25C18.4665 8.25 19.25 7.4665 19.25 6.5C19.25 5.5335 18.4665 4.75 17.5 4.75ZM14.25 6.5C14.25 4.70507 15.7051 3.25 17.5 3.25C19.2949 3.25 20.75 4.70507 20.75 6.5C20.75 8.29493 19.2949 9.75 17.5 9.75C16.8901 9.75 16.3194 9.58197 15.8317 9.28968L9.28968 15.8317C9.58197 16.3194 9.75 16.8901 9.75 17.5C9.75 19.2949 8.29493 20.75 6.5 20.75C4.70507 20.75 3.25 19.2949 3.25 17.5C3.25 15.7051 4.70507 14.25 6.5 14.25C7.1415 14.25 7.73958 14.4359 8.24335 14.7567L14.7567 8.24335C14.4359 7.73958 14.25 7.1415 14.25 6.5ZM6.5 15.75C5.5335 15.75 4.75 16.5335 4.75 17.5C4.75 18.4665 5.5335 19.25 6.5 19.25C7.4665 19.25 8.25 18.4665 8.25 17.5C8.25 16.5335 7.4665 15.75 6.5 15.75Z"
  />
</svg>`;

export const PenIcon = html`<svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M15.894 5.32233L15.0516 6.19412L17.8059 8.94836L18.6776 8.106C19.4422 7.33698 19.4408 6.09381 18.6735 5.32652C17.9062 4.55923 16.663 4.55783 15.894 5.32233ZM16.727 9.99082L14.0092 7.27298L6.16599 15.3901L5.11859 18.8814L8.60991 17.834L16.727 9.99082ZM14.8291 4.26586C16.1836 2.91138 18.3797 2.91138 19.7341 4.26586C21.0886 5.62033 21.0886 7.81637 19.7341 9.17085L19.725 9.17995L9.52114 19.0394C9.43501 19.1226 9.33021 19.184 9.2155 19.2184L4.2155 20.7184C3.95122 20.7977 3.66476 20.7254 3.46966 20.5303C3.27456 20.3352 3.20234 20.0488 3.28162 19.7845L4.78162 14.7845C4.81603 14.6698 4.87742 14.565 4.96064 14.4788L14.8291 4.26586Z"
  />
</svg>`;

export const EraserIcon = html`
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M14.8063 4.95001C14.6441 4.95001 14.4835 4.98198 14.3337 5.0441C14.1838 5.10622 14.0477 5.19726 13.9331 5.31202L12.3597 6.88542L18.3145 12.8411L19.8886 11.2664C20.12 11.0349 20.25 10.721 20.25 10.3937C20.25 10.0664 20.12 9.75255 19.8887 9.52108C19.8887 9.52106 19.8887 9.52111 19.8887 9.52108L15.6799 5.31232C15.5653 5.19756 15.4289 5.10622 15.279 5.0441C15.1292 4.98198 14.9685 4.95001 14.8063 4.95001ZM17.254 13.9019L11.299 7.94608L4.1114 15.1337C4.11137 15.1337 4.11142 15.1337 4.1114 15.1337C3.88004 15.3651 3.75 15.6791 3.75 16.0064C3.75 16.3336 3.87996 16.6475 4.11131 16.8789C4.11134 16.879 4.11129 16.8789 4.11131 16.8789L5.63498 18.4026C5.86649 18.6337 6.18055 18.7637 6.50766 18.7637H12.3913L17.254 13.9019ZM14.5128 18.7637H19.6263C20.0405 18.7637 20.3763 19.0994 20.3763 19.5137C20.3763 19.9279 20.0405 20.2637 19.6263 20.2637L6.50809 20.2637C6.50801 20.2637 6.50816 20.2637 6.50809 20.2637C5.78323 20.2638 5.08775 19.9761 4.57491 19.4639L3.05066 17.9396C2.53805 17.4268 2.25 16.7314 2.25 16.0064C2.25 15.2813 2.53797 14.5859 3.05057 14.0732L12.8718 4.25195C13.1257 3.99773 13.4273 3.79605 13.7593 3.65844C14.0912 3.52084 14.447 3.45001 14.8063 3.45001C15.1657 3.45001 15.5215 3.52084 15.8534 3.65844C16.1852 3.79599 16.4867 3.99757 16.7406 4.25166C16.7407 4.25176 16.7405 4.25156 16.7406 4.25166L20.9493 8.46042C21.462 8.97319 21.75 9.66863 21.75 10.3937C21.75 11.1187 21.462 11.8141 20.9494 12.3268L14.5128 18.7637Z"
    />
  </svg>
`;

export const HandIcon = html`<svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    d="M14.8114 20.999C13.2447 20.9679 11.7002 20.6209 10.2699 19.9787L4.67482 17.3458C4.12742 17.0853 3.70531 16.6178 3.501 16.0458C3.29668 15.4737 3.32684 14.8437 3.58486 14.2938C3.84271 13.7454 4.30714 13.3222 4.87604 13.1172C5.44494 12.9122 6.07173 12.9422 6.61858 13.2006L7.66312 13.6926C7.17264 12.0254 6.19168 9.26496 4.72024 7.65243L3.81194 6.9145C3.37099 6.55513 3.08591 6.03846 3.01648 5.47286C2.94705 4.90727 3.09867 4.33669 3.43953 3.88077C3.78344 3.42341 4.29072 3.11757 4.85476 3.02753C5.4188 2.93748 5.99569 3.07025 6.46417 3.39792C7.56208 4.18419 8.52532 5.14417 9.31623 6.24033C9.58326 5.83988 9.97184 5.53639 10.4244 5.37486C10.7041 5.27066 11.002 5.22422 11.3001 5.23831C11.5982 5.2524 11.8904 5.32672 12.1592 5.45685C12.4015 5.57016 12.6227 5.72422 12.8132 5.91236C13.058 5.63326 13.371 5.42289 13.7215 5.30197C13.9828 5.20656 14.2604 5.16466 14.5381 5.17874C14.8158 5.19282 15.0879 5.2626 15.3383 5.38396C15.6253 5.51414 15.8775 5.71086 16.074 5.95792C16.1756 5.89185 16.2856 5.83976 16.401 5.80304C16.7997 5.65961 17.2388 5.68073 17.622 5.86179C18.0052 6.04285 18.301 6.36905 18.4446 6.76873L20.6155 12.818C21.1282 14.2647 21.1282 15.8444 20.6155 17.2911C20.3444 18.0579 19.9061 18.7544 19.3326 19.3296C18.759 19.9049 18.0647 20.3445 17.3002 20.6164C16.4979 20.8833 15.6566 21.0127 14.8114 20.999ZM5.75747 14.4032C5.62583 14.3751 5.4278 14.3671 5.32879 14.4032C5.21385 14.4428 5.108 14.5051 5.01751 14.5865C4.92702 14.6678 4.85373 14.7666 4.80198 14.8769C4.74874 14.9866 4.71803 15.106 4.71166 15.2278C4.7053 15.3497 4.72341 15.4716 4.76492 15.5863C4.80643 15.7011 4.8705 15.8062 4.95332 15.8957C5.03614 15.9851 5.13602 16.0569 5.24704 16.1068L10.8058 18.7943C10.8058 18.7943 14.0939 20.3249 16.8006 19.3501C17.3787 19.1551 17.9049 18.8307 18.3392 18.4013C18.7736 17.9719 19.1048 17.449 19.3075 16.8721C19.7157 15.7262 19.7157 14.474 19.3075 13.3282L17.1276 7.27891C17.1185 7.2489 17.1033 7.22112 17.083 7.19728C17.0626 7.17344 17.0376 7.15407 17.0095 7.14038C16.9813 7.1267 16.9507 7.119 16.9194 7.11775C16.8882 7.11651 16.857 7.12174 16.8279 7.13314C16.7706 7.1556 16.7243 7.19958 16.6989 7.25572C16.6734 7.31186 16.6708 7.37574 16.6916 7.43378L17.0004 8.34481C17.0366 8.43122 17.0546 8.52416 17.0534 8.61785C17.0522 8.71153 17.0318 8.80397 16.9934 8.88941C16.9551 8.97485 16.8997 9.05147 16.8305 9.11451C16.7614 9.17755 16.6801 9.22565 16.5917 9.25584C16.5056 9.29207 16.4129 9.31014 16.3195 9.30893C16.2261 9.30772 16.1339 9.28726 16.0487 9.24881C15.9636 9.21036 15.8872 9.15474 15.8243 9.08543C15.7615 9.01611 15.7135 8.93458 15.6834 8.84588L15.0839 7.16959C15.0101 6.98388 14.8712 6.8316 14.6934 6.7414C14.6028 6.70307 14.5055 6.68331 14.4072 6.68331C14.309 6.68331 14.2117 6.70307 14.1211 6.7414C13.9396 6.80212 13.7882 6.93063 13.6986 7.10026C13.609 7.2699 13.5879 7.46763 13.6397 7.65243L13.8941 8.60902C13.9389 8.7793 13.9156 8.96042 13.829 9.11365C13.7424 9.26688 13.5995 9.38005 13.4308 9.42894C13.2645 9.4814 13.0845 9.46702 12.9285 9.38884C12.7726 9.31065 12.6531 9.17476 12.5952 9.00986L11.9957 7.35179C11.9119 7.12856 11.7441 6.94721 11.5284 6.84671C11.3127 6.7462 11.0663 6.73457 10.8422 6.81429C10.6196 6.89838 10.4388 7.06666 10.3386 7.283C10.2384 7.49933 10.2268 7.74646 10.3063 7.97129L10.7423 9.19208C10.7784 9.27848 10.7964 9.37141 10.7952 9.4651C10.794 9.55878 10.7736 9.65122 10.7352 9.73666C10.6969 9.8221 10.6415 9.89872 10.5724 9.96176C10.5033 10.0248 10.422 10.0729 10.3335 10.1031C10.2474 10.1393 10.1547 10.1574 10.0613 10.1562C9.96791 10.155 9.87575 10.1345 9.79056 10.0961C9.70538 10.0576 9.62899 10.002 9.56614 9.93269C9.50329 9.86338 9.45533 9.78183 9.42523 9.69313C8.68278 7.68202 7.3454 5.94647 5.5922 4.71891C5.41716 4.59322 5.19975 4.54185 4.98718 4.57597C4.7746 4.61008 4.58403 4.72692 4.45683 4.90112C4.32552 5.07405 4.33703 5.23645 4.36245 5.45231C4.38787 5.66818 4.49591 5.8657 4.66377 6.00319L5.57207 6.76845L5.63565 6.83222C8.11531 9.50154 9.26884 14.7126 9.31426 14.9313C9.34154 15.0568 9.33301 15.1875 9.28963 15.3083C9.24625 15.4292 9.1698 15.5353 9.06902 15.6146C8.96956 15.6916 8.85101 15.74 8.72616 15.7544C8.60131 15.7689 8.47489 15.7489 8.36055 15.6966L6.77594 14.8769C6.38102 14.6614 6.29788 14.5865 5.75747 14.4032Z"
  />
</svg>`;

export const SquareIcon = html`<svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  xmlns="http://www.w3.org/2000/svg"
>
  <rect x="4" y="4" width="16" height="16" stroke-width="1.5" />
</svg>`;

export const EllipseIcon = html`<svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  xmlns="http://www.w3.org/2000/svg"
>
  <circle cx="12" cy="12" r="9" stroke-width="1.5" />
</svg>`;

export const DiamondIcon = html`<svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  xmlns="http://www.w3.org/2000/svg"
>
  <path d="M3 12L12 3L21 12L12 21L3 12Z" stroke-width="1.5" />
</svg>`;

export const TriangleIcon = html`<svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  xmlns="http://www.w3.org/2000/svg"
>
  <path d="M12 4L20.6603 19H3.33975L12 4Z" stroke-width="1.5" />
</svg>`;

export const RoundedRectangleIcon = html`<svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  xmlns="http://www.w3.org/2000/svg"
>
  <rect x="3" y="5" width="18" height="14" rx="2" stroke-width="1.5" />
</svg>`;

export const CollapseDownIcon = html`<svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M12 3.25C12.4142 3.25 12.75 3.58579 12.75 4V14.1893L15.4697 11.4697C15.7626 11.1768 16.2374 11.1768 16.5303 11.4697C16.8232 11.7626 16.8232 12.2374 16.5303 12.5303L12.5303 16.5303C12.2374 16.8232 11.7626 16.8232 11.4697 16.5303L7.46967 12.5303C7.17678 12.2374 7.17678 11.7626 7.46967 11.4697C7.76256 11.1768 8.23744 11.1768 8.53033 11.4697L11.25 14.1893V4C11.25 3.58579 11.5858 3.25 12 3.25ZM3.25 20C3.25 19.5858 3.58579 19.25 4 19.25H20C20.4142 19.25 20.75 19.5858 20.75 20C20.75 20.4142 20.4142 20.75 20 20.75H4C3.58579 20.75 3.25 20.4142 3.25 20Z"
  />
</svg>`;

export const MinusIcon = html`<svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M5.25 12C5.25 11.5858 5.58579 11.25 6 11.25H18C18.4142 11.25 18.75 11.5858 18.75 12C18.75 12.4142 18.4142 12.75 18 12.75H6C5.58579 12.75 5.25 12.4142 5.25 12Z"
  />
</svg>`;

export const PlusIcon = html`<svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M12 5.25C12.4142 5.25 12.75 5.58579 12.75 6V11.25H18C18.4142 11.25 18.75 11.5858 18.75 12C18.75 12.4142 18.4142 12.75 18 12.75H12.75V18C12.75 18.4142 12.4142 18.75 12 18.75C11.5858 18.75 11.25 18.4142 11.25 18V12.75H6C5.58579 12.75 5.25 12.4142 5.25 12C5.25 11.5858 5.58579 11.25 6 11.25H11.25V6C11.25 5.58579 11.5858 5.25 12 5.25Z"
  />
</svg>`;

export const ViewBarIcon = html`<svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    d="M3.25 20C2.83579 20 2.5 19.6642 2.5 19.25V4.75C2.5 4.33579 2.83579 4 3.25 4C3.66421 4 4 4.33579 4 4.75L4 19.25C4 19.6642 3.66421 20 3.25 20Z"
  />
  <path
    d="M9.16494 8.43945C9.47453 8.71464 9.50241 9.18869 9.22722 9.49828L7.67013 11.25H16.3299L14.7728 9.49828C14.4976 9.18869 14.5255 8.71464 14.8351 8.43945C15.1446 8.16426 15.6187 8.19215 15.8939 8.50174L18.5606 11.5017C18.8131 11.7859 18.8131 12.2141 18.5606 12.4983L15.8939 15.4983C15.6187 15.8079 15.1446 15.8358 14.8351 15.5606C14.5255 15.2854 14.4976 14.8113 14.7728 14.5017L16.3299 12.75H7.67013L9.22722 14.5017C9.50241 14.8113 9.47453 15.2854 9.16494 15.5606C8.85535 15.8358 8.3813 15.8079 8.10611 15.4983L5.43944 12.4983C5.18685 12.2141 5.18685 11.7859 5.43944 11.5017L8.10611 8.50174C8.3813 8.19215 8.85535 8.16426 9.16494 8.43945Z"
  />
  <path
    d="M21.5 4.75C21.5 4.33579 21.1642 4 20.75 4C20.3358 4 20 4.33579 20 4.75V19.25C20 19.6642 20.3358 20 20.75 20C21.1642 20 21.5 19.6642 21.5 19.25V4.75Z"
  />
</svg>`;

export const TransparentIcon = html`<svg
  width="16"
  height="16"
  viewBox="0 0 16 16"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M-0.939238 4.14286C-0.979281 4.4228 -1 4.70898 -1 5V6.71429H1.57143V9.28571H-1V11C-1 11.291 -0.979281 11.5772 -0.939238 11.8571H1.57143V14.4286H0.0754482C0.481795 15.0111 0.988871 15.5182 1.57143 15.9246V14.4286L4.14286 14.4286V16.9392C4.4228 16.9793 4.70898 17 5 17H6.71429V14.4286H9.28571V17H11C11.291 17 11.5772 16.9793 11.8571 16.9392V14.4286H14.4286L14.4286 15.9246C15.0111 15.5182 15.5182 15.0111 15.9246 14.4286L14.4286 14.4286V11.8571H16.9392C16.9793 11.5772 17 11.291 17 11V9.28571H14.4286V6.71429H17V5C17 4.70898 16.9793 4.4228 16.9392 4.14286H14.4286V1.57143H15.9246C15.5182 0.988871 15.0111 0.481795 14.4286 0.075448L14.4286 1.57143H11.8571V-0.939238C11.5772 -0.979281 11.291 -1 11 -1H9.28571V1.57143H6.71429V-1H5C4.70898 -1 4.4228 -0.979281 4.14286 -0.939238V1.57143H1.57143V0.0754479C0.988871 0.481795 0.481795 0.988871 0.0754479 1.57143H1.57143V4.14286H-0.939238ZM4.14286 4.14286V1.57143H6.71429V4.14286H4.14286ZM4.14286 6.71429H1.57143V4.14286H4.14286V6.71429ZM6.71429 6.71429V4.14286H9.28571V6.71429H6.71429ZM6.71429 9.28571V6.71429H4.14286V9.28571H1.57143V11.8571H4.14286V14.4286H6.71429V11.8571H9.28571V14.4286H11.8571V11.8571H14.4286V9.28571H11.8571V6.71429H14.4286V4.14286H11.8571V1.57143H9.28571V4.14286H11.8571V6.71429H9.28571V9.28571H6.71429ZM6.71429 9.28571V11.8571H4.14286V9.28571H6.71429ZM9.28571 9.28571H11.8571V11.8571H9.28571V9.28571Z"
    fill="#D9D9D9"
  />
</svg>`;

export const MoreHorizontalIcon = html`<svg
  width="20"
  height="20"
  viewBox="0 0 20 20"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    d="M10 5.00004C9.53978 5.00004 9.16669 4.62694 9.16669 4.16671C9.16669 3.70647 9.53978 3.33337 10 3.33337C10.4603 3.33337 10.8334 3.70647 10.8334 4.16671C10.8334 4.62694 10.4603 5.00004 10 5.00004Z"
  />
  <path
    d="M10 10.8334C9.53978 10.8334 9.16669 10.4603 9.16669 10C9.16669 9.5398 9.53978 9.16671 10 9.16671C10.4603 9.16671 10.8334 9.5398 10.8334 10C10.8334 10.4603 10.4603 10.8334 10 10.8334Z"
  />
  <path
    d="M10 16.6667C9.53978 16.6667 9.16669 16.2936 9.16669 15.8334C9.16669 15.3731 9.53978 15 10 15C10.4603 15 10.8334 15.3731 10.8334 15.8334C10.8334 16.2936 10.4603 16.6667 10 16.6667Z"
  />
  <path
    d="M10 5.00004C9.53978 5.00004 9.16669 4.62694 9.16669 4.16671C9.16669 3.70647 9.53978 3.33337 10 3.33337C10.4603 3.33337 10.8334 3.70647 10.8334 4.16671C10.8334 4.62694 10.4603 5.00004 10 5.00004Z"
  />
  <path
    d="M10 10.8334C9.53978 10.8334 9.16669 10.4603 9.16669 10C9.16669 9.5398 9.53978 9.16671 10 9.16671C10.4603 9.16671 10.8334 9.5398 10.8334 10C10.8334 10.4603 10.4603 10.8334 10 10.8334Z"
  />
  <path
    d="M10 16.6667C9.53978 16.6667 9.16669 16.2936 9.16669 15.8334C9.16669 15.3731 9.53978 15 10 15C10.4603 15 10.8334 15.3731 10.8334 15.8334C10.8334 16.2936 10.4603 16.6667 10 16.6667Z"
  />
</svg>`;

export const LineStyleIcon = html`<svg
  width="20"
  height="20"
  viewBox="0 0 20 20"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M2.70825 3.33325C2.70825 2.98807 2.98807 2.70825 3.33325 2.70825H5.83325C6.17843 2.70825 6.45825 2.98807 6.45825 3.33325C6.45825 3.67843 6.17843 3.95825 5.83325 3.95825H3.33325C2.98807 3.95825 2.70825 3.67843 2.70825 3.33325Z"
    fill="#77757D"
  />
  <path
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M8.12492 3.33325C8.12492 2.98807 8.40474 2.70825 8.74992 2.70825L11.2499 2.70825C11.5951 2.70825 11.8749 2.98807 11.8749 3.33325C11.8749 3.67843 11.5951 3.95825 11.2499 3.95825L8.74992 3.95825C8.40474 3.95825 8.12492 3.67843 8.12492 3.33325Z"
    fill="#77757D"
  />
  <path
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M16.6666 3.95825L14.1666 3.95825C13.8214 3.95825 13.5416 3.67843 13.5416 3.33325C13.5416 2.98807 13.8214 2.70825 14.1666 2.70825L16.6666 2.70825C17.0118 2.70825 17.2916 2.98807 17.2916 3.33325C17.2916 3.67843 17.0118 3.95825 16.6666 3.95825Z"
    fill="#77757D"
  />
  <path
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M2.70825 9.99992C2.70825 9.65474 2.98807 9.37492 3.33325 9.37492H16.6666C17.0118 9.37492 17.2916 9.65474 17.2916 9.99992C17.2916 10.3451 17.0118 10.6249 16.6666 10.6249H3.33325C2.98807 10.6249 2.70825 10.3451 2.70825 9.99992Z"
    fill="#77757D"
  />
  <path
    d="M2.70825 16.2499C2.70825 15.6746 3.17462 15.2083 3.74992 15.2083H16.2499C16.8252 15.2083 17.2916 15.6746 17.2916 16.2499C17.2916 16.8252 16.8252 17.2916 16.2499 17.2916H3.74992C3.17462 17.2916 2.70825 16.8252 2.70825 16.2499Z"
    fill="#77757D"
  />
</svg>`;

export const ConnectorXIcon = html`<svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M11.25 7C11.25 5.48122 12.4812 4.25 14 4.25H21C21.4142 4.25 21.75 4.58579 21.75 5C21.75 5.41421 21.4142 5.75 21 5.75H14C13.3096 5.75 12.75 6.30964 12.75 7V17C12.75 18.5188 11.5188 19.75 10 19.75H3C2.58579 19.75 2.25 19.4142 2.25 19C2.25 18.5858 2.58579 18.25 3 18.25H10C10.6904 18.25 11.25 17.6904 11.25 17V7Z"
  />
</svg>`;

export const ConnectorLIcon = html`<svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M20.5303 3.53034C20.8232 3.82323 20.8232 4.29811 20.5303 4.591L4.591 20.5303C4.29811 20.8232 3.82323 20.8232 3.53034 20.5303C3.23745 20.2374 3.23745 19.7626 3.53034 19.4697L19.4697 3.53034C19.7626 3.23745 20.2374 3.23745 20.5303 3.53034Z"
  />
</svg>`;

export const DashLineIcon = html`<svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M20.5303 3.53034C20.8232 3.82323 20.8232 4.29811 20.5303 4.591L17.341 7.78034C17.0481 8.07323 16.5732 8.07323 16.2803 7.78034C15.9874 7.48745 15.9874 7.01257 16.2803 6.71968L19.4697 3.53034C19.7626 3.23745 20.2374 3.23745 20.5303 3.53034Z"
  />
  <path
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M14.1553 9.90534C14.4482 10.1982 14.4482 10.6731 14.1553 10.966L10.966 14.1553C10.6731 14.4482 10.1982 14.4482 9.90534 14.1553C9.61245 13.8624 9.61245 13.3876 9.90534 13.0947L13.0947 9.90534C13.3876 9.61245 13.8624 9.61245 14.1553 9.90534Z"
  />
  <path
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M7.78034 16.2803C8.07323 16.5732 8.07323 17.0481 7.78034 17.341L4.591 20.5303C4.29811 20.8232 3.82323 20.8232 3.53034 20.5303C3.23745 20.2374 3.23745 19.7626 3.53034 19.4697L6.71968 16.2803C7.01257 15.9874 7.48745 15.9874 7.78034 16.2803Z"
  />
</svg>`;

export const BanIcon = html`<svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M6.72068 18.34L18.34 6.72068C19.5331 8.15171 20.25 9.99158 20.25 12C20.25 16.5563 16.5563 20.25 12 20.25C9.99158 20.25 8.15171 19.5331 6.72068 18.34ZM17.2793 5.66002L5.66002 17.2793C4.46691 15.8483 3.75 14.0084 3.75 12C3.75 7.44365 7.44365 3.75 12 3.75C14.0084 3.75 15.8483 4.46691 17.2793 5.66002ZM5.10571 18.8943C6.86929 20.6579 9.30782 21.75 12 21.75C17.3848 21.75 21.75 17.3848 21.75 12C21.75 9.30782 20.6579 6.86929 18.8943 5.10571C17.1307 3.34213 14.6922 2.25 12 2.25C6.61522 2.25 2.25 6.61522 2.25 12C2.25 14.6922 3.34213 17.1307 5.10571 18.8943Z"
  />
</svg>`;

export const NoteIcon = html`<svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M3.25 6C3.25 4.48122 4.48122 3.25 6 3.25H14C14.4142 3.25 14.75 3.58579 14.75 4C14.75 4.41421 14.4142 4.75 14 4.75H6C5.30964 4.75 4.75 5.30964 4.75 6V20C4.75 20.4142 4.41421 20.75 4 20.75C3.58579 20.75 3.25 20.4142 3.25 20V6Z"
  />
  <path
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M20.75 18C20.75 19.5188 19.5188 20.75 18 20.75H10C9.58579 20.75 9.25 20.4142 9.25 20C9.25 19.5858 9.58579 19.25 10 19.25L18 19.25C18.6904 19.25 19.25 18.6904 19.25 18L19.25 4C19.25 3.58579 19.5858 3.25 20 3.25C20.4142 3.25 20.75 3.58579 20.75 4L20.75 18Z"
  />
  <path
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M8.25 9C8.25 8.0335 9.0335 7.25 10 7.25H14C14.9665 7.25 15.75 8.0335 15.75 9V11C15.75 11.9665 14.9665 12.75 14 12.75H10C9.0335 12.75 8.25 11.9665 8.25 11V9ZM10 8.75C9.86193 8.75 9.75 8.86193 9.75 9V11C9.75 11.1381 9.86193 11.25 10 11.25H14C14.1381 11.25 14.25 11.1381 14.25 11V9C14.25 8.86193 14.1381 8.75 14 8.75H10Z"
  />
  <path
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M8.25 16C8.25 15.5858 8.58579 15.25 9 15.25H15C15.4142 15.25 15.75 15.5858 15.75 16C15.75 16.4142 15.4142 16.75 15 16.75H9C8.58579 16.75 8.25 16.4142 8.25 16Z"
  />
</svg>`;

export const AlignLeftIcon = html`<svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <g clip-path="url(#clip0_2131_19971)">
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M4.7085 6.16675C4.7085 5.82157 4.98832 5.54175 5.3335 5.54175H18.6668C19.012 5.54175 19.2918 5.82157 19.2918 6.16675C19.2918 6.51193 19.012 6.79175 18.6668 6.79175H5.3335C4.98832 6.79175 4.7085 6.51193 4.7085 6.16675Z"
      fill="#77757D"
    />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M4.7085 12.0001C4.7085 11.6549 4.98832 11.3751 5.3335 11.3751H13.6668C14.012 11.3751 14.2918 11.6549 14.2918 12.0001C14.2918 12.3453 14.012 12.6251 13.6668 12.6251H5.3335C4.98832 12.6251 4.7085 12.3453 4.7085 12.0001Z"
      fill="#77757D"
    />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M4.7085 17.8334C4.7085 17.4882 4.98832 17.2084 5.3335 17.2084H15.3335C15.6787 17.2084 15.9585 17.4882 15.9585 17.8334C15.9585 18.1786 15.6787 18.4584 15.3335 18.4584H5.3335C4.98832 18.4584 4.7085 18.1786 4.7085 17.8334Z"
      fill="#77757D"
    />
  </g>
  <defs>
    <clipPath id="clip0_2131_19971">
      <rect width="20" height="20" fill="white" transform="translate(2 2)" />
    </clipPath>
  </defs>
</svg>`;

export const AlignCenterIcon = html`<svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <g clip-path="url(#clip0_2131_19972)">
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M4.7085 6.16675C4.7085 5.82157 4.98832 5.54175 5.3335 5.54175H18.6668C19.012 5.54175 19.2918 5.82157 19.2918 6.16675C19.2918 6.51193 19.012 6.79175 18.6668 6.79175H5.3335C4.98832 6.79175 4.7085 6.51193 4.7085 6.16675Z"
      fill="#77757D"
    />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M7.2085 12.0001C7.2085 11.6549 7.48832 11.3751 7.8335 11.3751H16.1668C16.512 11.3751 16.7918 11.6549 16.7918 12.0001C16.7918 12.3453 16.512 12.6251 16.1668 12.6251H7.8335C7.48832 12.6251 7.2085 12.3453 7.2085 12.0001Z"
      fill="#77757D"
    />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M6.37516 17.8334C6.37516 17.4882 6.65498 17.2084 7.00016 17.2084H17.0002C17.3453 17.2084 17.6252 17.4882 17.6252 17.8334C17.6252 18.1786 17.3453 18.4584 17.0002 18.4584H7.00016C6.65498 18.4584 6.37516 18.1786 6.37516 17.8334Z"
      fill="#77757D"
    />
  </g>
  <defs>
    <clipPath id="clip0_2131_19972">
      <rect width="20" height="20" fill="white" transform="translate(2 2)" />
    </clipPath>
  </defs>
</svg>`;

export const AlignRightIcon = html`<svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <g clip-path="url(#clip0_2131_19973)">
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M4.7085 6.16675C4.7085 5.82157 4.98832 5.54175 5.3335 5.54175H18.6668C19.012 5.54175 19.2918 5.82157 19.2918 6.16675C19.2918 6.51193 19.012 6.79175 18.6668 6.79175H5.3335C4.98832 6.79175 4.7085 6.51193 4.7085 6.16675Z"
      fill="#77757D"
    />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M9.7085 12.0001C9.7085 11.6549 9.98832 11.3751 10.3335 11.3751H18.6668C19.012 11.3751 19.2918 11.6549 19.2918 12.0001C19.2918 12.3453 19.012 12.6251 18.6668 12.6251H10.3335C9.98832 12.6251 9.7085 12.3453 9.7085 12.0001Z"
      fill="#77757D"
    />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M8.04183 17.8334C8.04183 17.4882 8.32165 17.2084 8.66683 17.2084H18.6668C19.012 17.2084 19.2918 17.4882 19.2918 17.8334C19.2918 18.1786 19.012 18.4584 18.6668 18.4584H8.66683C8.32165 18.4584 8.04183 18.1786 8.04183 17.8334Z"
      fill="#77757D"
    />
  </g>
  <defs>
    <clipPath id="clip0_2131_19973">
      <rect width="20" height="20" fill="white" transform="translate(2 2)" />
    </clipPath>
  </defs>
</svg>`;
