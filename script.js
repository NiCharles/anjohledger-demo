// ----- GA4 placeholder -----
const GA_MEASUREMENT_ID = "G-XXXXXXXXXX"; // replace later
const GA_ENDPOINT = "https://www.google-analytics.com/mp/collect";
const GA_API_SECRET = "YOUR_API_SECRET"; // replace when you create it

// ----- Google Sheets webhook placeholder -----
const SHEETS_WEBHOOK_URL = "https://script.google.com/macros/s/REPLACE_ME/exec";

// ----- Session + timing -----
let currentScreenId = "chaos";
let sessionId = generateSessionId();
let screenEnterTime = Date.now();

function generateSessionId() {
  return (
    "sess_" +
    Math.random().toString(36).substring(2, 10) +
    Date.now().toString(36)
  );
}

// ----- Screen navigation -----
function showScreen(nextId) {
  if (nextId === currentScreenId) return;

  const now = Date.now();
  const timeOnScreen = now - screenEnterTime;

  trackEvent("screen_exit", {
    screen: currentScreenId,
    time_ms: timeOnScreen
  });

  const screens = document.querySelectorAll(".screen");
  screens.forEach((s) => {
    if (s.dataset.screenId === nextId) {
      s.classList.add("active");
    } else {
      s.classList.remove("active");
    }
  });

  currentScreenId = nextId;
  screenEnterTime = Date.now();

  trackEvent("screen_view", {
    screen: currentScreenId
  });
}

// ----- Event tracking wrapper -----
function trackEvent(eventName, params = {}) {
  const payload = {
    event: eventName,
    screen: currentScreenId,
    session: sessionId,
    timestamp: new Date().toISOString(),
    ...params
  };

  console.log("[analytics]", payload);

  sendToGA4(eventName, payload);
  sendToSheets(payload);
}

// ----- GA4 send -----
function sendToGA4(eventName, payload) {
  if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === "G-XXXXXXXXXX") {
    return;
  }

  const body = {
    client_id: sessionId,
    events: [
      {
        name: eventName,
        params: payload
      }
    ]
  };

  const url = `${GA_ENDPOINT}?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${GA_API_SECRET}`;

  fetch(url, {
    method: "POST",
    body: JSON.stringify(body)
  }).catch((err) => {
    console.warn("GA4 error", err);
  });
}

// ----- Sheets send -----
function sendToSheets(payload) {
  if (!SHEETS_WEBHOOK_URL || SHEETS_WEBHOOK_URL.includes("REPLACE_ME")) {
    return;
  }

  fetch(SHEETS_WEBHOOK_URL, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  }).catch((err) => {
    console.warn("Sheets error", err);
  });
}

// ----- Wire up buttons -----
function setupNavigation() {
  document.querySelectorAll("[data-next-screen]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = btn.getAttribute("data-next-screen");
      const isPrimary = btn.classList.contains("cta-primary");
      const isSecondary = btn.classList.contains("cta-secondary");

      if (isPrimary) {
        trackEvent("cta_primary_clicked", { target_screen: next });
      } else if (isSecondary) {
        trackEvent("cta_secondary_clicked", { target_screen: next });
      }

      showScreen(next);
    });
  });

  const whatsappCta = document.getElementById("whatsapp-cta");
  if (whatsappCta) {
    whatsappCta.addEventListener("click", () => {
      trackEvent("whatsapp_cta_clicked", {
        href: whatsappCta.href
      });
    });
  }
}

// ----- Init -----
document.addEventListener("DOMContentLoaded", () => {
  setupNavigation();
  trackEvent("screen_view", { screen: currentScreenId });
});
