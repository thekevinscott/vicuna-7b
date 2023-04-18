import { GenerateCallback, Config, VicunaParams, Logits, Tokenizer, TVM } from "./types";

export class LLMChatPipeline {
  tvm?: TVM;
  tokenizer?: Tokenizer;
  cacheMetadata?: any;
  config?: any; 
  bosTokenId: number;
  eosTokenId: number;

  maxWindowLength: number;
  maxGenLength: number;
  meanGenLength: number;
  streamInterval: number;

  decodingTotalTime: number;
  decodingTotalTokens: number;
  encodingTotalTime: number;
  encodingTotalTokens: number;

  device: any;
  vm: any;
  encoding: any;
  decoding: any;

  encodingWithoutCache: any;
  params: any;
  fclearKVCaches: any;

  kvCache: any;

  logitsOnCPU?: any;

  constructor(config: Config, cacheMetadata: any, tvm?: TVM, tokenizer?: Tokenizer) {
    this.tvm = tvm;
    this.tokenizer = tokenizer;
    this.bosTokenId = 1;
    this.eosTokenId = 2;

    this.maxWindowLength = config.maxWindowLength;
    this.maxGenLength = config.maxGenLength;
    this.meanGenLength = config.meanGenLength;
    this.streamInterval = 1;

    this.decodingTotalTime = 0;
    this.decodingTotalTokens = 0;
    this.encodingTotalTime = 0;
    this.encodingTotalTokens = 0;

    this.device = this.tvm.webgpu();
    this.vm = this.tvm.detachFromCurrentScope(
      this.tvm.createVirtualMachine(this.device)
    );
    this.encoding = this.tvm.detachFromCurrentScope(
      this.vm.getFunction("encoding")
    );
    this.decoding = this.tvm.detachFromCurrentScope(
      this.vm.getFunction("decoding")
    );
    this.encodingWithoutCache = this.tvm.detachFromCurrentScope(
      this.vm.getFunction("encoding_without_cache")
    );
    this.params = this.tvm.detachFromCurrentScope(
      this.tvm.getParamsFromCache("param", cacheMetadata.ParamSize)
    );
    const fcreateCache = this.tvm.getGlobalFunc("vm.builtin.attention_kv_cache_create");
    this.fclearKVCaches = this.tvm.detachFromCurrentScope(
      this.tvm.getGlobalFunc("vm.builtin.attention_kv_cache_array_clear")
    );

    // use extern config for now
    // move to kv generation vm function
    const kvList: any[] = [];
    const kvConfig = config.kvConfig;
    for (let i = 0; i < kvConfig.numLayers; ++i) {
      const item = fcreateCache(
        this.tvm.empty(kvConfig.shape, kvConfig.dtype, this.device),
        this.tvm.makeShapeTuple(kvConfig.shape),
        this.tvm.scalar(0, "int")
      );
      kvList.push(item);
    }
    this.kvCache = this.tvm.detachFromCurrentScope(this.tvm.makeTVMArray(kvList));
    // fill with pad token
    this.logitsOnCPU = undefined;
  }


  dispose() {
    // note: tvm instance is not owned by this class
    this.params.dispose();
    this.encodingWithoutCache.dispose();
    this.decoding.dispose();
    this.encoding.dispose();
    this.vm.dispose();
    this.kvCache.dispose();
    this.fclearKVCaches.dispose();
    if (this.logitsOnCPU != undefined) {
      this.logitsOnCPU.dispose();
    }
  }

