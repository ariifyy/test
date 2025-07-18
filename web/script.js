// ------ STYLING ------
// Dark/light mode toggle logic
const toggleBtn = document.getElementById("themeToggle");
const icon = document.getElementById("themeIcon");

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);

  if (icon) {
    icon.src = theme === "dark" ? "assets/sun.png" : "assets/moon.png";
    icon.alt = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
  }

  const logo = document.getElementById("logo");
  if (logo) {
    logo.src = theme === "dark" ? "assets/logodark.png" : "assets/logolight.png";
  }
}

if (toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme") || "dark";
  setTheme(savedTheme);
});

// Typewriter effect for landing page
const typewriterEl = document.getElementById("typewriter");
const phrases = [
  "Protect your data",
  "Use our OSINT tools",
  "Spot the scams",
  "Guard your digital footprint",
  "Download our desktop application"
];

let currentPhraseIndex = 0;
let currentCharIndex = 0;
let isDeleting = false;

const typingSpeed = 80;      // ms per character typing speed (slow)
const deletingSpeed = 30;    // ms per character deleting speed (fast)
const pauseAfterTyping = 1800;  // ms pause after full phrase typed
const pauseAfterDeleting = 300; // ms pause after deletion before next phrase

function typewriterCycle() {
  const currentPhrase = phrases[currentPhraseIndex];
  
  if (!isDeleting) {
    // Typing phase
    typewriterEl.textContent = currentPhrase.substring(0, currentCharIndex + 1);
    currentCharIndex++;
    
    if (currentCharIndex === currentPhrase.length) {
      // Finished typing, pause then delete
      setTimeout(() => {
        isDeleting = true;
        typewriterCycle();
      }, pauseAfterTyping);
    } else {
      setTimeout(typewriterCycle, typingSpeed);
    }
  } else {
    // Deleting phase
    typewriterEl.textContent = currentPhrase.substring(0, currentCharIndex - 1);
    currentCharIndex--;
    
    if (currentCharIndex === 0) {
      // Finished deleting, move to next phrase
      isDeleting = false;
      currentPhraseIndex = (currentPhraseIndex + 1) % phrases.length;
      setTimeout(typewriterCycle, pauseAfterDeleting);
    } else {
      setTimeout(typewriterCycle, deletingSpeed);
    }
  }
}

if (typewriterEl) {
  typewriterCycle();
}



// ------ FUNCTIONALITY ------
// Password breach checker using HIBP API
const form = document.getElementById("hibpForm");
const input = document.getElementById("passwordInput");
const resultDiv = document.getElementById("result");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const password = input.value;
    resultDiv.textContent = "Checking...";

    const hash = await sha1(password);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5).toUpperCase();

    try {
      const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
      const text = await res.text();
      const lines = text.split("\n");
      const found = lines.find((line) => line.startsWith(suffix));
      if (found) {
        const count = found.split(":")[1].trim();
        resultDiv.innerHTML = `<span style="color: red;">⚠️ This password has been found ${count} times in data breaches.</span>`;
      } else {
        resultDiv.innerHTML = `<span style="color: green;">✅ This password was not found in known breaches.</span>`;
      }
    } catch (err) {
      resultDiv.textContent = "Error checking password.";
    }
  });
}

