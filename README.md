# YouTube Video Q&A Chrome Extension

This Chrome extension enables users to ask questions about any YouTube video and receive answers based on the video’s transcription. It’s built using React + Vite, with a backend that leverages OpenAI’s GPT-40-mini for question answering. The extension seamlessly integrates with YouTube to extract video transcriptions, making it easier to find relevant information without watching the entire video.

### Setup

Clone the Repository:

    ```bash
    git clone https://github.com/your-username/yt-video-qa-extension.git
    cd yt-video-qa-extension
    ```

Configure the API Key:

    Create or edit `config.json` in the `public` folder to include your OpenAI API key:

    ```json
    {
        "OPENAI_API_KEY": "your_openai_api_key_here"
    }
    ```

Install Dependencies:

    ```bash
    npm install
    # or
    yarn install
    ```

Build the Extension:
To build the extension, run:

    ```bash
    npm run build
    # or
    yarn build
    ```

    This command will generate the production files in the `dist` folder.

Load the Extension in Chrome: - Open Chrome and go to `chrome://extensions/`. - Enable **Developer mode** (toggle it on). - Click **Load unpacked** and select the `dist` folder.

## Usage

1. After loading the extension, navigate to a YouTube video.
2. Click the extension icon in the Chrome toolbar.
3. Type your question about the video content.
4. The extension will use the extracted transcript and GPT-40-mini to provide an answer based on the video's content.

## Important Notes

-   **API Key Security**: The API key in `config.json` is needed for accessing OpenAI’s API and should be kept secure. For production deployments, consider using a secure environment variable solution to manage API keys.
-   **Permissions**: This extension requires permissions to access YouTube’s DOM elements for extracting transcripts and modifying UI.

---

Enjoy exploring content with ease! If you encounter any issues or have feature suggestions, feel free to open an issue or contribute.
