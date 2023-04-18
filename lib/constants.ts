import runtime from './tvmjs_runtime.wasi.js?url';
import bundle from './tvmjs.bundle.js?url';
import tokenizer from './tokenizer.model?url';
import vicuna from './vicuna-7b_webgpu.wasm?url';
import sentencePiece from './sentencepiece/index.js?url';

export const RUNTIME_URL = runtime;
export const BUNDLE_URL = bundle;
export const TOKENIZER_URL = tokenizer;
export const VICUNA_URL = vicuna;
export const SENTENCE_PIECE_URL = sentencePiece;
export const CACHE_URL = "https://huggingface.co/mlc-ai/web-lm/resolve/main/vicuna-0b/";
export const NOOP = () => {};
