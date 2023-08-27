export const dataViewCommonStyle = (selector: string) => `
  ${selector}{
      --data-view-cell-text-size:14px;
      --data-view-cell-text-line-height:22px;
  }
  .hover-bg:hover{
    background-color: var(--affine-hover-color);
  }
  .hover-pd-round{
    padding:4px;
    border-radius:4px;
  }
`;