// SHA-1 hashing function for HIBP API
async function sha1(str) {
  const buffer = new TextEncoder().encode(str);
  const digest = await crypto.subtle.digest("SHA-1", buffer);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

// Unified password toggle visibility for all password-wrapper blocks
document.querySelectorAll('.toggle-password').forEach(toggleBtn => {
  toggleBtn.addEventListener('click', () => {
    const wrapper = toggleBtn.closest('.password-wrapper');
    if (!wrapper) return;

    const input = wrapper.querySelector('.password-input');
    if (!input) return;

    if (input.type === 'password') {
      input.type = 'text';
      toggleBtn.textContent = 'Hide';
      toggleBtn.setAttribute('aria-label', 'Hide password');
    } else {
      input.type = 'password';
      toggleBtn.textContent = 'Show';
      toggleBtn.setAttribute('aria-label', 'Show password');
    }
  });
});



// Password strength checking
const strengthMeter = document.getElementById("strengthMeter");
const strengthText = document.getElementById("strengthText");
const entropyText = document.getElementById("entropyValue");
const tipsList = document.getElementById("passwordTips");
const strengthPasswordInput = document.getElementById("strengthPasswordInput");

if (strengthPasswordInput) {
  strengthPasswordInput.addEventListener("input", () => {
    const password = strengthPasswordInput.value;
    const score = calculatePasswordScore(password);
    const entropy = calculateEntropy(password);

    if (strengthMeter) strengthMeter.value = score;
    if (strengthText) strengthText.textContent = getStrengthLabel(score);
    if (entropyText) entropyText.textContent = `${entropy.toFixed(2)} bits`;
    if (tipsList) tipsList.innerHTML = generateTips(password).map(tip => `<li>${tip}</li>`).join("");
  });
}

function calculatePasswordScore(password) {
  let score = 0;
  if (!password) return score;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

function getStrengthLabel(score) {
  switch (score) {
    case 0:
    case 1:
      return "Very Weak";
    case 2:
      return "Weak";
    case 3:
      return "Moderate";
    case 4:
      return "Strong";
    case 5:
      return "Very Strong";
    default:
      return "";
  }
}

function calculateEntropy(password) {
  let charsetSize = 0;
  if (/[a-z]/.test(password)) charsetSize += 26;
  if (/[A-Z]/.test(password)) charsetSize += 26;
  if (/[0-9]/.test(password)) charsetSize += 10;
  if (/[^A-Za-z0-9]/.test(password)) charsetSize += 32; // Simplified symbols set
  return password.length * Math.log2(charsetSize || 1);
}

function generateTips(password) {
  const tips = [];
  if (password.length < 12) tips.push("Use at least 12 characters.");
  if (!/[A-Z]/.test(password)) tips.push("Include uppercase letters.");
  if (!/[a-z]/.test(password)) tips.push("Include lowercase letters.");
  if (!/[0-9]/.test(password)) tips.push("Add numbers.");
  if (!/[^A-Za-z0-9]/.test(password)) tips.push("Use special characters (e.g. !@#$%).");
  return tips;
}

// Entropy popup
const entropyInfoBtn = document.getElementById("entropyInfoBtn");
if (entropyInfoBtn) {
  entropyInfoBtn.addEventListener("click", () => {
    alert("Password entropy is a measure of how unpredictable a password is. Higher entropy means better resistance against brute-force attacks.");
  });
}

window.addEventListener("DOMContentLoaded", () => {
  const generateBtn = document.getElementById("generatePasswordBtn");
  const passwordOutput = document.getElementById("generatedPassword");
  const lengthInput = document.getElementById("passwordLength");
  const uppercaseCheckbox = document.getElementById("includeUppercase");
  const lowercaseCheckbox = document.getElementById("includeLowercase");
  const digitsCheckbox = document.getElementById("includeDigits");
  const symbolsCheckbox = document.getElementById("includeSymbols");
  const ambiguousCheckbox = document.getElementById("avoidAmbiguous");
  const copyBtn = document.getElementById("copyPasswordBtn");

  let lastGenerated = "";

  const CHAR_SETS = {
    upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    lower: "abcdefghijklmnopqrstuvwxyz",
    digits: "0123456789",
    symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?/~",
    ambiguous: "Il1O0|`'\"\\"
  };

  function generatePassword() {
    const length = parseInt(lengthInput.value, 10) || 12;
    let characterPool = "";

    if (uppercaseCheckbox.checked) characterPool += CHAR_SETS.upper;
    if (lowercaseCheckbox.checked) characterPool += CHAR_SETS.lower;
    if (digitsCheckbox.checked) characterPool += CHAR_SETS.digits;
    if (symbolsCheckbox.checked) characterPool += CHAR_SETS.symbols;

    if (ambiguousCheckbox.checked) {
      const ambiguousChars = new Set(CHAR_SETS.ambiguous.split(""));
      characterPool = [...characterPool].filter(c => !ambiguousChars.has(c)).join("");
    }

    if (!characterPool) {
      passwordOutput.value = "Select at least one character set!";
      return;
    }

    let password = "";
    for (let i = 0; i < length; i++) {
      const index = Math.floor(Math.random() * characterPool.length);
      password += characterPool[index];
    }

    passwordOutput.value = password;
    lastGenerated = password;
    copyBtn.textContent = "Copy";
    copyBtn.disabled = false;
  }

  function copyPasswordToClipboard() {
    if (!lastGenerated) return;

    navigator.clipboard.writeText(lastGenerated)
      .then(() => {
        copyBtn.textContent = "Copied!";
        copyBtn.disabled = true;
      })
      .catch(() => {
        copyBtn.textContent = "Failed to copy!";
      });
  }

  if (generateBtn) generateBtn.addEventListener("click", generatePassword);
  if (copyBtn) copyBtn.addEventListener("click", copyPasswordToClipboard);
});


// Email breach checker
const emailForm = document.getElementById("emailForm");
const emailInput = document.getElementById("emailInput");
const emailResult = document.getElementById("emailResult");

if (emailForm) {
  emailForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    emailResult.innerHTML = "<p>Checking...</p>";

    try {
      const res = await fetch(`https://api.xposedornot.com/v1/check-email/${encodeURIComponent(email)}`);
      const data = await res.json();

      if (data && data.status === "success" && data.breaches.length > 0) {
        const breachesList = data.breaches.map(b => `<li>${b}</li>`).join("");
        emailResult.innerHTML = `
          <p>⚠️ This email was found in <strong>${data.breaches.length}</strong> breach(es).</p>
          <button id="toggleDetails">Show Details</button>
          <ul id="breachDetails" class="hidden">${breachesList}</ul>
        `;

        const toggleBtn = document.getElementById("toggleDetails");
        const breachDetails = document.getElementById("breachDetails");

        toggleBtn.addEventListener("click", () => {
          breachDetails.classList.toggle("hidden");
          toggleBtn.textContent = breachDetails.classList.contains("emailhidden") ? "Show Details" : "Hide Details";
        });
      } else if (data.status === "not_found") {
        emailResult.innerHTML = "<p>✅ No breaches found for this email.</p>";
      } else {
        emailResult.innerHTML = "<p>❗ Unexpected response from the API.</p>";
      }
    } catch (err) {
      emailResult.innerHTML = "<p>❌ Error checking email.</p>";
    }
  });
}

