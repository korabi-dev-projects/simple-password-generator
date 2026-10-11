const passwordInput = document.getElementById("password");
const lengthInput = document.getElementById("length");
const lengthValue = document.getElementById("lengthValue");

const lowercaseInput = document.getElementById("lowercase");
const uppercaseInput = document.getElementById("uppercase");
const numbersInput = document.getElementById("numbers");
const specialInput = document.getElementById("special");
const problematicInput = document.getElementById("problematic");
const historyEnabledInput = document.getElementById("historyEnabled");

const blacklistInput = document.getElementById("blacklist");
const copyButton = document.getElementById("copy");
const status = document.getElementById("status");
const toggleHistoryButton = document.getElementById("toggleHistory");
const clearHistoryButton = document.getElementById("clearHistory");
const historyContainer = document.getElementById("history");
const historySection = document.getElementById("historySection");

const CHARSETS = {
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  numbers: "0123456789",
  special: "!@#$%^&-=+;:,.?/"
};

const PROBLEMATIC_CHARACTERS = new Set([
  '"',
  "'",
  "`",
  "\\",
  "/",
  "|",
  "*",
  "?",
  "<",
  ">",
  ":",
  ";",
  "&",
  "$",
  "#",
  "%",
  "{",
  "}",
  "[",
  "]",
  "(",
  ")",
  "_",
  "~",
  "^"
]);
const DEFAULT_SETTINGS = {
  length: 20,
  lowercase: true,
  uppercase: true,
  numbers: true,
  special: true,
  problematic: false,
  historyEnabled: true,
  blacklist: "*_`'\"\\|{}[]()<>"
};
const HISTORY_STORAGE_KEY = "passwordGeneratorHistory";
const MAX_HISTORY_ENTRIES = 50;
let lastCopiedPassword = null;

function getRandomInt(max) {
  const array = new Uint32Array(1);

  const limit = Math.floor(0x100000000 / max) * max;

  while (true) {
    crypto.getRandomValues(array);

    if (array[0] < limit) {
      return array[0] % max;
    }
  }
}

function getBlacklist() {
  return new Set([...blacklistInput.value]);
}

function getAvailableCharacters() {
  const blacklist = getBlacklist();

  let characters = "";

  if (lowercaseInput.checked) {
    characters += CHARSETS.lowercase;
  }

  if (uppercaseInput.checked) {
    characters += CHARSETS.uppercase;
  }

  if (numbersInput.checked) {
    characters += CHARSETS.numbers;
  }

  if (specialInput.checked) {
    characters += CHARSETS.special;
  }

  return [...new Set(characters)]
    .filter(character => {
      if (blacklist.has(character)) {
        return false;
      }

      if (
        problematicInput.checked &&
        PROBLEMATIC_CHARACTERS.has(character)
      ) {
        return false;
      }

      return true;
    })
    .join("");
}

function generatePassword(excludedPassword = "") {
  const length = Number(lengthInput.value);
  const characters = getAvailableCharacters();

  if (!characters.length) {
    passwordInput.value = "";
    status.textContent = "No characters available.";
    return false;
  }

  let password;
  do {
    password = "";

    for (let i = 0; i < length; i++) {
      password += characters[getRandomInt(characters.length)];
    }
  } while (
    password === excludedPassword &&
    characters.length > 1
  );

  passwordInput.value = password;
  status.textContent = "";
  return true;
}

function getSettings() {
  return {
    length: Number(lengthInput.value),
    lowercase: lowercaseInput.checked,
    uppercase: uppercaseInput.checked,
    numbers: numbersInput.checked,
    special: specialInput.checked,
    problematic: problematicInput.checked,
    historyEnabled: historyEnabledInput.checked,
    blacklist: blacklistInput.value
  };
}

async function saveSettings() {
  await chrome.storage.local.set({
    passwordGeneratorSettings: getSettings()
  });
}

async function getHistory() {
  const result = await chrome.storage.local.get(HISTORY_STORAGE_KEY);
  return Array.isArray(result[HISTORY_STORAGE_KEY])
    ? result[HISTORY_STORAGE_KEY]
    : [];
}

