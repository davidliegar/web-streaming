use wasm_bindgen::prelude::*;
use wasm_bindgen::Clamped;
use web_sys::ImageData;

#[wasm_bindgen]
extern {
  #[wasm_bindgen(js_namespace = console)]
  fn log(s: &str);
}

#[wasm_bindgen]
pub fn apply_convolution_matrix(
  data: Clamped<Vec<u8>>, 
  width: u32, 
  height: u32,
  kernels: &[f32], 
  kernel_size: usize,
  num_kernels: usize
) -> ImageData {
  let input = data.0;
  let mut output: Vec<u8> = vec![0; (width * height * 4) as usize];
  let half_kernel = (kernel_size / 2) as isize;

  for kernel_idx in 0..num_kernels {
    let kernel = &kernels[kernel_idx * kernel_size * kernel_size..(kernel_idx + 1) * kernel_size * kernel_size];
    
    for y in 0..height as isize {
      for x in 0..width as isize {
        let mut r_sum = 0.0;
        let mut g_sum = 0.0;
        let mut b_sum = 0.0;

        for ky in 0..kernel_size as isize {
          for kx in 0..kernel_size as isize {
            let px = x + kx - half_kernel;
            let py = y + ky - half_kernel;

            if px >= 0 && px < width as isize && py >= 0 && py < height as isize {
              let pixel_index = (py * width as isize + px) as usize * 4;
              let kernel_value = kernel[(ky * kernel_size as isize + kx) as usize];

              r_sum += input[pixel_index] as f32 * kernel_value;
              g_sum += input[pixel_index + 1] as f32 * kernel_value;
              b_sum += input[pixel_index + 2] as f32 * kernel_value;
            }
          }
        }

        let output_index = (y * width as isize + x) as usize * 4;
        if kernel_idx == 1 {
          output[output_index] = (r_sum.powi(2) + g_sum.powi(2) + b_sum.powi(2)).sqrt().clamp(0.0, 255.0) as u8;
          output[output_index + 1] = output[output_index];
          output[output_index + 2] = output[output_index];
        } else {
          output[output_index] = r_sum.clamp(0.0, 255.0) as u8;
          output[output_index + 1] = g_sum.clamp(0.0, 255.0) as u8;
          output[output_index + 2] = b_sum.clamp(0.0, 255.0) as u8;
        }

        output[output_index + 3] = input[output_index + 3]; // Mantener la transparencia original
      }
    }
  }

  ImageData::new_with_u8_clamped_array_and_sh(Clamped(&output), width, height).unwrap()
}


// #[wasm_bindgen]
// pub fn convolution_matrix() -> Int32Array {
//   // let mut kernelY = 0;
//   // let mut kernelX = 0;
//   log("Hello, world!");
  
//   let mut pixels_result: [i32; 1000000] = [0; 1000000];

//   for p in 0..(500 * 500) {
//     let ptr = p * 4;

//     pixels_result[ptr] = 255;
//     pixels_result[ptr + 1] = 0;
//     pixels_result[ptr + 2] = 0;
//     pixels_result[ptr + 3] = 255;
//   }

//   return Int32Array::from(&pixels_result[..]);
// }