# WebLLM Chat Widget

This repository provides a basic, embeddable chat widget leveraging MLC AI's WebLLM project to run large language models (LLMs) directly in the browser. It features persistent caching for faster reloads and robust cache management for a "Good Citizen" application experience.

## Features

-   **Client-Side LLM:** Runs `Llama-3.2-1B-Instruct-q4f16_1-MLC` (or other configurable models) entirely within the user's browser, eliminating server-side inference costs.
-   **Persistent Caching:** Model weights are cached in the browser's Cache Storage for significantly faster loading on subsequent visits.
-   **Configurable:** Model ID, cache name, and system prompt are easily adjustable via `config.json`.
-   **Cache Cleanup Button:** A user-facing button allows explicit clearing of the model cache.
-   **Best-Effort Automatic Cleanup:** Attempts to clear the model cache when the user navigates away or closes the page (`window.onbeforeunload`).
-   **Minimalist Integration:** Provides a basic HTML and JavaScript structure designed for easy embedding into any website.
-   **Dynamic Textarea:** The input textarea expands automatically as the user types.
-   **Streaming Responses:** AI responses are streamed for a more interactive chat experience.

## How it Works (Conceptual)

This widget utilizes the WebLLM library to compile LLMs into WebAssembly and run them directly in the browser using WebGPU or WebGL.

1.  **Configuration Loading:** On page load, `webllm_widget.js` fetches `config.json` asynchronously to get parameters like `MODEL_ID` and `CACHE_NAME`.
2.  **Model Initialization:** `CreateMLCEngine` is called to initialize the LLM. If the model isn't cached, it downloads the ~880MB weights. If cached, it loads much faster.
3.  **Chat Interaction:** User input is sent to the `engine.chat.completions.create` method, and the AI's streaming response is displayed.
4.  **Cache Management:**
    *   **Persistence:** `useIndexedDBCache: true` (as part of `CreateMLCEngine` options) ensures model weights are stored persistently in the browser's **Cache Storage** (not IndexedDB, as discovered during development).
    *   **Manual Clear:** The "Clear Cache" button uses the browser's `caches.delete('webllm/model')` API to remove the model weights.
    *   **Automatic Cleanup:** `window.onbeforeunload` also attempts `caches.delete('webllm/model')`. Due to browser limitations on asynchronous operations during page unload, this is a "best-effort" attempt and not guaranteed to always complete for large files.

## Setup and Usage

### Prerequisites

-   A web server to serve the files (e.g., `python -m http.server` or `npx http-server`). Direct opening `index.html` via `file://` might have security restrictions preventing script module loading and `fetch` requests.

### Steps

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd webllm-chat-widget # or your chosen repo name
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

-   **`MODEL_ID`**: The identifier for the WebLLM model you wish to use. You can find available models on the MLC AI WebLLM documentation or Hugging Face.
-   **`CACHE_NAME`**: The specific name of the Cache Storage used by WebLLM for the model weights. **It is crucial this name matches the one WebLLM uses in your browser environment.** If you change `MODEL_ID`, verify this name in browser DevTools (Application -> Cache Storage).
-   **`SYSTEM_PROMPT`**: The initial instruction given to the AI, setting its persona and behavior for the conversation.

## Project Structure

-   `index.html`: The basic HTML structure for the chat widget.
-   `config.json`: Externalized configuration parameters (Model ID, Cache Name, System Prompt).
-   `webllm_widget.js`: The core JavaScript logic for WebLLM initialization, chat interaction, and cache management.

## Contributing

Feel free to open issues or submit pull requests.

## License

This project is open-source. (Consider adding a specific license file like MIT or Apache 2.0).