function renderHistory(history) {
  historyContainer.replaceChildren();

  if (!history.length) {
    const emptyMessage = document.createElement("div");
    emptyMessage.className = "history-empty";
    emptyMessage.textContent = "No copied passwords yet.";
    historyContainer.append(emptyMessage);
    return;
  }

  history.forEach(entry => {
    const historyEntry = document.createElement("div");
    historyEntry.className = "history-entry";

    const password = document.createElement("div");
    password.className = "history-password";
    password.textContent = entry.password;

    const timestamp = document.createElement("div");
    timestamp.className = "history-timestamp";
    timestamp.textContent = new Date(entry.timestamp).toLocaleString();

    const entryContent = document.createElement("div");
    entryContent.className = "history-entry-content";
    entryContent.append(password, timestamp);

    const copyHistoryButton = document.createElement("button");
    copyHistoryButton.className = "history-copy";
    copyHistoryButton.type = "button";
    copyHistoryButton.title = "Copy password";
    copyHistoryButton.textContent = "Copy";
    copyHistoryButton.addEventListener("click", async () => {
      await copyPassword(entry.password);
      status.textContent = "Copied!";
      setTimeout(() => {
        status.textContent = "";
      }, 1500);
    });

    historyEntry.append(entryContent, copyHistoryButton);
    historyContainer.append(historyEntry);
  });
}

async function saveToHistory(password) {
  const history = await getHistory();
  const historyWithoutDuplicate = history.filter(
    entry => entry.password !== password
  );

  historyWithoutDuplicate.unshift({
    password,
    timestamp: new Date().toISOString()
  });

  await chrome.storage.local.set({
    [HISTORY_STORAGE_KEY]: historyWithoutDuplicate.slice(0, MAX_HISTORY_ENTRIES)
  });
}

async function loadHistory() {
  renderHistory(await getHistory());
}

function updateHistoryVisibility() {
  historySection.hidden = !historyEnabledInput.checked;
}

async function copyPassword(password) {
  try {
    await navigator.clipboard.writeText(password);
  } catch {
    if (password === passwordInput.value) {
      passwordInput.select();
      document.execCommand("copy");
      return;
    }

    const fallbackInput = document.createElement("textarea");
    fallbackInput.value = password;
    fallbackInput.style.position = "fixed";
    fallbackInput.style.opacity = "0";
    document.body.append(fallbackInput);
    fallbackInput.select();
    document.execCommand("copy");
    fallbackInput.remove();
  }
}

async function loadSettings() {
  const result = await chrome.storage.local.get(
    "passwordGeneratorSettings"
  );

  const settings = {
    ...DEFAULT_SETTINGS,
    ...(result.passwordGeneratorSettings || {})
  };

  lengthInput.value = settings.length;
  lengthValue.textContent = settings.length;

  lowercaseInput.checked = settings.lowercase;
  uppercaseInput.checked = settings.uppercase;
  numbersInput.checked = settings.numbers;
  specialInput.checked = settings.special;
  problematicInput.checked = settings.problematic;
  historyEnabledInput.checked = settings.historyEnabled;

  blacklistInput.value = settings.blacklist;

  updateHistoryVisibility();
  generatePassword();
}

async function settingsChanged() {
  generatePassword();
  await saveSettings();
}

lengthInput.addEventListener("input", () => {
  lengthValue.textContent = lengthInput.value;
  settingsChanged();
});

[
  lowercaseInput,
  uppercaseInput,
  numbersInput,
  specialInput,
  problematicInput,
  historyEnabledInput,
  blacklistInput
].forEach(input => {
  input.addEventListener("input", settingsChanged);
});

historyEnabledInput.addEventListener("change", () => {
  updateHistoryVisibility();
  saveSettings();
});

copyButton.addEventListener("click", async () => {
  if (!passwordInput.value) {
    return;
  }

  if (lastCopiedPassword === passwordInput.value) {
    generatePassword(lastCopiedPassword);
  }

  await copyPassword(passwordInput.value);
  lastCopiedPassword = passwordInput.value;
  if (historyEnabledInput.checked) {
    await saveToHistory(passwordInput.value);
  }
  if (historyEnabledInput.checked && !historyContainer.hidden) {
    await loadHistory();
  }
  status.textContent = "Copied!";

  setTimeout(() => {
    status.textContent = "";
  }, 1500);
});

toggleHistoryButton.addEventListener("click", async () => {
  if (!historyEnabledInput.checked) {
    return;
  }

  historyContainer.hidden = !historyContainer.hidden;
  toggleHistoryButton.textContent = historyContainer.hidden ? "View" : "Hide";

  if (!historyContainer.hidden) {
    await loadHistory();
  }
});

clearHistoryButton.addEventListener("click", async () => {
  await chrome.storage.local.remove(HISTORY_STORAGE_KEY);
  renderHistory([]);
  historyContainer.hidden = false;
  toggleHistoryButton.textContent = "Hide";
});

loadSettings();
