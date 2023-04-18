import packageJSON from '../package.json';

const getPackageVars = (): { name: string; version: string; } => {
  const {
    name,
    version,
  } = packageJSON;

  if (import.meta.env.DEV) {
    return {
      name,
      version: 'latest',
    };
  }

  return {
    name,
    version,
  }
}

const { name, version } = getPackageVars();

export const ROOT_CDN_URL = `https://cdn.jsdelivr.net/npm/${name}@${version}`;
export const ROOT_PUBLIC_URL = `${ROOT_CDN_URL}/public`;

export const RUNTIME_URL = `${ROOT_PUBLIC_URL}/tvmjs_runtime.wasi.js`;
export const BUNDLE_URL = `${ROOT_PUBLIC_URL}/tvmjs.bundle.js`;
export const TOKENIZER_URL = `${ROOT_PUBLIC_URL}/tokenizer.model`;
export const VICUNA_URL = `${ROOT_PUBLIC_URL}/vicuna-7b_webgpu.wasm`;
export const SENTENCE_PIECE_URL = `${ROOT_PUBLIC_URL}/sentencepiece/index.js`;
export const CACHE_URL = "https://huggingface.co/mlc-ai/web-lm/resolve/main/vicuna-0b/";
export const NOOP = () => {};