//URL expander via unshorten.me ***(limited to 10/ip/hour)***
async function expandURL() {
  const input = document.getElementById('shortUrlInput').value.trim();
  const resultDiv = document.getElementById('expandURLresult');

  if (!input) {
    resultDiv.textContent = "Please enter a URL.";
    return;
  }

  try {
    const apiUrl = `https://unshorten.me/json/${encodeURIComponent(input)}`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.success && data.resolved_url) {
      resultDiv.innerHTML = `
        <strong>Expanded URL:</strong><br>
        <a href="${data.resolved_url}" target="_blank">${data.resolved_url}</a>
      `;
    } else {
      resultDiv.textContent = "Could not resolve the URL.";
    }
  } catch (error) {
    resultDiv.textContent = `Error: ${error.message}`;
  }
}

// QRCode decoder
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("qrInput");
  const canvas = document.getElementById("qrCanvas");
  const resultDiv = document.getElementById("qrResult"); // outside dropZone now
  const dropZone = document.getElementById("dropZone");
  const ctx = canvas.getContext("2d");

  showUpload();

  // Drag-and-drop upload
  dropZone.addEventListener("click", () => input.click());

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file);
  });

  input.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) handleImageFile(file);
  });

  function handleImageFile(file) {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target.result;
    };

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        resultDiv.innerHTML = `
          <strong>QR Code Content:</strong><br>
          <a href="${code.data}" target="_blank" rel="noopener noreferrer">${code.data}</a>
        `;
      } else {
        resultDiv.textContent = "Invalid / No QR code found in the image.";
      }
    };

    reader.readAsDataURL(file);
  }

  // Expose toggles globally
  window.showUpload = showUpload;
  window.showScanner = showScanner;
  window.rescan = rescan;
});

let html5QrcodeScanner = null;
let scanningPaused = false;

function startScanner() {
  const qrResult = document.getElementById("qrScanResult");
  const scanAgainBtn = document.getElementById("scanAgainBtn");
  qrResult.innerHTML = "Initializing camera...";
  scanAgainBtn.style.display = "none";
  scanningPaused = false;

  if (!html5QrcodeScanner) {
    html5QrcodeScanner = new Html5Qrcode("reader");
  }

  const config = { fps: 10, qrbox: 250 };

  html5QrcodeScanner.start(
    { facingMode: "environment" },
    config,
    (decodedText) => {
      if (scanningPaused) return;

      scanningPaused = true;
      qrResult.innerHTML = `
        <strong>QR Code Content:</strong><br>
        <a href="${decodedText}" target="_blank" rel="noopener noreferrer">${decodedText}</a>
      `;
      scanAgainBtn.style.display = "inline-block";
    },
    (errorMessage) => {
      // optional: log error
    }
  ).catch(err => {
    const qrResult = document.getElementById("qrScanResult");
    qrResult.textContent = `Camera start failed: ${err}`;
    
    // attempt cleanup
    stopScanner().then(() => {
      showUpload();  // Fallback to upload mode if camera fails
    });
  });
}

