export function createInlineIframe() {
  const htmlContent = `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>LEDITS - a Hugging Face Space by editing-images</title>
        <script
          type="module"
          src="https://gradio.s3-us-west-2.amazonaws.com/3.36.1/gradio.js"
        ></script>
        <style>
          html, body {
            margin: 0;
            padding: 0;
          }

          gradio-app .gradio-container {
            margin-top: 0 !important;
            margin-bottom: 0 !important;
          }
        </style>
      </head>
      <body>
        <gradio-app src="https://editing-images-ledits.hf.space"></gradio-app>
      </body>
      <script>
        const queue = [];
        let ready = false;

        const base64ToBlob = (b64Data, contentType='', sliceSize=256) => {
          const byteCharacters = atob(b64Data);
          const byteArrays = [];
        
          for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            const slice = byteCharacters.slice(offset, offset + sliceSize);
        
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
              byteNumbers[i] = slice.charCodeAt(i);
            }
        
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
          }
        
          const blob = new Blob(byteArrays, { type: contentType });
          return blob;
        }

        const getResultImage = () => {
          const gradioApp = document.querySelector("gradio-app");
          const resultImg = gradioApp.querySelector("#output_image > img");
          
          if(resultImg === null) return null;
          
          const pattern = /^data:(image\\/\\w+);/
          const execResult = pattern.exec(resultImg.src);

          if(!execResult) return null;

          return base64ToBlob(resultImg.src.split(',')[1], execResult[1]);
        }

        const blobToFile = (blob) => {
          return new File([blob], "image.png", { type: blob.type });
        }

        function setImage({ image }) {
          const input = getInputElement();
          const file = blobToFile(image);
          const container = new DataTransfer();
          container.items.add(file);

          input.files = container.files;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }

        window.addEventListener("message", (e) => {
          const { source, data } = e;

          if(ready === false) {
            queue.push(data);
          }
          else {
            execute(data);
          }
        }, false);

        function execute(task) {
          if(!task.type) return;

          switch(task.type) {
            case 'set_image':
              setImage(task);
              break;
            case 'export_image':
              const resultImage = getResultImage();
              console.log(resultImage);
              window.parent.postMessage({ blob: resultImage }, '*');
              break;
            default:
              break;
          }
        }

        function executeQueueTask() {
          if(!checkInputReady()) {
            setTimeout(executeQueueTask, 500);
          }
          else {
            ready = true;
            for(let task of queue) {
              execute(task);
            }
          }
        }

        function getInputElement() {
          const gradioApp = document.querySelector("gradio-app")
          return gradioApp.querySelector('#input_image input[type="file"]');
        }

        function checkInputReady() {
          return !!getInputElement();
        }

        executeQueueTask();
      </script>
    </html>`;

  return `data:text/html,${encodeURIComponent(htmlContent)}`;
}
