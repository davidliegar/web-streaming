import * as wasm from "matrix-functions-wasm"
import type { KERNEL3X3 } from "./convolutionMatrix";

export function applyConvolutionMatrix(
  canvas: HTMLCanvasElement,
  kernels: KERNEL3X3[],
  useWasm: boolean = true) {
  const ctx = canvas.getContext('2d')
  const imgData = ctx?.getImageData(0, 0, canvas.width, canvas.height)
  if (!imgData) return

  const kernelSize = 3;

  const funcToUse = useWasm ? wasm.apply_convolution_matrix : applyConvolutions

  const newImgData = funcToUse(
    imgData.data,
    canvas.width,
    canvas.height,
    new Float32Array(kernels.flat()),
    kernelSize,
    kernels.length
  )

  ctx?.putImageData(newImgData, 0, 0)
}

function applyConvolutions(
  data: Uint8ClampedArray, 
  width: number, 
  height: number, 
  kernels: Float32Array, 
  kernelSize: number, 
  numKernels: number
): ImageData {
  let input = new Uint8ClampedArray(data);
  const output = new Uint8ClampedArray(width * height * 4);
  const halfKernel = Math.floor(kernelSize / 2);

  for (let kernelIdx = 0; kernelIdx < numKernels; kernelIdx++) {
    const kernelStart = kernelIdx * kernelSize * kernelSize;
    const kernel = kernels.subarray(kernelStart, kernelStart + kernelSize * kernelSize);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let rSum = 0.0;
        let gSum = 0.0;
        let bSum = 0.0;

        for (let ky = 0; ky < kernelSize; ky++) {
          for (let kx = 0; kx < kernelSize; kx++) {
            const px = x + kx - halfKernel;
            const py = y + ky - halfKernel;

            if (px >= 0 && px < width && py >= 0 && py < height) {
              const pixelIndex = (py * width + px) * 4;
              const kernelValue = kernel[ky * kernelSize + kx];

              rSum += input[pixelIndex] * kernelValue;
              gSum += input[pixelIndex + 1] * kernelValue;
              bSum += input[pixelIndex + 2] * kernelValue;
            }
          }
        }

        const outputIndex = (y * width + x) * 4;
        if (kernelIdx == 1) {
          output[outputIndex] =  Math.min(Math.max(Math.sqrt(Math.pow(rSum, 2) + Math.pow(gSum, 2) + Math.pow(bSum, 2)), 0), 255)
          output[outputIndex + 1] = output[outputIndex];
          output[outputIndex + 2] = output[outputIndex];
        } else {
          output[outputIndex] = Math.min(Math.max(rSum, 0), 255);
          output[outputIndex + 1] = Math.min(Math.max(gSum, 0), 255);
          output[outputIndex + 2] = Math.min(Math.max(bSum, 0), 255);
        }
        output[outputIndex + 3] = input[outputIndex + 3];
      }
    }

    input = new Uint8ClampedArray(output);
  }

  return new ImageData(output, width, height)
}