# ⚡ Jira Quick Open

Press a shortcut, type a ticket number, hit Enter — and you're there. No more clicking through Jira.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue?logo=googlechrome&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow)

---

> **`Ctrl+Shift+Y`** → type `PROJ-1234` → **`Enter`** to open · **`Ctrl+Enter`** to copy the link

---

## Features

- **Keyboard-first** — open any ticket or copy its link without touching the mouse
- **Instant navigation** — type a ticket number (e.g. `PROJ-1234`) and open it directly
- **Copy link** — copy the ticket URL to clipboard without opening a new tab
- **Multiple workspaces** — configure and switch between different Jira instances
- **Recent history** — quickly reopen your last 10 tickets
- **Smart prefix detection** — type just the number and the prefix is auto-completed
- **Keyboard shortcuts** — open the popup and copy links without touching the mouse
- **Multilingual** — English, Spanish, and Portuguese supported
- **Configurable behavior** — choose whether tickets open in a new tab or the current one

---

## Keyboard Shortcuts

| Action           | Windows / Linux | Mac           |
| ---------------- | --------------- | ------------- |
| Open popup       | `Ctrl+Shift+Y`  | `Cmd+Shift+Y` |
| Copy ticket link | `Ctrl+Enter`    | `Cmd+Enter`   |

> Shortcuts can be customized from the extension's Settings tab or at `chrome://extensions/shortcuts`.

---

## Installation

### From the Chrome Web Store

_(Coming soon)_

### Manual (Developer Mode)

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked** and select the project folder

---

## Setup

1. Click the extension icon (or press `Ctrl+Shift+Y`)
2. If no workspaces are configured, click the ⚙ icon to open Settings
3. Add your Jira workspace — you'll need:
   - **Name**: display name (e.g. `My Company`)
   - **Slug**: the subdomain of your Atlassian URL (e.g. `mycompany` for `mycompany.atlassian.net`)
   - **Prefixes** _(optional)_: ticket prefixes like `PROJ, TASK` — enables typing just the number
4. Press `Ctrl+Shift+Y` to open the popup, type your ticket, and hit Enter

---

## Project Structure

```
jira-quick-open/
├── manifest.json          # Extension config and permissions
├── icons/                 # Extension icons (16, 32, 48, 128px)
├── popup/
│   ├── popup.html         # Main popup UI
│   ├── popup.js           # Popup logic
│   └── popup.css          # Popup styles
├── options/
│   ├── options.html       # Settings page UI
│   ├── options.js         # Settings logic
│   └── options.css        # Settings styles
└── _locales/
    ├── en/messages.json   # English
    ├── es/messages.json   # Spanish
    └── pt_BR/messages.json # Portuguese
```

---

## Privacy

Jira Quick Open does not collect, transmit, or share any user data. All configuration and history is stored locally on your device via `chrome.storage.sync`.

[Full Privacy Policy](https://docs.google.com/document/d/1b-e4_GvYL1WVzPvnspMl7hUTtU3nzILETDcY4eOnrRM/preview)

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

---

## License

[MIT](LICENSE)
