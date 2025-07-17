(function() {
  // Configuração do widget – tudo aqui mesmo!
  const widgetConfig = {
    title: "🔊 Tour em Áudio",
    position: "bottom-right",
    theme: "light",
    autoplay: true,
    apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuaGdxbWZlZ2F3a2piaXdndmVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyMTA5MDUsImV4cCI6MjA2MTc4NjkwNX0.SjMbOC1zmsorsx8c9658Mu2MZQOpEQtT5jtNcUdAsl4",
    supabaseUrl: "https://cnhgqmfegawkjbiwgvef.supabase.co/rest/v1/audios",
    logoUrl: "https://pluralweb-audios.s3.sa-east-1.amazonaws.com/setup/logo-pluralweb.png"
  };

  // Estilos do Widget
  const style = document.createElement("style");
  style.innerHTML = `
    #audioWidget {
      position: fixed;
      ${widgetConfig.position === "bottom-right"
        ? "bottom: 32px; right: 32px;"
        : "bottom: 32px; left: 32px;"}
      z-index: 10000;
      background: #fff;
      border-radius: 24px;
      box-shadow: 0 2px 48px 0 rgba(60, 60, 60, 0.20);
      font-family: sans-serif;
      min-width: 340px;
      max-width: 400px;
      padding: 20px 22px 22px 22px;
      display: flex;
      flex-direction: column;
      gap: 18px;
      transition: box-shadow 0.2s;
    }
    #audioWidget.dark {
      background: #1b1b1b;
      color: #fff;
    }
    #audioWidgetHeader {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 1.20em;
      font-weight: 700;
      margin-bottom: 0;
    }
    #audioWidgetHeader img {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      object-fit: contain;
    }
    #playerContainer {
      width: 100%;
    }
    .status-message {
      font-size: 1.06em;
      color: #777;
      padding: 8px 0;
      min-height: 32px;
      text-align: center;
    }
    .audio-list-buttons {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: center;
      margin: 8px 0 0 0;
    }
    .audio-btn {
      background: #ececec;
      border: none;
      outline: none;
      border-radius: 7px;
      padding: 8px 15px;
      font-size: 1em;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }
    #audioWidget.dark .audio-btn {
      background: #232323;
      color: #fff;
    }
    .audio-btn:active {
      background: #003580;
      color: #fff;
    }
    .audio-btn.selected {
      background: #0071ff;
      color: #fff;
    }
    .audio-btn:disabled {
      background: #ccc;
      color: #888;
      cursor: not-allowed;
    }
    @media screen and (max-width: 600px) {
      #audioWidget { 
        min-width: 180px;
        max-width: 98vw;
        left: 3vw !important;
        right: 3vw !important;
        padding: 13px 10px 12px 10px;
      }
      #audioWidgetHeader { font-size: 1em; }
    }
  `;
  document.head.appendChild(style);

  // Criação de elementos HTML do widget
  const widget = document.createElement("div");
  widget.id = "audioWidget";
  if (widgetConfig.theme === "dark") widget.classList.add("dark");

  widget.innerHTML = `
    <div id="audioWidgetHeader">
      <img src="${widgetConfig.logoUrl}" alt="logo" />
      <span>${widgetConfig.title}</span>
    </div>
    <div id="playerContainer">
      <div class="status-message">Carregando...</div>
    </div>
    <div id="widgetHelpers" style="font-size:12px;color:#888;text-align:center;">
      Use <b>teclas numéricas</b> para ouvir cada trecho.<br>
      <b>0</b> para o tour completo.
    </div>
  `;
  document.body.appendChild(widget);

  let sections = [];
  let currentSection = null;

  // Carregar seções do Supabase
  async function fetchSections() {
    const playerContainer = document.getElementById("playerContainer");
    playerContainer.innerHTML = '<div class="status-message">Carregando...</div>';
    try {
      const response = await fetch(
        `${widgetConfig.supabaseUrl}?order=order.asc,slug.asc&select=slug,title,url`,
        {
          headers: {
            apikey: widgetConfig.apiKey,
            Authorization: `Bearer ${widgetConfig.apiKey}`
          }
        }
      );
      const data = await response.json();
      if (data && data.length) {
        // Separa o tour (slug == 'tour') das demais seções
        sections = data.filter(s => s.slug !== 'tour');
        window.sections = sections;
        createAudioButtons();
        // autoplay na primeira seção se desejado
        if (widgetConfig.autoplay && sections.length) {
          playSection(0);
        } else {
          playerContainer.innerHTML = '<div class="status-message">Selecione ou digite o número da seção desejada, ou 0 para tour completo.</div>';
        }
      } else {
        playerContainer.innerHTML = '<div class="status-message">Nenhum áudio disponível.</div>';
      }
    } catch (err) {
      playerContainer.innerHTML = '<div class="status-message">Erro ao carregar os áudios.</div>';
    }
  }

  // Cria botões para cada seção
  function createAudioButtons() {
    let buttonsContainer = widget.querySelector('.audio-list-buttons');
    if (buttonsContainer) buttonsContainer.remove();
    buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'audio-list-buttons';
    sections.forEach((section, i) => {
      const btn = document.createElement('button');
      btn.className = 'audio-btn';
      btn.textContent = `${i+1}. ${section.title || section.slug}`;
      btn.onclick = () => playSection(i);
      btn.dataset.idx = i;
      buttonsContainer.appendChild(btn);
    });
    widget.appendChild(buttonsContainer);
  }

  // Toca uma seção específica
  function playSection(idx) {
    const playerContainer = document.getElementById("playerContainer");
    if (!sections[idx]) return;
    currentSection = idx;
    // Atualiza UI
    let btns = widget.querySelectorAll('.audio-btn');
    [...btns].forEach(btn => btn.classList.remove('selected'));
    if (btns[idx]) btns[idx].classList.add('selected');
    // Audio player
    playerContainer.innerHTML = `
      <audio id="audioPlayer" controls autoplay>
        <source src="${sections[idx].url}" type="audio/mpeg">
        Seu navegador não suporta áudio.
      </audio>
      <div class="status-message">Tocando: ${sections[idx].title || sections[idx].slug}</div>
    `;
    const audioPlayer = document.getElementById('audioPlayer');
    audioPlayer.onended = () => {
      playerContainer.innerHTML +=
        '<div class="status-message">Trecho finalizado. Selecione outro ou pressione uma tecla numérica.</div>';
    };
    audioPlayer.focus();
  }

  // Toca o áudio tour completo (slug == 'tour')
  async function playTour() {
    const playerContainer = document.getElementById("playerContainer");
    playerContainer.innerHTML = '<div class="status-message">Carregando tour de áudio...</div>';
    try {
      const response = await fetch(
        `${widgetConfig.supabaseUrl}?slug=eq.tour&select=url,title`,
        {
          headers: {
            apikey: widgetConfig.apiKey,
            Authorization: `Bearer ${widgetConfig.apiKey}`
          }
        }
      );
      const data = await response.json();
      if (data && data.length && data[0].url) {
        playerContainer.innerHTML = `
          <audio id="audioPlayer" controls autoplay>
            <source src="${data[0].url}" type="audio/mpeg">
            Seu navegador não suporta áudio.
          </audio>
          <div class="status-message">Tocando: ${data[0].title || "Tour completo"}</div>
        `;
        const audioPlayer = document.getElementById('audioPlayer');
        audioPlayer.onended = function () {
          playerContainer.innerHTML = `
            <div class="status-message">
              Tour finalizado.<br>
              Aperte qualquer número de 1 a ${sections.length || 9} para uma seção, ou 0 para repetir o tour.
            </div>
          `;
        };
        audioPlayer.focus();
      } else {
        playerContainer.innerHTML = '<div class="status-message">Áudio do tour não encontrado.</div>';
      }
    } catch (err) {
      playerContainer.innerHTML = '<div class="status-message">Erro ao carregar o tour.</div>';
    }
  }

  // EVENTO: Teclas do teclado (1,2,3...,0 para o tour)
  document.addEventListener('keydown', function (event) {
    // Teclas numéricas 1 a N (notando que event.key é string '1', '2', etc.)
    if (/^[1-9]$/.test(event.key)) {
      const idx = Number(event.key) - 1;
      if (sections[idx]) {
        event.preventDefault();
        playSection(idx);
      }
    }
    // Tecla 0 para tour
    if (event.key === "0") {
      event.preventDefault();
      playTour();
    }
  });

  // Inicialização automática
  fetchSections();

})();
