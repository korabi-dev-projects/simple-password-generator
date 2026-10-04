# Simple Password Generator

A lightweight browser extension for generating secure, customizable passwords directly in the browser.

## Features

- Generate passwords from 4 to 128 characters
- Include lowercase letters, uppercase letters, numbers, and special characters
- Avoid characters that may be problematic in some systems or forms
- Define a custom character blacklist
- Copy generated passwords to the clipboard
- Persist preferences between popup sessions
- Use the Web Crypto API for random character selection
- No third-party dependencies and no network connections

## Installation

### Chrome, Edge, or another Chromium-based browser

1. Download or clone this repository.
2. Open the browser's extensions page:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Choose the project directory where you cloned/downloaded the project.
6. Open the extension from the browser toolbar.

## Usage

1. Open the extension popup.
2. Set the desired password length.
3. Select the character categories to include.
4. Optionally enable **Avoid problematic characters**.
5. Add any additional characters to the blacklist.
6. Copy the generated password with **Copy**.

Settings are saved automatically using the browser's local extension storage.

## Project Structure

```text
.
├── manifest.json   # Extension metadata and permissions
├── popup.html      # Popup markup
├── popup.css       # Popup styles
├── popup.js        # Password generation and settings logic
├── LICENSE         # MIT License
└── README.md       # Project documentation
```

## Permissions

The extension requests only the `storage` permission so it can remember the user's generator settings. Password generation is performed locally, and the extension does not make network requests.

## Development

No build step or package installation is required. Edit the source files, then reload the unpacked extension from the browser's extensions page to test changes.

## License

This project is licensed under the [MIT License](LICENSE).
