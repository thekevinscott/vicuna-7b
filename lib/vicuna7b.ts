import { LLMChatPipeline } from "./LLMChatPipeline";
import type { ConstructorParams, EmccWASI, GenerateCallback, GenerateParams, InitProgressCallback, TVM, TVMJS, Tokenizer, VicunaParams } from "./types";
import { loadScript } from './loadScript';
import { getDefaultParams } from "./getDefaultParams";
import { BUNDLE_URL, CACHE_URL, NOOP, RUNTIME_URL, SENTENCE_PIECE_URL, TOKENIZER_URL, VICUNA_URL } from "./constants";
import { config } from "./config";

/**
 * A instance that can be used to facilitate deployment.
 */
export class Vicuna7B {
  tvm?: TVM;
  pipeline: Promise<LLMChatPipeline>;
  ready: Promise<void>;
  params: ConstructorParams;

  constructor(params: Partial<ConstructorParams> = {}) {
    this.params = params;
    const { initCallback: callback } = params;
    this.ready = this.loadScripts();
    this.pipeline = this.getPipeline(callback);
  }

  private loadScripts(): Promise<void> {
    const { runtimeURL = RUNTIME_URL, bundleURL = BUNDLE_URL } = this.params;
    return Promise.all([
      loadScript(runtimeURL),
      loadScript(bundleURL),
    ]).then(() => {});
  }

  private async getTVM(): Promise<TVM> {
    const { logger = NOOP, vicunaURL = VICUNA_URL } = this.params;
    const wasmSource = await(
      await fetch(vicunaURL)
    ).arrayBuffer();
    const tvm = await window.tvmjs.instantiate(
      new Uint8Array(wasmSource),
      new window.EmccWASI(),
      logger,
    );
    // intialize WebGPU
    try {
      const output = await window.tvmjs.detectGPUDevice();
      if (output !== undefined) {
        var label = "WebGPU";
        if (output.adapterInfo.description.length != 0) {
          label += " - " + output.adapterInfo.description;
        } else {
          label += " - " + output.adapterInfo.vendor;
        }
        logger("init", "Initialize GPU device: " + label);
        tvm.initWebGPU(output.device);
      } else {
        throw Error("This browser env does not support WebGPU");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw Error("Find an error initializing WebGPU: " + err.toString());
      }
    }
    return tvm;
  }

  private async getTokenizer(): Promise<Tokenizer> {
    const { cacheURL: tokenizerURL = TOKENIZER_URL, sentencePieceURL = SENTENCE_PIECE_URL } = this.params;
    const mod = await import(/* @vite-ignore */sentencePieceURL);
    return mod.sentencePieceProcessor(tokenizerURL);
  }

  private async getPipeline(callback?: InitProgressCallback): Promise<LLMChatPipeline> {
    const { logger = NOOP, cacheURL: cacheUrl = CACHE_URL, } = this.params;
    await this.ready;
    const [
      tvm,
      tokenizer,
    ] = await Promise.all([
      this.getTVM(),
      this.getTokenizer(),
    ]);
    this.tvm = await this.getTVM();
    console.log('callback', callback);
    this.tvm.registerInitProgressCallback(callback || NOOP);
    await this.tvm.fetchNDArrayCache(cacheUrl, this.tvm.webgpu());

    const pipeline = this.tvm.withNewScope(() => {
      return new LLMChatPipeline(config, this.tvm.cacheMetadata, this.tvm, tokenizer);
    }) as LLMChatPipeline;
    await pipeline.asyncLoadWebGPUPiplines();
    logger("init", "All initialization finished.");
    return pipeline;
  }

  /**
   * Reset the instance;
   */
  async reset(params: ConstructorParams = {}) {
    this.params = params;
    this.tvm = undefined;
    const pipeline = await this.pipeline;
    if (pipeline !== undefined) {
      pipeline.dispose();
    }
    this.pipeline = this.getPipeline(this.params.initCallback);
  }

  async generate(prompt: string, { callback, ...params }: GenerateParams = {}) {
    const pipeline = await this.pipeline;
    return pipeline.generate(prompt, getDefaultParams(params), callback);
  }

  async getRuntimeStats() {
    const pipeline = await this.pipeline;
    return pipeline.runtimeStatsText();
  }
}

declare global {
  interface Window {
    tvmjs: TVMJS;
    EmccWASI: EmccWASI;
  }
}
