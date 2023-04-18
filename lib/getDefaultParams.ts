import { VicunaParams } from "./types";

export const getDefaultParams = (params: Partial<VicunaParams> = {}): VicunaParams => {
  if (params.temperature !== undefined && (params.temperature < 0 || params.temperature > 1)) {
    throw new Error('Temperature must be between 0 and 1.')
  }
  if (params.top_p !== undefined && (params.top_p < 0 || params.top_p > 1)) {
    throw new Error('top_p must be between 0 and 1.')
  }

  return {
    temperature: 0.8,
    top_p: 0.95,
    stopWords: [],
    maxGenLength: 512,
    ...params,
  }
}
