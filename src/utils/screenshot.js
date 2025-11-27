export function captureCanvas(renderer) {
  if (!renderer || !renderer.domElement) {
    throw new Error("Renderer missing");
  }

  return renderer.domElement.toDataURL("image/png");
}

export function dataURLToFile(dataURL, filename) {
  const arr = dataURL.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) u8arr[n] = bstr.charCodeAt(n);

  return new File([u8arr], filename, { type: mime });
}