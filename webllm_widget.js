import { CreateMLCEngine } from "https://esm.run/@mlc-ai/web-llm";

// These variables will be populated from config.json
let MODEL_ID;
let CACHE_NAME;
let SYSTEM_PROMPT;

let engine = null;
let messages = []; // Initialize after SYSTEM_PROMPT is loaded

// DOM element references
const chatOutput = document.getElementById('chat-output');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const clearCacheBtn = document.getElementById('clear-cache-btn');
const statusDiv = document.getElementById('status');

/**
 * Appends a new message to the chat output display.
 * @param {string} role - The role of the message sender ('user' or 'ai').
 * @param {string} text - The content of the message.
 * @returns {HTMLElement} The created message container element.
 */
function appendMessage(role, text) {
    const messageContainer = document.createElement('div');
    messageContainer.className = `message ${role}-message`; // Basic classes for styling

    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    messageContainer.appendChild(paragraph);

    chatOutput.appendChild(messageContainer);
    chatOutput.scrollTop = chatOutput.scrollHeight; // Auto-scroll to bottom
    return messageContainer;
}

/**
 * Dynamically expands the height of a textarea based on its content.
 * @param {HTMLTextAreaElement} textarea - The textarea element to expand.
 */
function autoExpandTextarea(textarea) {
    textarea.style.height = 'auto'; // Reset height to recalculate
    textarea.style.height = (textarea.scrollHeight) + 'px'; // Set height to scroll height
}

// Attach event listener for textarea expansion
userInput.addEventListener('input', () => autoExpandTextarea(userInput));
userInput.addEventListener('focus', () => autoExpandTextarea(userInput));
userInput.addEventListener('blur', () => autoExpandTextarea(userInput));


/**
 * Asynchronously loads configuration from config.json.
 * @returns {Promise<void>}
 */
async function loadConfig() {
    try {
        statusDiv.innerText = "Loading configuration...";
        const response = await fetch('./config.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const config = await response.json();
        MODEL_ID = config.MODEL_ID;
        CACHE_NAME = config.CACHE_NAME;
        SYSTEM_PROMPT = config.SYSTEM_PROMPT;
        
        // Initialize messages array after SYSTEM_PROMPT is loaded
        messages = [{ role: "system", content: SYSTEM_PROMPT }];
        statusDiv.innerText = "Configuration loaded.";
    } catch (error) {
        console.error("Failed to load configuration:", error);
        statusDiv.innerText = "Error loading configuration. See console for details.";
        throw error; // Propagate error to stop further initialization
    }
}

/**
 * Initializes the WebLLM engine, downloading the model if necessary.
 */
async function initializeWebLLM() {
    try {
        const initProgressCallback = (report) => {
            console.log(report); // Log progress reports to console
            statusDiv.innerText = report.text; // Update status display
        };

        statusDiv.innerText = "Starting engine initialization...";

        engine = await CreateMLCEngine(MODEL_ID, {
            initProgressCallback: initProgressCallback,
            useIndexedDBCache: true // Enable persistent caching
        });

        statusDiv.innerText = "Model ready! Ask me anything...";
        console.log("Engine initialized successfully.");
    } catch (err) {
        console.error("Failed to initialize engine:", err);
        statusDiv.innerText = "Error initializing model. See console for details.";
        throw err; // Propagate error
    }
}

/**
 * Handles user input and gets a response from the WebLLM engine.
 */
async function handleChat() {
    const userText = userInput.value.trim();
    if (!userText) return; // Do nothing if input is empty

    if (!engine) {
        appendMessage('ai', 'Model not ready. Please wait for the required ~880MB download and initialization to complete.');
        return;
    }

    userInput.value = '';
    autoExpandTextarea(userInput); // Reset textarea height after sending
    appendMessage('user', userText); // Display user message
    messages.push({ role: "user", content: userText }); // Add to chat history

    const aiMessageContainer = appendMessage('ai', 'Thinking...'); // Display thinking message
    const aiMessageParagraph = aiMessageContainer.querySelector('p');
    let aiResponse = "";

    try {
        // Request chat completion from the engine
        const chunks = await engine.chat.completions.create({
            messages: messages,
            stream: true, // Enable streaming responses for better UX
        });

        aiMessageParagraph.textContent = ""; // Clear "Thinking..."

        // Process streamed chunks
        for await (const chunk of chunks) {
            const content = chunk.choices[0]?.delta?.content || "";
            aiResponse += content;
            aiMessageParagraph.textContent = aiResponse;
            chatOutput.scrollTop = chatOutput.scrollHeight; // Keep scrolling to bottom
        }

        messages.push({ role: "assistant", content: aiResponse }); // Add AI response to chat history
    } catch (error) {
        console.error("Chat error:", error);
        aiMessageParagraph.textContent = "Error generating response.";
    }
}

// Event listeners for sending messages
sendBtn.addEventListener('click', handleChat);
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { // Send on Enter, allow Shift+Enter for new line
        e.preventDefault(); // Prevent default new line behavior
        handleChat();
    }
});

/**
 * Event listener for the "Clear Cache" button.
 * Clears the WebLLM model cache from the browser's Cache Storage.
 */
clearCacheBtn.addEventListener('click', async () => {
    if (confirm("Are you sure you want to clear the model cache? This will require re-downloading it next time.")) {
        try {
            statusDiv.innerText = "Clearing model cache...";
            // Use caches.delete for Cache Storage with the correct cache name
            if (CACHE_NAME && await caches.delete(CACHE_NAME)) { // Check if CACHE_NAME is defined
                statusDiv.innerText = "Model cache cleared from Cache Storage. Reload the page to re-initialize if needed.";
                console.log("Model cache manually cleared from Cache Storage.");
                engine = null; // Invalidate the current engine instance
            } else {
                statusDiv.innerText = "Model cache not found or could not be cleared (check if CACHE_NAME is set).";
                console.log("Model cache not found or could not be cleared (check if CACHE_NAME is set).");
            }
        } catch (error) {
            console.error("Error clearing model cache:", error);
            statusDiv.innerText = "Error clearing cache. See console for details.";
        }
    }
});

/**
 * Overall initialization function. Loads config then initializes the WebLLM engine.
 */
async function initApp() {
    try {
        await loadConfig();
        await initializeWebLLM();
    } catch (error) {
        console.error("Application initialization failed:", error);
        statusDiv.innerText = "Application failed to initialize. See console for details.";
    }
}

// Autoload immediately
initApp();

/**
 * Event listener for page unload. Attempts to clear the model cache.
 * Note: Browser limitations may prevent this from always completing for large files.
 */
window.onbeforeunload = async () => {
    console.log("Attempting to delete model cache from Cache Storage on unload...");
    // Use caches.delete for Cache Storage. This is a best effort attempt.
    if (CACHE_NAME && await caches.delete(CACHE_NAME)) { // Check if CACHE_NAME is defined
        console.log("Model cache successfully deleted from Cache Storage on unload.");
    } else {
        console.log("Model cache not found or could not be deleted from Cache Storage on unload (check if CACHE_NAME is set).");
    }
};