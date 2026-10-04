const passwordInput = document.getElementById("password");const lengthInput = document.getElementById("length");
const lengthValue = document.getElementById("lengthValue");

const lowercaseInput = document.getElementById("lowercase");
const uppercaseInput = document.getElementById("uppercase");
const numbersInput = document.getElementById("numbers");
const specialInput = document.getElementById("special");
const problematicInput = document.getElementById("problematic");

const blacklistInput = document.getElementById("blacklist");
const copyButton = document.getElementById("copy");
const status = document.getElementById("status");

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
  blacklist: "*_`'\"\\|{}[]()<>"
};

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

function generatePassword() {
  const length = Number(lengthInput.value);
  const characters = getAvailableCharacters();

  if (!characters.length) {
    passwordInput.value = "";
    status.textContent = "No characters available.";
    return;
  }

  let password = "";

  for (let i = 0; i < length; i++) {
    password += characters[getRandomInt(characters.length)];
  }

  passwordInput.value = password;
  status.textContent = "";
}

function getSettings() {
  return {
    length: Number(lengthInput.value),
    lowercase: lowercaseInput.checked,
    uppercase: uppercaseInput.checked,
    numbers: numbersInput.checked,
    special: specialInput.checked,
    problematic: problematicInput.checked,
    blacklist: blacklistInput.value
  };
}

async function saveSettings() {
  await chrome.storage.local.set({
    passwordGeneratorSettings: getSettings()
  });
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

  blacklistInput.value = settings.blacklist;

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
  blacklistInput
].forEach(input => {
  input.addEventListener("input", settingsChanged);
});

copyButton.addEventListener("click", async () => {
  if (!passwordInput.value) {
    return;
  }

  try {
    await navigator.clipboard.writeText(passwordInput.value);
  } catch {
    passwordInput.select();
    document.execCommand("copy");
  }

  status.textContent = "Copied!";

  setTimeout(() => {
    status.textContent = "";
  }, 1500);
});

loadSettings();
