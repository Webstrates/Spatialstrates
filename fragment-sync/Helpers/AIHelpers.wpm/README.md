# AI Helpers

The AI Helpers API provides a set of utilities to interact with the OpenAI API. It provides functions for recording audio, transcribing audio to text, and generating text responses using the OpenAI API or an LiteLLM proxy server. By default the OpenAI API is used. To switch to the LiteLLM helper remove the `default` class from the OpenAI helper and add it to the LiteLLM helper.


## Import

```js
import {
    recordAudio,
    transcribeAudio,
    sendGPTPrompt,
    getGPTContent
} from '#AIHelpers .default';
```
