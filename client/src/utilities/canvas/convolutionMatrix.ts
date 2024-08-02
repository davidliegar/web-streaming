export type KERNEL3X3 = [
  number, number, number,
  number, number, number,
  number, number, number
]

export const EMBOSS: KERNEL3X3 = [
  -2, -1, 0,
  -1, 1, 1,
  0, 1, 2
]

export const SOBER_VERTICAL: KERNEL3X3 = [
  -1, 0, 1,
  -2, 0, 2,
  -1, 0, 1
]

export const SOBER_HORIZONTAL: KERNEL3X3 = [
  -1, -2, -1,
  0, 0, 0,
  1, 2, 1
]

export const SHARPEN: KERNEL3X3 = [
  0, -1, 0,
  -1, 5, -1,
  0, -1, 0
]

export const GAUSSIAN_BLUR: KERNEL3X3 = [
  1/16, 1/8, 1/16,
  1/8,  1/4, 1/8,
  1/16, 1/8, 1/16
]