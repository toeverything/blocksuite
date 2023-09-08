export const dataViewCommonStyle = (selector: string) => `
  ${selector}{
      --data-view-cell-text-size:14px;
      --data-view-cell-text-line-height:22px;
  }
  .dv-pd-2{
    padding:2px;
  }
  .dv-pd-4{
    padding:4px;
  }
  .dv-pd-8{
    padding:8px;
  }
  .dv-hover:hover{
    background-color: var(--affine-hover-color);
    cursor: pointer;
  }
  .dv-icon-16 svg{
    width: 16px;
    height: 16px;
    color: var(--affine-icon-color);
    fill: var(--affine-icon-color);
  }
  .dv-icon-20 svg{
    width: 20px;
    height: 20px;
    color: var(--affine-icon-color);
    fill: var(--affine-icon-color);
  }
  .dv-border{
    border: 1px solid var(--affine-border-color);
  }
  .dv-round-4{
    border-radius: 4px;
  }
  .dv-round-8{
    border-radius: 8px;
  }
  .dv-color-2{
    color: var(--affine-text-secondary-color);
  }
  .dv-shadow-2{
    box-shadow: var(--affine-shadow-2)
  }
  .dv-divider-h{
    height: 1px;
    background-color: var(--affine-divider-color);
    margin: 8px 0;
  }
`;
