# WebLLM Chat Widget

This repository provides a basic, embeddable chat widget leveraging MLC AI's [WebLLM project](https://webllm.mlc.ai/) to run large language models (LLMs) directly in the browser. This repo simplifies its integration, offers robust cache management, and externalizes configurations for a developer-friendly and "Good Citizen" application experience.

## Features

-   **Client-Side LLM:** Runs `Llama-3.2-1B-Instruct-q4f16_1-MLC` (or other configurable models) entirely within your browser, eliminating server-side inference costs and enhancing privacy.
-   **Persistent Caching:** Model weights are cached in your browser's Cache Storage for significantly faster loading on subsequent visits.
-   **Configurable:** Model ID, cache name, and system prompt are easily adjustable via the external `config.json` file.
-   **Robust Cache Management:**
    -   **Cache Cleanup Button:** A user-facing button allows explicit clearing of the model cache.
    -   **Best-Effort Automatic Cleanup:** Attempts to clear the model cache when you navigate away or close the page (`window.onbeforeunload`), ensuring the application is a "Good Citizen" by not leaving large files behind indefinitely (though this is browser-dependent).
-   **Minimalist Integration:** Provides a basic HTML and JavaScript structure designed for easy embedding into any website.
-   **Dynamic Textarea:** The input textarea expands automatically as you type.
-   **Streaming Responses:** AI responses are streamed for a more interactive chat experience.

## How it Works (Conceptual)

This widget builds upon the powerful [WebLLM library by MLC AI](https://webllm.mlc.ai/) to compile LLMs into WebAssembly and run them directly in the browser using WebGPU or WebGL.

My work specifically focuses on:

-   **Simplifying Configuration:** By externalizing `MODEL_ID`, `CACHE_NAME`, and `SYSTEM_PROMPT` into `config.json`, I've made the widget highly customizable without requiring changes to the JavaScript logic.
-   **Streamlining Initialization:** The `webllm_widget.js` handles asynchronously loading `config.json` before initializing the WebLLM engine, ensuring a smooth setup process.
-   **Implementing Robust Cache Management:** I added explicit control over the large model cache in Cache Storage, providing both manual and best-effort automatic cleanup mechanisms.

1.  **Configuration Loading:** On page load, `webllm_widget.js` fetches `config.json` asynchronously to retrieve dynamic parameters.
2.  **Model Initialization:** `CreateMLCEngine` is called to initialize the LLM using the configured `MODEL_ID`. If the model isn't present in Cache Storage, it downloads the ~880MB weights. If cached, it loads much faster.
3.  **Chat Interaction:** Your input is sent to the `engine.chat.completions.create` method, and the AI's streaming response is displayed.
4.  **Cache Management:**
    *   **Persistence:** The `useIndexedDBCache: true` option (as part of `CreateMLCEngine` options) results in model weights being stored persistently in the browser's **Cache Storage** (my investigation during development confirmed it uses Cache Storage rather than IndexedDB directly for these weights).
    *   **Manual Clear:** The "Clear Cache" button uses the browser's `caches.delete(CACHE_NAME)` API to remove the model weights.
    *   **Automatic Cleanup:** `window.onbeforeunload` also attempts `caches.delete(CACHE_NAME)`. Due to inherent browser limitations on asynchronous operations during page unload, this is a "best-effort" attempt and not guaranteed to always complete for large files.

## Intended Use Case

This widget is designed for developers, educators, and hobbyists who want to:

-   **Quickly integrate client-side AI chat** into web applications, demos, or personal websites.
-   **Provide interactive LLM experiences** without relying on a backend server for inference.
-   **Experiment with different WebLLM models** by simply updating a JSON configuration file.
-   **Demonstrate the power of in-browser AI** in a self-contained, easy-to-deploy manner.
-   **Educate users** on the capabilities and resource management (caching, cleanup) of client-side LLMs.

It simplifies the complexities of WebLLM setup, making the cutting-edge technology more accessible for broader implementation.

## Setup and Usage

### Prerequisites

-   A web server to serve the files (e.g., `python -m http.server` or `npx http-server`). Direct opening `index.html` via `file://` might have security restrictions preventing script module loading and `fetch` requests.

### Steps

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Anish-Reddy-K/webllm-browser-chat-template.git
    cd webllm-browser-chat-template
    ```
2.  **Place files:** Ensure `index.html`, `config.json`, and `webllm_widget.js` are in the same directory or adjust paths accordingly.
3.  **Serve the files:**
    ```bash
    # Example using Python's simple HTTP server
    python -m http.server 8000
    # Then open your browser to http://localhost:8000
    ```
    or
    ```bash
    # Example using http-server (install via `npm install -g http-server`)
    http-server
    # Then open your browser to http://localhost:8080 (or specified port)
    ```
4.  **Integrate:** Copy the HTML structure from `index.html` and the `webllm_widget.js` and `config.json` files into your own website project. Adapt the CSS to match your site's design.

## Configuration (`config.json`)

Edit the `config.json` file to customize your widget:

```json
{
  "MODEL_ID": "Llama-3.2-1B-Instruct-q4f16_1-MLC",
  "CACHE_NAME": "webllm/model",
  "SYSTEM_PROMPT": "You are a concise, helpful, and friendly AI assistant running directly in the user's browser via WebLLM. Respond in a brief and engaging manner."
}
```

-   **`MODEL_ID`**: The identifier for the WebLLM model you wish to use. You can find available models on the [MLC AI WebLLM documentation](https://webllm.mlc.ai/docs/get_started/index.html#use-model-artifacts-via-url) or [Hugging Face](https://huggingface.co/mlc-ai).
-   **`CACHE_NAME`**: The specific name of the Cache Storage used by WebLLM for the model weights. **It is crucial this name matches the one WebLLM uses in your browser environment.** If you change `MODEL_ID`, it's recommended to verify this name in browser DevTools (Application -> Cache Storage).
-   **`SYSTEM_PROMPT`**: The initial instruction given to the AI, setting its persona and behavior for the conversation.

## Project Structure

-   `index.html`: The basic HTML structure for the chat widget.
-   `config.json`: Externalized configuration parameters (Model ID, Cache Name, System Prompt).
-   `webllm_widget.js`: The core JavaScript logic for WebLLM initialization, chat interaction, and cache management.

## Acknowledgments

This project is made possible by the incredible work of the [MLC AI WebLLM team](https://webllm.mlc.ai/). Their efforts in bringing performant large language models to the browser are truly groundbreaking, and this widget serves as a testament to the power and flexibility of their library.

## Contributing

Feel free to open issues or submit pull requests.

## License

This project is open-source. (Consider adding a specific license file like MIT or Apache 2.0).
