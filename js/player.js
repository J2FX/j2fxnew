
const SUPABASE_URL = "https://cnhqgmfegawkjbiwgvef.supabase.co";
const SUPABASE_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuaGdxbWZlZ2F3a2piaXdndmVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyMTA5MDUsImV4cCI6MjA2MTc4NjkwNX0.SjMbOC1zmsorsx8c9658Mu2MZQOpEQtT5jtNcUdAsl4";

let currentSection = "menu";
let scrollEnabled = true;

const sectionMap = {
  "0": "tour",
  "1": "home",
  "2": "servicos",
  "3": "solucoes",
  "4": "contato"
};

function loadAudioForSection(sectionId) {
  const site = window.location.hostname;
  fetch(`${SUPABASE_URL}/rest/v1/audios?site=eq.${site}&page=eq.${sectionId}`, {
    headers: {
      apikey: SUPABASE_API_KEY,
      Authorization: `Bearer ${SUPABASE_API_KEY}`
    }
  })
  .then((res) => res.json())
  .then((data) => {
    if (data.length && data[0].audio_url) {
      const audio = document.getElementById("audio-guide");
      audio.src = data[0].audio_url;
      audio.play();
    }
  })
  .catch((err) => console.error("Erro ao carregar áudio:", err));
}

function createWidget() {
  const style = document.createElement("style");
  style.innerHTML = `
    #audio-widget {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: white;
      border: 1px solid #ccc;
      border-radius: 12px;
      padding: 10px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.15);
      width: 320px;
      font-family: Arial, sans-serif;
      z-index: 9999;
    }
    #audio-widget-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    #audio-widget-footer {
      text-align: center;
      font-size: 10px;
      color: #666;
      margin-top: 5px;
    }
  `;
  document.head.appendChild(style);

  const container = document.createElement("div");
  container.id = "audio-widget";
  container.innerHTML = `
    <div id="audio-widget-header">
      <span>🔊 Acessibilidade</span>
      <button id="audio-toggle" style="background:none;border:none;font-size:16px;">−</button>
    </div>
    <audio id="audio-guide" controls style="width:100%"></audio>
    <div id="audio-widget-footer">by Plural Web</div>
  `;
  document.body.appendChild(container);

  document.getElementById("audio-toggle").addEventListener("click", () => {
    const audio = document.getElementById("audio-guide");
    const footer = document.getElementById("audio-widget-footer");
    const isHidden = audio.style.display === "none";
    audio.style.display = isHidden ? "block" : "none";
    footer.style.display = isHidden ? "block" : "none";
    document.getElementById("audio-toggle").textContent = isHidden ? "−" : "+";
  });
}

function detectVisibleSection() {
  if (!scrollEnabled) return;
  const sections = document.querySelectorAll("section[id]");
  for (const section of sections) {
    const rect = section.getBoundingClientRect();
    if (rect.top >= 0 && rect.top < window.innerHeight / 2) {
      const id = section.getAttribute("id");
      if (id && id !== currentSection) {
        currentSection = id;
        loadAudioForSection(id);
      }
      break;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  createWidget();
  loadAudioForSection("menu");
});

document.addEventListener("keydown", (e) => {
  const targetSection = sectionMap[e.key];
  if (targetSection) {
    const el = document.getElementById(targetSection);
    if (el) {
      scrollEnabled = false;
      el.scrollIntoView({ behavior: "smooth" });
      loadAudioForSection(targetSection);
      currentSection = targetSection;
      setTimeout(() => scrollEnabled = true, 2000);
    }
  }
});

window.addEventListener("scroll", () => {
  setTimeout(detectVisibleSection, 200);
});
