import { GradioApp } from './gradio-app.js';

export function main(div: HTMLDivElement, image: Blob) {
  const app = new GradioApp();
  const onClose = () => undefined;
  const onSave = async () => {
    return app.exportImage();
  };

  app.imageBlob = image;

  div.appendChild(app);

  return {
    onClose,
    onSave,
  };
}
