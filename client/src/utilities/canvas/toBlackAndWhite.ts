export function toBlackAndWhite (canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')
  const imgData = ctx?.getImageData(0, 0, canvas.width, canvas.height)
  const pixels = imgData?.data  ?? []

  for (let p = 0; p < pixels?.length; p += 4) {
    const r = pixels[p]
    const g = pixels[p + 1]
    const b = pixels[p + 2]
    
    const grey = (r + g + b) / 3

    pixels[p] = grey
    pixels[p + 1] = grey
    pixels[p + 2] = grey
  }

  imgData && ctx?.putImageData(imgData, 0, 0)
}