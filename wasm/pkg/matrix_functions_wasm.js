import * as wasm from "./matrix_functions_wasm_bg.wasm";
import { __wbg_set_wasm } from "./matrix_functions_wasm_bg.js";
__wbg_set_wasm(wasm);
export * from "./matrix_functions_wasm_bg.js";
