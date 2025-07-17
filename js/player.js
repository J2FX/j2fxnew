(function () {
  const widgetConfig = {
    title: "🔊 Tour em Áudio",
    position: "bottom-right",
    theme: "light",
    autoplay: true,
    apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuaGdxbWZlZ2F3a2piaXdndmVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyMTA5MDUsImV4cCI6MjA2MTc4NjkwNX0.SjMbOC1zmsorsx8c9658Mu2MZQOpEQtT5jtNcUdAsl4",
    supabaseUrl: "https://cnhgqmfegawkjbiwgvef.supabase.co/rest/v1/audios",
    logoUrl: "https://pluralweb-audios.s3.amazonaws.com/pluralweb-logo.png"
  };

  // IDs das seções e respectivo slug no supabase
  const sectionSlugs = {
    "home": "home",
    "servicos": "servicos",
    "solucoes": "solucoes",
    "tour": "tour"
  };

  // Teclas de navegação para seções
  const sectionKeys = {
    "1": "home",
    "2": "servicos",
    "3": "solucoes",
    "0": "tour"
  };

  // Slug do áudio de menu
  const menuSlug = "menu";

  let currentSection = null;
  let aguardandoEscolha = true;
  let audioPlayer = null;

  // Cria ou pega elemento de player
  function getPlayer() {
    let player = document.getElementById("audio-widget-player");
    if (!player) {
      player = document.createElement("audio");
      player.id = "audio-widget-player";
      player.style.display = "none";
      document.body.appendChild(player);
    }
    return player;
  }

  // Busca áudio do Supabase
  async function fetchAudioUrl(slug) {
    let url = widgetConfig.supabaseUrl + `?slug=eq.${slug}&select=url`;
    let res = await fetch(url, {
      headers: {
        apikey: widgetConfig.apiKey,
        Authorization: `Bearer ${widgetConfig.apiKey}`
      }
    });
    let data = await res.json();
    if (data && data.length && data[0].url) return data[0].url;
    return null;
  }

  // Reproduz áudio genérico
  function playAudio(src, onend) {
    audioPlayer = getPlayer();
    audioPlayer.src = src;
    audioPlayer.onended = onend;
    audioPlayer.play();
  }

  // Toca o áudio da seção indicada
  async function playSectionAudio(sectionId) {
    aguardandoEscolha = false;
    const slug = sectionSlugs[sectionId];
    if (!slug) return;
    const audioUrl = await fetchAudioUrl(slug);
    if (audioUrl) {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => {
        playAudio(audioUrl, () => {
          aguardandoEscolha = true;
          playMenuAudio();
        });
      }, 500);
    } else {
      aguardandoEscolha = true;
      playMenuAudio();
    }
  }

  // Toca o áudio do menu
  async function playMenuAudio() {
    const menuUrl = await fetchAudioUrl(menuSlug);
    if (menuUrl) {
      playAudio(menuUrl, () => {
        aguardandoEscolha = true;
        // Depois do menu, aguarda ação do usuário
      });
    }
  }

  // Descobre seção na tela ao rolar (mantida sua estrutura)
  function getSectionInView() {
    const sections = document.querySelectorAll("section");
    let sectionId = null;
    let minOffset = Number.POSITIVE_INFINITY;
    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      if (rect.top >= 0 && rect.top < minOffset) {
        minOffset = rect.top;
        sectionId = section.id;
      }
    });
    return sectionId;
  }

  function handleSectionChange() {
    if (!aguardandoEscolha) return;
    const newSection = getSectionInView();
    if (newSection !== currentSection) {
      currentSection = newSection;
      playSectionAudio(currentSection);
    }
  }

  // Monitoramento: rolar página
  window.addEventListener("scroll", () => {
    setTimeout(handleSectionChange, 150);
  });

  // Na entrada do site, toca menu (e depois seção visível)
  document.addEventListener("DOMContentLoaded", () => {
    currentSection = getSectionInView();
    playMenuAudio();
  });

  // Teclas: 1,2,3,0 (zero para o tour), sempre toca menu no fim
  document.addEventListener("keydown", (e) => {
    if (!aguardandoEscolha) return;
    const sectionId = sectionKeys[e.key];
    if (sectionId) {
      playSectionAudio(sectionId);
    }
  });

})();
