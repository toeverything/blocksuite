export async function download(blob: Blob, fileName: string) {
  const element = document.createElement('a');
  const url = URL.createObjectURL(blob);
  element.href = url;
  element.download = fileName;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  URL.revokeObjectURL(url);
}

export async function upload() {
  const input = document.createElement('input');
  input.type = 'file';
  const promise = new Promise<Blob>(resolve => {
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);

      reader.onload = () => {
        if (!reader.result) return;
        const blob = new Blob([reader.result], { type: file.type });
        resolve(blob);
      };

      reader.onerror = error => {
        console.error(error);
      };
      input.remove();
    };
  });
  input.click();
  return promise;
}
