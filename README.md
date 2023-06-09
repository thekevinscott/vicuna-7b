# Vicuna 7B

Vicuna 7B is a large language model that runs in the browser.

This library is a port of the fantastic [`web-llm` implementation](https://github.com/mlc-ai/web-llm) that exposes programmatic local access to the model with minimal configuration.

[Demo](https://thekevinscott.github.io/vicuna-7b/)

![Gif of UI Demo](https://github.com/thekevinscott/vicuna-7b/raw/main/assets/ui-demo.gif)

## Prerequisites

See the [`Instructions` section here](https://mlc.ai/web-llm/) for more information on required prerequisites, and confirm that the demo UI works with your hardware.

## Getting Started

Install with:

```bash
npm install vicuna-7b
```

Then, you can import it into your project with:

```javascript
import Vicuna7B from 'vicuna-7b';

const llm = new Vicuna7B();

llm.generate(`Tell me a joke about otters!`).then(response => console.log(response));
```

## API

### `constructor`

```javascript
const initCallback = ({ progress, timeElapsed, text }) => {
  console.log(progress, timeElapsed, text);
};
new Vicuna7B({
  initCallback,
});
```

The constructor accepts an optional payload of arguments:

- `initCallback` - An optional initialization callback
- `logger` - An optional general logging function callback;
- `runtimeURL` - An optional string denoting a URL to the runtime URL (corresponds to `lib/tvmjs_runtime.wasi.js`)
- `bundleURL` - An optional string denoting a URL to the bundle URL (corresponds to `lib/tvmjs.bundle.js`)
- `tokenizerURL` - An optional string denoting a URL to the tokenizer URL (corresponds to `lib//tokenizer.model`)
- `vicunaURL` - An optional string denoting a URL to the model URL (corresponds to `lib/vicuna-7b_webgpu.wasm`)
- `sentencePieceURL` - An optional string denoting a URL to the sentence piece URL (corresponds to `lib/sentencepiece/index.js`)
- `cacheURL` - An optional string denoting a URL to the cache URL (corresponds to `https://huggingface.co/mlc-ai/web-lm/resolve/main/vicuna-0b/`)

By default the library will load its runtime requirements from a CDN, [https://www.jsdelivr.com/](jsdelivr), if no URL arguments are provided.

An example with full options looks like:

```javascript
const initCallback = ({ progress, timeElapsed, text }) => {
  console.log(progress, timeElapsed, text);
};
new Vicuna7B({
  initCallback,
  logger: console.log,
  runtimeURL: 'http://path-to-url',
  bundleURL: 'http://path-to-url',
  tokenizerURL: 'http://path-to-url',
  vicunaURL: 'http://path-to-url',
  sentencePieceURL: 'http://path-to-url',
  cacheURL: 'http://path-to-url',
});
```

### `generate`

```javascript
const prompt = `Tell me a joke about otters!`;
const generateCallback = (step, text) => {
  console.log(text);
}
const config = {
  maxGenLength: 32,
  stopWords: ['Q:'],
  temperature: 0.5,
  top_p: 0.95,
  callback: generateCallback,
};
llm.generate(prompt, config).then(response => {
  console.log(response);
});
```

`generate` accepts two arguments:

- `prompt` - the text prompt to pass to the LLM model
- `params` - an optional set of config parameters to pass to the model

The `callback` argument from the params will be invoked on every step of the model generation. This callback receives a `step` parameter indicating the current step integer, and the `text` generated at that step. This can be useful if you wish to show the output as the model generates it.

### `reset`

```javascript
llm.reset().then(() => {
  console.log('done');
});
```

Resets the LLM.

You can optionally pass in a new set of constructor parameters that will then be persisted.

### `getRuntimeStats`

```javascript
llm.getRuntimeStats().then(stats => {
  console.log(stats);
})
```

Exposes runtime stats information. Runtime stats is returned in the format:

```
{
  encoding: float,
  decoding: float,
}
```

You can see an example in the original UI.

## License

Apache 2.0

## Credits

All credit goes to the original implementation at [`web-llm`](https://github.com/mlc-ai/web-llm).

Simon Willison has a [great piece on his blog](https://simonwillison.net/2023/Apr/16/web-llm/) about his experiments with the LLM.
