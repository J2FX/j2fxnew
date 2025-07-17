// player.js

(function () {
  const widgetConfig = {
    title: "🔊 Tour em Áudio",
    position: "bottom-right",
    theme: "light",
    autoplay: true,
    apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuaGdxbWZlZ2F3a2piaXdndmVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyMTA5MDUsImV4cCI6MjA2MTc4NjkwNX0.SjMbOC1zmsorsx8c9658Mu2MZQOpEQtT5jtNcUdAsl4",
    supabaseUrl: "https://cnhgqmfegawkjbiwgvef.supabase.co/rest/v1/audios",
    logoUrl: "https://pluralweb-audios.s3.sa-east-1.amazonaws.com/setup/logo-pluralweb.png"
  };

  const style = document.createElement("style");
  style.innerHTML = `
    #audioWidget {
      position: fixed;
      ${widgetConfig.position === "top-right" ? "top: 20px; right: 20px;" :
      widgetConfig.position === "top-left" ? "top: 20px; left: 20px;" :
      widgetConfig.position === "bottom-right" ? "bottom: 20px; right: 20px;" :
        "bottom: 20px; left: 20px;"}
      background: ${widgetConfig.theme === "dark" ? "#333" : "#fff"};
      color: ${widgetConfig.theme === "dark" ? "#fff" : "#333"};
      border: 1px solid ${widgetConfig.theme === "dark" ? "#555" : "#ccc"};
      padding: 15px;
      z-index: 9999;
      width: 300px;
      box-shadow: 0 3px 8px rgba(0,0,0,0.15);
      border-radius: 10px;
      font-family: Arial, sans-serif;
      transition: all 0.3s ease;
    }
    #audioWidget.collapsed {
      width: auto;
      padding: 10px;
    }
    #audioHeader {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    #audioLogo {
      width: 30px;
      height: auto;
      margin-right: 10px;
    }
    #audioTitle {
      flex-grow: 1;
    }
    #audioWidget h4 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }
    #audioToggle {
      background: none;
      border: none;
      color: ${widgetConfig.theme === "dark" ? "#fff" : "#333"};
      cursor: pointer;
      font-size: 18px;
      padding: 0;
    }
    #audioPlayer {
      width: 100%;
    }
    .status-message {
      padding: 10px 0;
      text-align: center;
      font-style: italic;
      color: #666;
      font-size: 13px;
    }
    .debug-info {
      margin-top: 10px;
      padding: 5px;
      border: 1px dashed #ccc;
      border-radius: 4px;
      font-size: 11px;
      color: #666;
      display: none;
    }
  `;
  document.head.appendChild(style);

  const widget = document.createElement("div");
  widget.id = "audioWidget";
  widget.innerHTML = `
    <div id="audioHeader">
      <img id="audioLogo" src="${widgetConfig.logoUrl}" alt="PluralWeb Logo">
      <div id="audioTitle">
        <h4>${widgetConfig.title}</h4>
      </div>
      <button id="audioToggle" aria-label="Minimizar">−</button>
    </div>
    <div id="audioContent">
      <div id="playerContainer">
        <div class="status-message">Inicializando player...</div>
      </div>
      <div class="debug-info" id="debugInfo"></div>
    </div>
  `;
  document.body.appendChild(widget);

  const toggleBtn = document.getElementById("audioToggle");
  const content = document.getElementById("audioContent");
  const widgetElement = document.getElementById("audioWidget");
  const titleDiv = document.getElementById("audioTitle");

  toggleBtn.addEventListener("click", function () {
    if (this.innerHTML === "−") {
      this.innerHTML = "+";
      this.setAttribute("aria-label", "Expandir");
      content.style.display = "none";
      titleDiv.style.display = "none";
      widgetElement.classList.add("collapsed");
    } else {
      this.innerHTML = "−";
      this.setAttribute("aria-label", "Minimizar");
      content.style.display = "block";
      titleDiv.style.display = "block";
      widgetElement.classList.remove("collapsed");
    }
  });

  function updateStatus(message) {
    const container = document.getElementById("playerContainer");
    if (!container) return;
    const statusElement = container.querySelector(".status-message");
    if (statusElement) {
      statusElement.textContent = message;
    } else {
      const newStatus = document.createElement("div");
      newStatus.classList.add("status-message");
      newStatus.textContent = message;
      container.appendChild(newStatus);
    }
  }

  function updateDebug(info) {
    const debugElement = document.getElementById("debugInfo");
    if (debugElement) {
      debugElement.style.display = "block";
      debugElement.textContent = typeof info === "object"
        ? JSON.stringify(info, null, 2)
        : info;
    }
  }

  function createSimplePlayer(audioUrl) {
    updateStatus("Carregando áudio...");
    const container = document.getElementById("playerContainer");
    container.innerHTML = `
      <audio id="audioPlayer" controls>
        <source src="${audioUrl}" type="audio/mpeg">
        Seu navegador não suporta o elemento de áudio.
      </audio>
      <div class="status-message">Clique no play para ouvir</div>
    `;

    const audioElement = document.getElementById("audioPlayer");

    audioElement.addEventListener("loadstart", () => updateStatus("Iniciando carregamento..."));
    audioElement.addEventListener("canplay", () => updateStatus("Áudio pronto para reprodução. Clique no play!"));
    audioElement.addEventListener("playing", () => updateStatus("Em reprodução..."));
    audioElement.addEventListener("error", () => {
      const errors = {
        1: "Carregamento abortado", 2: "Erro de rede",
        3: "Erro de decodificação", 4: "Áudio não suportado"
      };
      const code = audioElement.error?.code || 0;
      updateStatus(`Erro: ${errors[code] || "Erro desconhecido"}`);
      updateDebug(audioElement.error);
    });

    if (widgetConfig.autoplay) {
      audioElement.play().catch(() => updateStatus("Clique no play para ouvir o áudio"));
    }
  }

  async function loadAudioForSection(section) {
    try {
      updateStatus("Buscando áudio...");
      const site = window.location.hostname;
      const page = section || "home";
      const apiUrl = `${widgetConfig.supabaseUrl}?site=eq.${encodeURIComponent(site)}&page=eq.${encodeURIComponent(page)}`;
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "apikey": widgetConfig.apiKey,
          "Authorization": `Bearer ${widgetConfig.apiKey}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.length > 0 && data[0].audio_url) {
        createSimplePlayer(data[0].audio_url);
      } else {
        updateStatus("Nenhum áudio disponível para esta seção");
      }
    } catch (error) {
      updateStatus("Erro ao carregar áudio");
      updateDebug(error.toString());
    }
  }

  // Detectar seção visível
  let currentSection = "";

  function getSectionInView() {
    const sections = document.querySelectorAll("section[id]");
    const scrollY = window.scrollY;
    let sectionId = "home";
    sections.forEach(section => {
      const offset = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollY >= offset - height / 2 && scrollY < offset + height / 2) {
        sectionId = section.id;
      }
    });
    return sectionId;
  }

  function handleSectionChange() {
    const newSection = getSectionInView();
    if (newSection !== currentSection) {
      currentSection = newSection;
      loadAudioForSection(currentSection);
    }
  }

  window.addEventListener("scroll", () => {
    setTimeout(handleSectionChange, 150);
  });

  document.addEventListener("DOMContentLoaded", () => {
    currentSection = getSectionInView();
    loadAudioForSection(currentSection);
  });
})();