  #clearKVCache() {
    this.fclearKVCaches(this.kvCache);
  }

  #forward(inputs?: any, curPos?: number) {
    this.tvm.beginScope();
    var retValue;
    const seqLenShape = this.tvm.makeShapeTuple([curPos]);
    if (inputs.shape[1] > 1) {
      retValue = this.encoding(
        inputs, seqLenShape, this.kvCache, this.params
      );
    } else {
      retValue = this.decoding(
        inputs, seqLenShape, this.kvCache, this.params
      );
    }
    const logits = this.tvm.detachFromCurrentScope(retValue.get(0));
    this.tvm.endScope();
    this.tvm.attachToCurrentScope(logits);
    return logits;
  }

  // NOTE: caller must call device.sync()
  #updateLogitsOnCPU(logits: Logits) {
    if (this.logitsOnCPU == undefined) {
      this.logitsOnCPU = this.tvm.detachFromCurrentScope(
        this.tvm.empty(logits.shape, logits.dtype, this.tvm.cpu())
      );
    } else {
      if(logits.shape[0] != this.logitsOnCPU.shape[0]) {
        throw Error("We expect the size of logits to remain unchanged");
      }
    }
    this.logitsOnCPU.copyFrom(logits);
  }

  async sampleTokenFromLogits(logits: Logits, temperature: number = 0.8, top_p: number = 0.95) {
    this.tvm.beginScope();
    this.#updateLogitsOnCPU(logits);
    this.tvm.endScope();
    await this.device.sync();
    return this.tvm.sampleTopPFromLogits(this.logitsOnCPU, temperature, top_p);
  }

  async getInputTokens(prompts: string[]) {
    const tokens = [this.bosTokenId];
    tokens.push(...await this.tokenizer.encodeIds(prompts[0]));
    return tokens;
  }

  resetChat() {
    this.#clearKVCache();
    this.decodingTotalTime = 0;
    this.encodingTotalTime = 0;
    this.decodingTotalTokens = 0;
    this.encodingTotalTokens = 0;
  }

  async generate(inputPrompt: string, { stopWords, maxGenLength, temperature, top_p }: VicunaParams, callback?: GenerateCallback) {
    const tokens = await this.getInputTokens([inputPrompt]);
    const inputTokenLength = tokens.length;

    let outputPrompt = "";
    this.#clearKVCache();
    const maxGenLen = Math.min(maxGenLength || this.maxGenLength, this.maxWindowLength - tokens.length);
    // if (maxGenLen < this.meanGenLength) {
    //   throw Error("Too small window size config");
    // }

    for (let step = 0; step < maxGenLen; ++step) {
      this.tvm.beginScope();
      var inputData;

      let tstart = performance.now();
      if (step == 0) {
        inputData = this.tvm.empty([1, tokens.length], "int32", this.device);
        inputData.copyFrom(tokens);
      } else {
        inputData = this.tvm.empty([1, 1], "int32", this.device);
        inputData.copyFrom(tokens.slice(tokens.length - 1));
      }
      const logits = this.tvm.detachFromCurrentScope(
        this.#forward(inputData, inputTokenLength + step)
      );
      this.tvm.endScope();

      const nextToken = await this.sampleTokenFromLogits(logits, temperature, top_p);
      logits.dispose();

      tokens.push(nextToken);
      const outputTokens = tokens.slice(inputTokenLength);
      outputPrompt = this.tokenizer.decodeIds(outputTokens);

      if (nextToken == this.eosTokenId) break;

      for (const stopWord of stopWords) {
        const stopPos = outputPrompt.lastIndexOf(stopWord);
        if (stopPos !== -1) {
          outputPrompt = outputPrompt.substring(0, stopPos);
          break;
        }
      }
      let tend = performance.now();
      if (step != 0) {
        this.decodingTotalTokens += 1;
        this.decodingTotalTime += (tend - tstart) / 1000;
      } else {
        this.encodingTotalTime += (tend - tstart) / 1000;
        this.encodingTotalTokens += inputTokenLength;
      }

      if (step % this.streamInterval === 0 && callback) {
        callback(step, outputPrompt);
      }
    }
    return outputPrompt;
  }

  /**
   * async preload webgpu pipelines when possible.
   */
  async asyncLoadWebGPUPiplines() {
    await this.tvm.asyncLoadWebGPUPiplines(this.vm.getInternalModule());
  }

  runtimeStatsText() {
    return {
      encoding: this.encodingTotalTokens / this.encodingTotalTime,
      decoding: this.decodingTotalTokens / this.decodingTotalTime,
    };
  }
}