function stopScanner() {
  if (html5QrcodeScanner) {
    return html5QrcodeScanner.stop().then(() => {
      return html5QrcodeScanner.clear();
    }).then(() => {
      html5QrcodeScanner = null;
    }).catch((err) => {
      console.error("Failed to stop scanner: ", err);
    });
  }
  return Promise.resolve();
}

function rescan() {
  const scanAgainBtn = document.getElementById("scanAgainBtn");
  const qrResult = document.getElementById("qrScanResult");
  qrResult.innerHTML = "";
  scanAgainBtn.style.display = "none";
  scanningPaused = false;
}

function showUpload() {
  stopScanner();

  document.getElementById("scannerSection").style.display = "none";
  document.getElementById("uploadSection").style.display = "block";

  document.getElementById("qrScanResult").innerHTML = "";
  document.getElementById("qrResult").innerHTML = "";

  const scanAgainBtn = document.getElementById("scanAgainBtn");
  if (scanAgainBtn) scanAgainBtn.style.display = "none";
}

function showScanner() {
  document.getElementById("uploadSection").style.display = "none";
  document.getElementById("scannerSection").style.display = "block";

  document.getElementById("qrScanResult").innerHTML = "";
  document.getElementById("qrResult").innerHTML = "";

  const scanAgainBtn = document.getElementById("scanAgainBtn");
  if (scanAgainBtn) scanAgainBtn.style.display = "none";

  startScanner();
}




//URL risk identifier logic
document.getElementById("urlForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const url = document.getElementById("urlInput").value.trim();
  const resultDiv = document.getElementById("result");

  if (!url) return;

  const risks = analyzeURL(url);
  const riskLevel = risks.length === 0 ? "Low Risk ✅" :
                    risks.length <= 2 ? "Moderate Risk ⚠️" :
                    "High Risk 🚨";

  resultDiv.innerHTML = `
    <h3>Analysis Result: ${riskLevel}</h3>
    <ul>
      ${risks.length ? risks.map(risk => `<li>${risk}</li>`).join('') : "<li>No major issues detected.</li>"}
    </ul>
  `;
});

function analyzeURL(inputUrl) {
  const warnings = [];

  try {
    const parsed = new URL(inputUrl);

    // No HTTPS
    if (parsed.protocol !== "https:") {
      warnings.push("❌ Uses HTTP instead of HTTPS.");
    }

    // IP address instead of domain
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(parsed.hostname)) {
      warnings.push("❌ Domain is an IP address, which is unusual.");
    }

    // Typosquatting / brand misuse
    const knownBrands = ["google", "paypal", "apple", "amazon", "facebook"];
    knownBrands.forEach(brand => {
      if (parsed.hostname.includes(brand) && !parsed.hostname.endsWith(`${brand}.com`)) {
        warnings.push(`⚠️ Suspicious use of brand name "${brand}" in domain.`);
      }
    });

    // Suspicious TLD
    const riskyTLDs = [".tk", ".ml", ".gq", ".cf", ".ga"];
    riskyTLDs.forEach(tld => {
      if (parsed.hostname.endsWith(tld)) {
        warnings.push(`⚠️ Suspicious top-level domain (${tld}).`);
      }
    });

    // Long URL
    if (inputUrl.length > 100) {
      warnings.push("⚠️ Very long URL. Could be trying to obfuscate true destination.");
    }

    // Nested subdomains
    const subdomainParts = parsed.hostname.split(".");
    if (subdomainParts.length > 3) {
      warnings.push("⚠️ Deeply nested subdomain structure.");
    }

    // Encoded characters
    if (decodeURIComponent(parsed.href) !== parsed.href) {
      warnings.push("⚠️ Encoded characters found in URL.");
    }

    // Suspicious keywords
    const riskyWords = ["login", "verify", "secure", "update", "account", "free", "win"];
    riskyWords.forEach(word => {
      if (parsed.hostname.includes(word) || parsed.pathname.includes(word)) {
        warnings.push(`⚠️ Contains suspicious keyword: "${word}".`);
      }
    });

    // "@" symbol trick
    if (parsed.href.includes("@")) {
      warnings.push("⚠️ URL contains '@' symbol, may redirect to a different site.");
    }

    // Non-standard port
    if (parsed.port && parsed.port !== "80" && parsed.port !== "443") {
      warnings.push(`⚠️ Non-standard port used: ${parsed.port}.`);
    }

  } catch (error) {
    warnings.push("❌ Invalid URL format.");
  }

  return warnings;
}
