export interface ConstructorParams {
  initCallback?: InitProgressCallback;
  runtimeURL?: string;
  bundleURL?: string;
  tokenizerURL?: string;
  vicunaURL?: string;
  sentencePieceURL?: string;
  cacheURL?: string;
  logger?: Logger;
}

export type Logger = (...message: string[]) => void;

export interface VicunaParams {
  maxGenLength: number;
  stopWords: string[];
  temperature: number;
  top_p: number;
}

export type InitProgressCallback = (params: {
  progress: number;
  timeElapsed: number;
  text: string;
}) => void;

// TODO: Type this further
export type Logits = {
  shape: any;
  dtype: string;
}

export interface Config {
  maxWindowLength: number;
  maxGenLength: number;
  meanGenLength: number;
  kvConfig: {
    numLayers: number;
    shape: number[];
    dtype: string;
  }
}

export interface GenerateParams extends Partial<VicunaParams> {
  callback?: GenerateCallback;
}

export type GenerateCallback = (step: number, output: string) => void;

export type TVM = any;
export type TVMJS = any;
export type EmccWASI = any;
export type Tokenizer = any;
