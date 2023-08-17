import type { BaseBlockModel } from '@blocksuite/store';

import type { ParagraphType } from '../../paragraph-block/index.js';

const createUrl = (svg: string) => {
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  return URL.createObjectURL(blob);
};
const bulleted =
  createUrl(`<svg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'>
<path fill-rule='evenodd' clip-rule='evenodd' d='M2.86686 4.99984C3.23505 4.99984 3.53353 4.70136 3.53353 4.33317C3.53353 3.96498 3.23505 3.6665 2.86686 3.6665C2.49867 3.6665 2.2002 3.96498 2.2002 4.33317C2.2002 4.70136 2.49867 4.99984 2.86686 4.99984ZM5.55577 3.83366C5.27963 3.83364 5.05576 4.05749 5.05575 4.33363C5.05573 4.60977 5.27958 4.83364 5.55572 4.83366L13.5001 4.8341C13.7763 4.83412 14.0002 4.61027 14.0002 4.33413C14.0002 4.05799 13.7763 3.83412 13.5002 3.8341L5.55577 3.83366ZM5.55578 7.50036C5.27963 7.50034 5.05576 7.72419 5.05575 8.00033C5.05573 8.27647 5.27957 8.50034 5.55572 8.50036L13.5002 8.50084C13.7763 8.50085 14.0002 8.27701 14.0002 8.00087C14.0002 7.72473 13.7764 7.50085 13.5002 7.50084L5.55578 7.50036ZM5.55578 11.167C5.27963 11.167 5.05576 11.3909 5.05575 11.667C5.05573 11.9431 5.27957 12.167 5.55571 12.167L13.5002 12.1675C13.7763 12.1675 14.0002 11.9437 14.0002 11.6675C14.0002 11.3914 13.7764 11.1675 13.5002 11.1675L5.55578 11.167ZM3.53353 7.99984C3.53353 8.36803 3.23505 8.6665 2.86686 8.6665C2.49867 8.6665 2.2002 8.36803 2.2002 7.99984C2.2002 7.63165 2.49867 7.33317 2.86686 7.33317C3.23505 7.33317 3.53353 7.63165 3.53353 7.99984ZM2.86686 12.3332C3.23505 12.3332 3.53353 12.0347 3.53353 11.6665C3.53353 11.2983 3.23505 10.9998 2.86686 10.9998C2.49867 10.9998 2.2002 11.2983 2.2002 11.6665C2.2002 12.0347 2.49867 12.3332 2.86686 12.3332Z' fill='#77757D'/>
</svg>
`);
const numbered =
  createUrl(`<svg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'>
<path fill-rule='evenodd' clip-rule='evenodd' d='M2.75263 3.84129C2.7875 3.82957 2.81892 3.8114 2.85247 3.78811L3.02274 3.67014V5.09323C3.02274 5.21832 3.06494 5.32685 3.14381 5.40413C3.22253 5.48125 3.33201 5.52164 3.45631 5.52164C3.58061 5.52164 3.69008 5.48125 3.7688 5.40413C3.84767 5.32685 3.88988 5.21832 3.88988 5.09323V3.28915C3.88988 3.14995 3.84638 3.02894 3.75909 2.9427C3.67187 2.85652 3.54844 2.8125 3.40289 2.8125C3.25521 2.8125 3.11383 2.82716 2.95315 2.93428L2.50128 3.2361C2.38666 3.31388 2.3335 3.41744 2.3335 3.54244C2.3335 3.72457 2.46885 3.85712 2.643 3.85712C2.68225 3.85712 2.71723 3.85318 2.75263 3.84129ZM6.27061 3.73425C5.98781 3.73424 5.75855 3.96348 5.75853 4.24627C5.75851 4.52907 5.98775 4.75834 6.27055 4.75835L13.1548 4.75877C13.4375 4.75878 13.6668 4.52955 13.6668 4.24675C13.6668 3.96395 13.4376 3.73469 13.1548 3.73467L6.27061 3.73425ZM6.27061 7.48928C5.98781 7.48926 5.75855 7.7185 5.75853 8.0013C5.75851 8.28409 5.98775 8.51336 6.27055 8.51338L13.1548 8.51379C13.4375 8.51381 13.6668 8.28457 13.6668 8.00177C13.6668 7.71898 13.4376 7.48971 13.1548 7.48969L6.27061 7.48928ZM6.27061 11.2443C5.98781 11.2443 5.75855 11.4735 5.75853 11.7563C5.75851 12.0391 5.98775 12.2684 6.27055 12.2684L13.1548 12.2688C13.4375 12.2688 13.6668 12.0396 13.6668 11.7568C13.6668 11.474 13.4376 11.2447 13.1548 11.2447L6.27061 11.2443ZM4.41634 7.40927C4.42422 7.36527 4.4281 7.31875 4.4281 7.26863C4.4281 6.81717 4.04212 6.51219 3.43732 6.51219C3.00309 6.51219 2.65331 6.69656 2.52235 6.99293C2.51378 7.01271 2.50697 7.03274 2.50184 7.05312C2.50698 7.03272 2.51379 7.01266 2.52237 6.99286C2.65332 6.69649 3.00311 6.51212 3.43733 6.51212C4.04214 6.51212 4.42811 6.81711 4.42811 7.26856C4.42811 7.31871 4.42423 7.36525 4.41634 7.40927ZM3.41666 8.50235L3.41664 8.50237V8.51615H4.20582C4.38847 8.51615 4.49185 8.62471 4.49185 8.79185C4.49185 8.81304 4.49012 8.83337 4.4867 8.8527C4.49013 8.83335 4.49187 8.813 4.49187 8.79178C4.49187 8.62464 4.38848 8.51609 4.20583 8.51609H3.41666V8.50235ZM2.49348 8.66081C2.51659 8.56781 2.5776 8.48686 2.68261 8.39891L3.36669 7.81306C3.59238 7.61941 3.68741 7.51137 3.71552 7.39877C3.68743 7.51139 3.5924 7.61944 3.36667 7.81313L2.6826 8.39898C2.57761 8.48691 2.5166 8.56784 2.49348 8.66081ZM3.00245 7.45433C3.06576 7.41672 3.11852 7.35967 3.16964 7.28485C3.21335 7.22174 3.25281 7.18119 3.29247 7.15611C3.33084 7.13184 3.37305 7.11972 3.42699 7.11972C3.50193 7.11972 3.55935 7.14252 3.59712 7.17625C3.63429 7.20945 3.65682 7.25695 3.65682 7.31681C3.65682 7.42976 3.60418 7.51932 3.32223 7.76125L2.63848 8.34682C2.49238 8.46926 2.41446 8.58999 2.41446 8.75215C2.41446 8.85599 2.44402 8.95417 2.51569 9.0264C2.58758 9.09884 2.69247 9.13575 2.82391 9.13575H4.20583C4.3113 9.13575 4.40151 9.10312 4.46551 9.0394C4.52944 8.97575 4.56014 8.88812 4.56014 8.79178C4.56014 8.69402 4.52962 8.60612 4.4653 8.54266C4.40102 8.47924 4.31071 8.44781 4.20583 8.44781H3.58427L3.91453 8.16277C4.10644 7.99655 4.25236 7.86439 4.34915 7.7297C4.44874 7.59113 4.49639 7.45014 4.49639 7.26856C4.49639 7.02135 4.38982 6.81239 4.20121 6.66698C4.01414 6.52275 3.75049 6.44385 3.43733 6.44385C2.98691 6.44385 2.6054 6.63603 2.45972 6.96572C2.43335 7.02657 2.42135 7.0893 2.42135 7.15484C2.42135 7.25786 2.45508 7.34813 2.52273 7.4124C2.58996 7.47627 2.68328 7.50742 2.78945 7.50742C2.86827 7.50742 2.93794 7.49266 3.00245 7.45433ZM2.44775 10.7189C2.54915 10.4426 2.89358 10.1497 3.48551 10.1497C3.79028 10.1497 4.06201 10.2142 4.2587 10.3428C4.45674 10.4723 4.57779 10.6665 4.57779 10.9198C4.57779 11.2417 4.37235 11.4558 4.11613 11.5474C4.27228 11.5802 4.40301 11.6427 4.5004 11.7331C4.62307 11.8471 4.69016 12.0029 4.69016 12.1915C4.69016 12.4609 4.57389 12.6823 4.36382 12.8352C4.15486 12.9873 3.85534 13.0702 3.48925 13.0702C2.84939 13.0702 2.49302 12.7648 2.39522 12.4914C2.3769 12.4405 2.36887 12.3841 2.36887 12.3394C2.36887 12.2332 2.40451 12.1439 2.47207 12.0814C2.53931 12.0192 2.63451 11.9869 2.74761 11.9869C2.82533 11.9869 2.89225 11.9997 2.95092 12.0292C3.00974 12.0587 3.05785 12.1038 3.09973 12.1646C3.14935 12.2372 3.19619 12.2915 3.2569 12.3282C3.31713 12.3647 3.39437 12.3858 3.50798 12.3858C3.69342 12.3858 3.8147 12.2759 3.8147 12.1334C3.8147 12.047 3.78226 11.984 3.7209 11.9411C3.65761 11.8969 3.55985 11.8716 3.42558 11.8716H3.40685C3.30795 11.8716 3.22859 11.8441 3.1739 11.7905C3.11916 11.7368 3.09366 11.6616 3.09366 11.5753C3.09366 11.4924 3.11937 11.4179 3.17378 11.364C3.22823 11.3101 3.30745 11.2809 3.40685 11.2809H3.42558C3.54389 11.2809 3.63283 11.255 3.69126 11.2123C3.74841 11.1705 3.77911 11.1107 3.77911 11.0341C3.77911 10.9598 3.75194 10.9019 3.70443 10.8619C3.65624 10.8214 3.58381 10.7967 3.48925 10.7967C3.41343 10.7967 3.35069 10.8121 3.29851 10.8418C3.24639 10.8715 3.20271 10.9168 3.16682 10.9798C3.12025 11.0623 3.06988 11.1219 3.00589 11.1605C2.94171 11.1991 2.86754 11.2143 2.77758 11.2143C2.66225 11.2143 2.57171 11.1804 2.50997 11.1186C2.44832 11.057 2.41944 10.9716 2.41944 10.8768C2.41944 10.8201 2.42781 10.7748 2.44775 10.7189Z' fill='#77757D'/>
</svg>`);
const todo =
  createUrl(`<svg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'>
<path fill-rule='evenodd' clip-rule='evenodd' d='M2.75263 3.84129C2.7875 3.82957 2.81892 3.8114 2.85247 3.78811L3.02274 3.67014V5.09323C3.02274 5.21832 3.06494 5.32685 3.14381 5.40413C3.22253 5.48125 3.33201 5.52164 3.45631 5.52164C3.58061 5.52164 3.69008 5.48125 3.7688 5.40413C3.84767 5.32685 3.88988 5.21832 3.88988 5.09323V3.28915C3.88988 3.14995 3.84638 3.02894 3.75909 2.9427C3.67187 2.85652 3.54844 2.8125 3.40289 2.8125C3.25521 2.8125 3.11383 2.82716 2.95315 2.93428L2.50128 3.2361C2.38666 3.31388 2.3335 3.41744 2.3335 3.54244C2.3335 3.72457 2.46885 3.85712 2.643 3.85712C2.68225 3.85712 2.71723 3.85318 2.75263 3.84129ZM6.27061 3.73425C5.98781 3.73424 5.75855 3.96348 5.75853 4.24627C5.75851 4.52907 5.98775 4.75834 6.27055 4.75835L13.1548 4.75877C13.4375 4.75878 13.6668 4.52955 13.6668 4.24675C13.6668 3.96395 13.4376 3.73469 13.1548 3.73467L6.27061 3.73425ZM6.27061 7.48928C5.98781 7.48926 5.75855 7.7185 5.75853 8.0013C5.75851 8.28409 5.98775 8.51336 6.27055 8.51338L13.1548 8.51379C13.4375 8.51381 13.6668 8.28457 13.6668 8.00177C13.6668 7.71898 13.4376 7.48971 13.1548 7.48969L6.27061 7.48928ZM6.27061 11.2443C5.98781 11.2443 5.75855 11.4735 5.75853 11.7563C5.75851 12.0391 5.98775 12.2684 6.27055 12.2684L13.1548 12.2688C13.4375 12.2688 13.6668 12.0396 13.6668 11.7568C13.6668 11.474 13.4376 11.2447 13.1548 11.2447L6.27061 11.2443ZM4.41634 7.40927C4.42422 7.36527 4.4281 7.31875 4.4281 7.26863C4.4281 6.81717 4.04212 6.51219 3.43732 6.51219C3.00309 6.51219 2.65331 6.69656 2.52235 6.99293C2.51378 7.01271 2.50697 7.03274 2.50184 7.05312C2.50698 7.03272 2.51379 7.01266 2.52237 6.99286C2.65332 6.69649 3.00311 6.51212 3.43733 6.51212C4.04214 6.51212 4.42811 6.81711 4.42811 7.26856C4.42811 7.31871 4.42423 7.36525 4.41634 7.40927ZM3.41666 8.50235L3.41664 8.50237V8.51615H4.20582C4.38847 8.51615 4.49185 8.62471 4.49185 8.79185C4.49185 8.81304 4.49012 8.83337 4.4867 8.8527C4.49013 8.83335 4.49187 8.813 4.49187 8.79178C4.49187 8.62464 4.38848 8.51609 4.20583 8.51609H3.41666V8.50235ZM2.49348 8.66081C2.51659 8.56781 2.5776 8.48686 2.68261 8.39891L3.36669 7.81306C3.59238 7.61941 3.68741 7.51137 3.71552 7.39877C3.68743 7.51139 3.5924 7.61944 3.36667 7.81313L2.6826 8.39898C2.57761 8.48691 2.5166 8.56784 2.49348 8.66081ZM3.00245 7.45433C3.06576 7.41672 3.11852 7.35967 3.16964 7.28485C3.21335 7.22174 3.25281 7.18119 3.29247 7.15611C3.33084 7.13184 3.37305 7.11972 3.42699 7.11972C3.50193 7.11972 3.55935 7.14252 3.59712 7.17625C3.63429 7.20945 3.65682 7.25695 3.65682 7.31681C3.65682 7.42976 3.60418 7.51932 3.32223 7.76125L2.63848 8.34682C2.49238 8.46926 2.41446 8.58999 2.41446 8.75215C2.41446 8.85599 2.44402 8.95417 2.51569 9.0264C2.58758 9.09884 2.69247 9.13575 2.82391 9.13575H4.20583C4.3113 9.13575 4.40151 9.10312 4.46551 9.0394C4.52944 8.97575 4.56014 8.88812 4.56014 8.79178C4.56014 8.69402 4.52962 8.60612 4.4653 8.54266C4.40102 8.47924 4.31071 8.44781 4.20583 8.44781H3.58427L3.91453 8.16277C4.10644 7.99655 4.25236 7.86439 4.34915 7.7297C4.44874 7.59113 4.49639 7.45014 4.49639 7.26856C4.49639 7.02135 4.38982 6.81239 4.20121 6.66698C4.01414 6.52275 3.75049 6.44385 3.43733 6.44385C2.98691 6.44385 2.6054 6.63603 2.45972 6.96572C2.43335 7.02657 2.42135 7.0893 2.42135 7.15484C2.42135 7.25786 2.45508 7.34813 2.52273 7.4124C2.58996 7.47627 2.68328 7.50742 2.78945 7.50742C2.86827 7.50742 2.93794 7.49266 3.00245 7.45433ZM2.44775 10.7189C2.54915 10.4426 2.89358 10.1497 3.48551 10.1497C3.79028 10.1497 4.06201 10.2142 4.2587 10.3428C4.45674 10.4723 4.57779 10.6665 4.57779 10.9198C4.57779 11.2417 4.37235 11.4558 4.11613 11.5474C4.27228 11.5802 4.40301 11.6427 4.5004 11.7331C4.62307 11.8471 4.69016 12.0029 4.69016 12.1915C4.69016 12.4609 4.57389 12.6823 4.36382 12.8352C4.15486 12.9873 3.85534 13.0702 3.48925 13.0702C2.84939 13.0702 2.49302 12.7648 2.39522 12.4914C2.3769 12.4405 2.36887 12.3841 2.36887 12.3394C2.36887 12.2332 2.40451 12.1439 2.47207 12.0814C2.53931 12.0192 2.63451 11.9869 2.74761 11.9869C2.82533 11.9869 2.89225 11.9997 2.95092 12.0292C3.00974 12.0587 3.05785 12.1038 3.09973 12.1646C3.14935 12.2372 3.19619 12.2915 3.2569 12.3282C3.31713 12.3647 3.39437 12.3858 3.50798 12.3858C3.69342 12.3858 3.8147 12.2759 3.8147 12.1334C3.8147 12.047 3.78226 11.984 3.7209 11.9411C3.65761 11.8969 3.55985 11.8716 3.42558 11.8716H3.40685C3.30795 11.8716 3.22859 11.8441 3.1739 11.7905C3.11916 11.7368 3.09366 11.6616 3.09366 11.5753C3.09366 11.4924 3.11937 11.4179 3.17378 11.364C3.22823 11.3101 3.30745 11.2809 3.40685 11.2809H3.42558C3.54389 11.2809 3.63283 11.255 3.69126 11.2123C3.74841 11.1705 3.77911 11.1107 3.77911 11.0341C3.77911 10.9598 3.75194 10.9019 3.70443 10.8619C3.65624 10.8214 3.58381 10.7967 3.48925 10.7967C3.41343 10.7967 3.35069 10.8121 3.29851 10.8418C3.24639 10.8715 3.20271 10.9168 3.16682 10.9798C3.12025 11.0623 3.06988 11.1219 3.00589 11.1605C2.94171 11.1991 2.86754 11.2143 2.77758 11.2143C2.66225 11.2143 2.57171 11.1804 2.50997 11.1186C2.44832 11.057 2.41944 10.9716 2.41944 10.8768C2.41944 10.8201 2.42781 10.7748 2.44775 10.7189Z' fill='#77757D'/>
</svg>`);
const toggle =
  createUrl(`<svg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'>
<path fill-rule='evenodd' clip-rule='evenodd' d='M2.75263 3.84129C2.7875 3.82957 2.81892 3.8114 2.85247 3.78811L3.02274 3.67014V5.09323C3.02274 5.21832 3.06494 5.32685 3.14381 5.40413C3.22253 5.48125 3.33201 5.52164 3.45631 5.52164C3.58061 5.52164 3.69008 5.48125 3.7688 5.40413C3.84767 5.32685 3.88988 5.21832 3.88988 5.09323V3.28915C3.88988 3.14995 3.84638 3.02894 3.75909 2.9427C3.67187 2.85652 3.54844 2.8125 3.40289 2.8125C3.25521 2.8125 3.11383 2.82716 2.95315 2.93428L2.50128 3.2361C2.38666 3.31388 2.3335 3.41744 2.3335 3.54244C2.3335 3.72457 2.46885 3.85712 2.643 3.85712C2.68225 3.85712 2.71723 3.85318 2.75263 3.84129ZM6.27061 3.73425C5.98781 3.73424 5.75855 3.96348 5.75853 4.24627C5.75851 4.52907 5.98775 4.75834 6.27055 4.75835L13.1548 4.75877C13.4375 4.75878 13.6668 4.52955 13.6668 4.24675C13.6668 3.96395 13.4376 3.73469 13.1548 3.73467L6.27061 3.73425ZM6.27061 7.48928C5.98781 7.48926 5.75855 7.7185 5.75853 8.0013C5.75851 8.28409 5.98775 8.51336 6.27055 8.51338L13.1548 8.51379C13.4375 8.51381 13.6668 8.28457 13.6668 8.00177C13.6668 7.71898 13.4376 7.48971 13.1548 7.48969L6.27061 7.48928ZM6.27061 11.2443C5.98781 11.2443 5.75855 11.4735 5.75853 11.7563C5.75851 12.0391 5.98775 12.2684 6.27055 12.2684L13.1548 12.2688C13.4375 12.2688 13.6668 12.0396 13.6668 11.7568C13.6668 11.474 13.4376 11.2447 13.1548 11.2447L6.27061 11.2443ZM4.41634 7.40927C4.42422 7.36527 4.4281 7.31875 4.4281 7.26863C4.4281 6.81717 4.04212 6.51219 3.43732 6.51219C3.00309 6.51219 2.65331 6.69656 2.52235 6.99293C2.51378 7.01271 2.50697 7.03274 2.50184 7.05312C2.50698 7.03272 2.51379 7.01266 2.52237 6.99286C2.65332 6.69649 3.00311 6.51212 3.43733 6.51212C4.04214 6.51212 4.42811 6.81711 4.42811 7.26856C4.42811 7.31871 4.42423 7.36525 4.41634 7.40927ZM3.41666 8.50235L3.41664 8.50237V8.51615H4.20582C4.38847 8.51615 4.49185 8.62471 4.49185 8.79185C4.49185 8.81304 4.49012 8.83337 4.4867 8.8527C4.49013 8.83335 4.49187 8.813 4.49187 8.79178C4.49187 8.62464 4.38848 8.51609 4.20583 8.51609H3.41666V8.50235ZM2.49348 8.66081C2.51659 8.56781 2.5776 8.48686 2.68261 8.39891L3.36669 7.81306C3.59238 7.61941 3.68741 7.51137 3.71552 7.39877C3.68743 7.51139 3.5924 7.61944 3.36667 7.81313L2.6826 8.39898C2.57761 8.48691 2.5166 8.56784 2.49348 8.66081ZM3.00245 7.45433C3.06576 7.41672 3.11852 7.35967 3.16964 7.28485C3.21335 7.22174 3.25281 7.18119 3.29247 7.15611C3.33084 7.13184 3.37305 7.11972 3.42699 7.11972C3.50193 7.11972 3.55935 7.14252 3.59712 7.17625C3.63429 7.20945 3.65682 7.25695 3.65682 7.31681C3.65682 7.42976 3.60418 7.51932 3.32223 7.76125L2.63848 8.34682C2.49238 8.46926 2.41446 8.58999 2.41446 8.75215C2.41446 8.85599 2.44402 8.95417 2.51569 9.0264C2.58758 9.09884 2.69247 9.13575 2.82391 9.13575H4.20583C4.3113 9.13575 4.40151 9.10312 4.46551 9.0394C4.52944 8.97575 4.56014 8.88812 4.56014 8.79178C4.56014 8.69402 4.52962 8.60612 4.4653 8.54266C4.40102 8.47924 4.31071 8.44781 4.20583 8.44781H3.58427L3.91453 8.16277C4.10644 7.99655 4.25236 7.86439 4.34915 7.7297C4.44874 7.59113 4.49639 7.45014 4.49639 7.26856C4.49639 7.02135 4.38982 6.81239 4.20121 6.66698C4.01414 6.52275 3.75049 6.44385 3.43733 6.44385C2.98691 6.44385 2.6054 6.63603 2.45972 6.96572C2.43335 7.02657 2.42135 7.0893 2.42135 7.15484C2.42135 7.25786 2.45508 7.34813 2.52273 7.4124C2.58996 7.47627 2.68328 7.50742 2.78945 7.50742C2.86827 7.50742 2.93794 7.49266 3.00245 7.45433ZM2.44775 10.7189C2.54915 10.4426 2.89358 10.1497 3.48551 10.1497C3.79028 10.1497 4.06201 10.2142 4.2587 10.3428C4.45674 10.4723 4.57779 10.6665 4.57779 10.9198C4.57779 11.2417 4.37235 11.4558 4.11613 11.5474C4.27228 11.5802 4.40301 11.6427 4.5004 11.7331C4.62307 11.8471 4.69016 12.0029 4.69016 12.1915C4.69016 12.4609 4.57389 12.6823 4.36382 12.8352C4.15486 12.9873 3.85534 13.0702 3.48925 13.0702C2.84939 13.0702 2.49302 12.7648 2.39522 12.4914C2.3769 12.4405 2.36887 12.3841 2.36887 12.3394C2.36887 12.2332 2.40451 12.1439 2.47207 12.0814C2.53931 12.0192 2.63451 11.9869 2.74761 11.9869C2.82533 11.9869 2.89225 11.9997 2.95092 12.0292C3.00974 12.0587 3.05785 12.1038 3.09973 12.1646C3.14935 12.2372 3.19619 12.2915 3.2569 12.3282C3.31713 12.3647 3.39437 12.3858 3.50798 12.3858C3.69342 12.3858 3.8147 12.2759 3.8147 12.1334C3.8147 12.047 3.78226 11.984 3.7209 11.9411C3.65761 11.8969 3.55985 11.8716 3.42558 11.8716H3.40685C3.30795 11.8716 3.22859 11.8441 3.1739 11.7905C3.11916 11.7368 3.09366 11.6616 3.09366 11.5753C3.09366 11.4924 3.11937 11.4179 3.17378 11.364C3.22823 11.3101 3.30745 11.2809 3.40685 11.2809H3.42558C3.54389 11.2809 3.63283 11.255 3.69126 11.2123C3.74841 11.1705 3.77911 11.1107 3.77911 11.0341C3.77911 10.9598 3.75194 10.9019 3.70443 10.8619C3.65624 10.8214 3.58381 10.7967 3.48925 10.7967C3.41343 10.7967 3.35069 10.8121 3.29851 10.8418C3.24639 10.8715 3.20271 10.9168 3.16682 10.9798C3.12025 11.0623 3.06988 11.1219 3.00589 11.1605C2.94171 11.1991 2.86754 11.2143 2.77758 11.2143C2.66225 11.2143 2.57171 11.1804 2.50997 11.1186C2.44832 11.057 2.41944 10.9716 2.41944 10.8768C2.41944 10.8201 2.42781 10.7748 2.44775 10.7189Z' fill='#77757D'/>
</svg>`);
const text =
  createUrl(`<svg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'>
<path fill-rule='evenodd' clip-rule='evenodd' d='M2.16675 2.6665C2.16675 2.39036 2.39061 2.1665 2.66675 2.1665H13.3334C13.6096 2.1665 13.8334 2.39036 13.8334 2.6665V4.44428C13.8334 4.72042 13.6096 4.94428 13.3334 4.94428C13.0573 4.94428 12.8334 4.72042 12.8334 4.44428V3.1665H8.50008V12.8332H10.6667C10.9429 12.8332 11.1667 13.057 11.1667 13.3332C11.1667 13.6093 10.9429 13.8332 10.6667 13.8332H5.33341C5.05727 13.8332 4.83341 13.6093 4.83341 13.3332C4.83341 13.057 5.05727 12.8332 5.33341 12.8332H7.50008V3.1665H3.16675V4.44428C3.16675 4.72042 2.94289 4.94428 2.66675 4.94428C2.39061 4.94428 2.16675 4.72042 2.16675 4.44428V2.6665Z' fill='#77757D'/>
</svg>
`);
const quote = createUrl(`<svg
width="20"
height="20"
viewBox="0 0 24 24"
xmlns="http://www.w3.org/2000/svg"
>
<path
fill-rule="evenodd"
clip-rule="evenodd"
d="M3.75 4C4.16421 4 4.5 4.33579 4.5 4.75L4.5 19.25C4.5 19.6642 4.16421 20 3.75 20C3.33579 20 3 19.6642 3 19.25L3 4.75C3 4.33579 3.33579 4 3.75 4Z"
/>
<path
fill-rule="evenodd"
clip-rule="evenodd"
d="M19 6.75C19 7.16421 18.6642 7.5 18.25 7.5H7.75C7.33579 7.5 7 7.16421 7 6.75C7 6.33579 7.33579 6 7.75 6H18.25C18.6642 6 19 6.33579 19 6.75Z"
/>
<path
fill-rule="evenodd"
clip-rule="evenodd"
d="M17 11.75C17 12.1642 16.6642 12.5 16.25 12.5H7.75C7.33579 12.5 7 12.1642 7 11.75C7 11.3358 7.33579 11 7.75 11H16.25C16.6642 11 17 11.3358 17 11.75Z"
/>
<path
fill-rule="evenodd"
clip-rule="evenodd"
d="M21 16.75C21 17.1642 20.6642 17.5 20.25 17.5H7.75C7.33579 17.5 7 17.1642 7 16.75C7 16.3358 7.33579 16 7.75 16H20.25C20.6642 16 21 16.3358 21 16.75Z"
/>
</svg>`);
const h1 = createUrl(`<svg
width="20"
height="20"
viewBox="0 0 24 24"
xmlns="http://www.w3.org/2000/svg"
>
<path
fill-rule="evenodd"
clip-rule="evenodd"
d="M3 4.25C3.41421 4.25 3.75 4.58579 3.75 5V11.25H10.25V5C10.25 4.58579 10.5858 4.25 11 4.25C11.4142 4.25 11.75 4.58579 11.75 5V19C11.75 19.4142 11.4142 19.75 11 19.75C10.5858 19.75 10.25 19.4142 10.25 19V12.75H3.75V19C3.75 19.4142 3.41421 19.75 3 19.75C2.58579 19.75 2.25 19.4142 2.25 19V5C2.25 4.58579 2.58579 4.25 3 4.25Z"
/>
<path
fill-rule="evenodd"
clip-rule="evenodd"
d="M16.7499 6.81081C16.7231 6.83762 16.6947 6.86599 16.6646 6.89602L14.5303 9.03033C14.2374 9.32322 13.7626 9.32322 13.4697 9.03033C13.1768 8.73744 13.1768 8.26256 13.4697 7.96967L15.604 5.83536C15.6113 5.82808 15.6185 5.82081 15.6258 5.81357C15.8211 5.61819 16.0018 5.43743 16.1578 5.30688C16.3005 5.18739 16.5575 4.98807 16.9019 4.96096C17.3008 4.92957 17.6906 5.09103 17.9505 5.3953C18.1749 5.65804 18.2157 5.98068 18.2321 6.16609C18.25 6.36867 18.25 6.62428 18.25 6.90057C18.25 6.91081 18.25 6.92108 18.25 6.93137V18.25H21C21.4142 18.25 21.75 18.5858 21.75 19C21.75 19.4142 21.4142 19.75 21 19.75H14C13.5858 19.75 13.25 19.4142 13.25 19C13.25 18.5858 13.5858 18.25 14 18.25H16.75V6.93137C16.75 6.88891 16.75 6.84878 16.7499 6.81081Z"
/>
</svg>
`);
const h2 = createUrl(`<svg
width="20"
height="20"
viewBox="0 0 24 24"
xmlns="http://www.w3.org/2000/svg"
>
<path
fill-rule="evenodd"
clip-rule="evenodd"
d="M3 4.25C3.41421 4.25 3.75 4.58579 3.75 5V11.25H10.25V5C10.25 4.58579 10.5858 4.25 11 4.25C11.4142 4.25 11.75 4.58579 11.75 5V19C11.75 19.4142 11.4142 19.75 11 19.75C10.5858 19.75 10.25 19.4142 10.25 19V12.75H3.75V19C3.75 19.4142 3.41421 19.75 3 19.75C2.58579 19.75 2.25 19.4142 2.25 19V5C2.25 4.58579 2.58579 4.25 3 4.25Z"
/>
<path
fill-rule="evenodd"
clip-rule="evenodd"
d="M16.9057 6.75035C16.3267 6.802 15.7718 7.01946 15.3049 7.3801C14.8318 7.74548 14.4682 8.24309 14.2591 8.81605C14.1172 9.20517 13.6866 9.40552 13.2975 9.26355C12.9084 9.12157 12.708 8.69103 12.85 8.30191C13.155 7.46589 13.6877 6.73376 14.388 6.19294C15.0884 5.65199 15.927 5.32534 16.8055 5.25346L16.8277 5.25164L16.8499 5.25115C17.8967 5.22771 18.9191 5.56392 19.7537 6.20306C20.5868 6.84102 21.1843 7.74329 21.4548 8.76409C21.7891 9.97619 21.5425 11.1146 21.1354 12.0147C20.7302 12.9106 20.1448 13.6215 19.7055 14.0279L19.6986 14.0343L19.6916 14.0405C18.9491 14.6937 18.1744 15.3076 17.3705 15.88C16.4743 16.5815 15.6527 17.3759 14.9186 18.25H21.2C21.6142 18.25 21.95 18.5858 21.95 19C21.95 19.4142 21.6142 19.75 21.2 19.75H13.5917C12.9084 19.75 12.4943 18.9759 12.9002 18.4076C13.9053 16.9999 15.1041 15.7469 16.4602 14.6877L16.4735 14.6773L16.4872 14.6675C17.2512 14.1242 17.9876 13.5412 18.6934 12.9208C19.0046 12.631 19.4584 12.0827 19.7687 11.3966C20.0787 10.7111 20.2239 9.93968 20.008 9.16007L20.0056 9.15134C19.8193 8.44582 19.4083 7.82782 18.8418 7.394C18.2815 6.965 17.6006 6.73982 16.9057 6.75035Z"
/>
</svg>
`);
const h3 = createUrl(`<svg
width="20"
height="20"
viewBox="0 0 24 24"
xmlns="http://www.w3.org/2000/svg"
>
<path
fill-rule="evenodd"
clip-rule="evenodd"
d="M3 4.25C3.41421 4.25 3.75 4.58579 3.75 5V11.25H10.25V5C10.25 4.58579 10.5858 4.25 11 4.25C11.4142 4.25 11.75 4.58579 11.75 5V19C11.75 19.4142 11.4142 19.75 11 19.75C10.5858 19.75 10.25 19.4142 10.25 19V12.75H3.75V19C3.75 19.4142 3.41421 19.75 3 19.75C2.58579 19.75 2.25 19.4142 2.25 19V5C2.25 4.58579 2.58579 4.25 3 4.25Z"
/>
<path
fill-rule="evenodd"
clip-rule="evenodd"
d="M17.3196 6.75154C16.8178 6.78189 16.3346 6.95347 15.926 7.24657C15.5153 7.54113 15.1968 7.94629 15.0075 8.41487C14.8523 8.79893 14.4152 8.98449 14.0312 8.82933C13.6471 8.67418 13.4616 8.23706 13.6167 7.853C13.9125 7.1209 14.4101 6.48789 15.0517 6.02769C15.6933 5.56749 16.4525 5.29903 17.2408 5.25359L17.2482 5.25316L17.2557 5.25288C18.2533 5.21525 19.2296 5.54803 19.9965 6.18714C20.7634 6.82626 21.2668 7.72652 21.4097 8.71457L21.4143 8.74618L21.4161 8.77807C21.4603 9.53257 21.2968 10.2847 20.9433 10.9528C20.6919 11.4279 20.3514 11.8475 19.9423 12.1898C20.4639 12.4619 20.9143 12.8568 21.2521 13.4177C21.8984 14.4739 21.8675 15.759 21.4573 16.838C21.0461 17.9197 20.2127 18.9107 19.0815 19.378L19.0786 19.3792C18.0333 19.8058 16.8745 19.8662 15.7905 19.5506C14.7065 19.2351 13.7612 18.5621 13.1082 17.6411C12.8686 17.3032 12.9483 16.8351 13.2862 16.5955C13.6241 16.3559 14.0923 16.4356 14.3318 16.7735C14.789 17.4183 15.4508 17.8895 16.2098 18.1104C16.9681 18.3312 17.7789 18.2891 18.5103 17.991C19.1943 17.7079 19.7645 17.0696 20.0552 16.305C20.3467 15.5381 20.3161 14.7606 19.9717 14.199L19.9682 14.1933C19.5426 13.4852 18.7016 13.1471 17.2275 13.1471C17.2201 13.1471 17.2121 13.1471 17.2038 13.1471C17.1523 13.1472 17.0876 13.1473 17.0508 13.1451C17.0439 13.1447 17.0076 13.1426 16.9647 13.1352L16.9637 13.135C16.9524 13.1332 16.865 13.1191 16.7673 13.0722L16.7655 13.0714C16.7295 13.0542 16.547 12.967 16.4309 12.7512C16.3831 12.6425 16.3413 12.3989 16.3519 12.2701C16.3793 12.1601 16.4656 11.9821 16.5164 11.914C16.6196 11.7908 16.7354 11.7347 16.7637 11.721C16.8085 11.6993 16.8465 11.6864 16.8651 11.6805C16.9035 11.6683 16.9346 11.662 16.9457 11.6597C16.9718 11.6545 16.993 11.6517 16.9996 11.6509C17.024 11.6477 17.0535 11.645 17.0677 11.6438L17.0706 11.6435C17.0761 11.643 17.082 11.6425 17.0882 11.6419C17.1709 11.6346 17.3161 11.6217 17.4965 11.597C17.9218 11.5387 18.3862 11.4336 18.6392 11.2811L18.6415 11.2798C19.0547 11.0326 19.3923 10.6769 19.6175 10.2513C19.8377 9.83509 19.9422 9.36767 19.9204 8.89772C19.8245 8.28862 19.5105 7.73468 19.0362 7.33947C18.5557 6.93905 17.9446 6.7298 17.3196 6.75154Z"
/>
</svg>
`);
const h4 = createUrl(`<svg
width="20"
height="20"
viewBox="0 0 24 24"
xmlns="http://www.w3.org/2000/svg"
>
<path
fill-rule="evenodd"
clip-rule="evenodd"
d="M3 4.25C3.41421 4.25 3.75 4.58579 3.75 5V11.25H10.25V5C10.25 4.58579 10.5858 4.25 11 4.25C11.4142 4.25 11.75 4.58579 11.75 5V19C11.75 19.4142 11.4142 19.75 11 19.75C10.5858 19.75 10.25 19.4142 10.25 19V12.75H3.75V19C3.75 19.4142 3.41421 19.75 3 19.75C2.58579 19.75 2.25 19.4142 2.25 19V5C2.25 4.58579 2.58579 4.25 3 4.25Z"
/>
<path
fill-rule="evenodd"
clip-rule="evenodd"
d="M18.1928 5.85878C18.6593 5.15904 19.75 5.48927 19.75 6.33028V14.25H21C21.4142 14.25 21.75 14.5858 21.75 15C21.75 15.4142 21.4142 15.75 21 15.75H19.75V19C19.75 19.4142 19.4142 19.75 19 19.75C18.5858 19.75 18.25 19.4142 18.25 19V15.75H13.1869C12.508 15.75 12.103 14.9934 12.4796 14.4285L18.1928 5.85878ZM18.25 14.25V8.47708L14.4014 14.25H18.25Z"
/>
</svg>
`);
const h5 = createUrl(`<svg
width="20"
height="20"
viewBox="0 0 24 24"
xmlns="http://www.w3.org/2000/svg"
>
<path
fill-rule="evenodd"
clip-rule="evenodd"
d="M3 4.25C3.41421 4.25 3.75 4.58579 3.75 5V11.25H10.25V5C10.25 4.58579 10.5858 4.25 11 4.25C11.4142 4.25 11.75 4.58579 11.75 5V19C11.75 19.4142 11.4142 19.75 11 19.75C10.5858 19.75 10.25 19.4142 10.25 19V12.75H3.75V19C3.75 19.4142 3.41421 19.75 3 19.75C2.58579 19.75 2.25 19.4142 2.25 19V5C2.25 4.58579 2.58579 4.25 3 4.25Z"
/>
<path
fill-rule="evenodd"
clip-rule="evenodd"
d="M13.9558 5.94948C14.0287 5.5446 14.381 5.25 14.7924 5.25H20.892C21.3062 5.25 21.642 5.58579 21.642 6C21.642 6.41421 21.3062 6.75 20.892 6.75H15.3359L14.677 10.4122C14.7083 10.3958 14.7397 10.3796 14.7713 10.3638C15.4506 10.0234 16.193 9.8296 16.9512 9.79502L16.9745 9.79396L16.9978 9.79435C18.0629 9.81203 19.0907 10.1881 19.9189 10.8615C20.743 11.5316 21.3224 12.4578 21.5681 13.4941C21.8521 14.5302 21.8025 15.6309 21.4262 16.6371C21.048 17.6482 20.3593 18.512 19.4591 19.1014L19.4463 19.1098L19.4332 19.1176C17.1285 20.4957 13.8824 19.5672 12.3514 16.9306C12.1434 16.5724 12.2652 16.1134 12.6234 15.9054C12.9816 15.6974 13.4406 15.8192 13.6486 16.1774C14.8123 18.1815 17.1546 18.7212 18.6504 17.838C19.2754 17.4248 19.756 16.8207 20.0213 16.1116C20.2883 15.3975 20.3225 14.6155 20.1186 13.8802L20.1145 13.8654L20.1111 13.8506C19.9425 13.1297 19.5413 12.4877 18.9726 12.0253C18.41 11.5679 17.7152 11.3117 16.996 11.2946C16.4565 11.3225 15.928 11.462 15.4433 11.7049C15.047 11.9035 14.6868 12.1677 14.3774 12.4863C14.075 12.7978 13.6591 12.7916 13.385 12.6587C13.1072 12.524 12.8336 12.1871 12.9141 11.7396L13.9558 5.94948Z"
/>
</svg>
`);
export const getIcon = (model: BaseBlockModel): string => {
  if (model.flavour === 'affine:paragraph') {
    const type = model.type as ParagraphType;
    return (
      {
        text: text,
        quote: quote,
        h1: h1,
        h2: h2,
        h3: h3,
        h4: h4,
        h5: h5,
      } as Record<ParagraphType, string>
    )[type];
  }
  if (model.flavour === 'affine:list') {
    return (
      {
        bulleted: bulleted,
        numbered: numbered,
        todo: todo,
        toggle: toggle,
      }[model.type ?? 'bulleted'] ?? ''
    );
  }
  return '';
};
