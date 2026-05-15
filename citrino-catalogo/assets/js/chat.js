/* =====================================================
   CITRINO TIENDA — Chat IA Widget
   ===================================================== */

(function () {
  /* Base de la API: si se abre como file:// apunta al servidor local */
  /* Apunta al servidor Node salvo que ya estemos en él */
  const API_BASE =
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:3001'
      : '';

  const WELCOME_MSG =
    '¡Hola! Soy Citrino IA ✨ Tu asistente de fragancias. Puedo ayudarte a encontrar el aroma perfecto según tu estilo, ocasión o preferencias. ¿Por dónde empezamos?';

  /* ── Historial de mensajes para el contexto ─────── */
  const history = [];
  let isLoading = false;

  /* ── Inyectar HTML del widget ─────────────────────
     Se hace por JS para no contaminar el HTML principal */
  function injectWidget() {
    const tpl = document.createElement('div');
    tpl.id = 'chat-widget';
    tpl.setAttribute('aria-live', 'polite');
    tpl.innerHTML = `
      <!-- Panel de chat -->
      <div id="chat-panel" class="chat-panel" aria-hidden="true" role="dialog" aria-labelledby="chat-header-title">

        <!-- Header dorado -->
        <div class="chat-panel-header">
          <div class="chat-header-diamond" aria-hidden="true">
            ${diamondSVG(32)}
          </div>
          <div class="chat-header-info">
            <span class="chat-header-name" id="chat-header-title">Citrino IA</span>
            <span class="chat-header-status">
              <span class="chat-status-dot"></span>
              Asistente de fragancias
            </span>
          </div>
          <button id="chat-close-btn" class="chat-close-btn" aria-label="Cerrar asistente">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Mensajes -->
        <div class="chat-messages" id="chat-messages" tabindex="0" aria-label="Conversación con Citrino IA"></div>

        <!-- Input -->
        <div class="chat-input-area">
          <textarea
            id="chat-input"
            class="chat-input"
            placeholder="Pregúntame sobre fragancias…"
            rows="1"
            aria-label="Escribe tu pregunta"
            maxlength="500"
          ></textarea>
          <button id="chat-send-btn" class="chat-send-btn" aria-label="Enviar mensaje">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Botón diamante flotante -->
      <button id="chat-trigger-btn" class="chat-trigger" aria-label="Abrir asistente Citrino IA" aria-expanded="false">
        <span class="chat-trigger-icon chat-icon-diamond" aria-hidden="true">${diamondSVG(26)}</span>
        <span class="chat-trigger-icon chat-icon-close" aria-hidden="true" style="display:none">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </span>
        <span class="chat-trigger-pulse"></span>
      </button>
    `;
    document.body.appendChild(tpl);
  }

  /* ── SVG del diamante (igual al favicon) ──────── */
  function diamondSVG(size) {
    const s = size;
    const h = Math.round(s * 0.62);
    return `<svg width="${s}" height="${Math.round(s*0.9)}" viewBox="0 0 48 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cdia-${s}" x1="0" y1="0" x2="48" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stop-color="#FFE99A"/>
          <stop offset="50%"  stop-color="#D9B34A"/>
          <stop offset="100%" stop-color="#B7832C"/>
        </linearGradient>
      </defs>
      <!-- Top band -->
      <polygon points="14,0 34,0 48,14 0,14" fill="url(#cdia-${s})" opacity="0.95"/>
      <!-- Left facet -->
      <polygon points="0,14 14,0 14,44" fill="url(#cdia-${s})" opacity="0.65"/>
      <!-- Right facet -->
      <polygon points="48,14 34,0 34,44" fill="url(#cdia-${s})" opacity="0.8"/>
      <!-- Center facet -->
      <polygon points="14,0 34,0 34,44 14,44" fill="url(#cdia-${s})" opacity="0.45"/>
      <!-- Bottom tip -->
      <polygon points="0,14 48,14 24,44" fill="url(#cdia-${s})" opacity="0.9"/>
      <!-- Inner shine -->
      <polygon points="14,0 34,0 26,14 22,14" fill="white" opacity="0.25"/>
    </svg>`;
  }

  /* ── Renderizar texto del bot con links clickeables ── */
  function renderBotText(text) {
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    return escaped.replace(
      /(https?:\/\/[^\s<>"]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="chat-link">$1</a>'
    );
  }

  /* ── Agregar burbuja de mensaje ────────────────── */
  function addMessage(role, text) {
    const msgs = document.getElementById('chat-messages');
    const div  = document.createElement('div');
    div.className = `chat-msg chat-msg-${role}`;
    if (text) {
      if (role === 'bot') {
        div.innerHTML = renderBotText(text);
      } else {
        div.textContent = text;
      }
    }
    msgs.appendChild(div);
    scrollToBottom();
    return div;
  }

  /* ── Indicador de escritura (3 puntos) ─────────── */
  function showTyping() {
    const msgs = document.getElementById('chat-messages');
    const div  = document.createElement('div');
    div.className = 'chat-typing';
    div.innerHTML = '<span></span><span></span><span></span>';
    msgs.appendChild(div);
    scrollToBottom();
    return div;
  }

  function scrollToBottom() {
    const msgs = document.getElementById('chat-messages');
    msgs.scrollTop = msgs.scrollHeight;
  }

  /* ── Deshabilitar/habilitar envío ─────────────── */
  function setSending(val) {
    isLoading = val;
    const btn   = document.getElementById('chat-send-btn');
    const input = document.getElementById('chat-input');
    btn.disabled   = val;
    input.disabled = val;
    if (!val) input.focus();
  }

  /* ── Enviar mensaje al servidor ───────────────── */
  async function sendMessage() {
    const input = document.getElementById('chat-input');
    const text  = input.value.trim();
    if (!text || isLoading) return;

    input.value = '';
    input.style.height = 'auto';
    addMessage('user', text);
    history.push({ role: 'user', content: text });
    setSending(true);

    const typing = showTyping();

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ messages: history })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      /* ── Stream reading ── */
      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      typing.remove();
      const botEl = addMessage('bot', '');
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const raw = decoder.decode(value, { stream: true });
        const lines = raw.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') break;
          try {
            const obj = JSON.parse(payload);
            if (obj.delta) {
              full += obj.delta;
              botEl.innerHTML = renderBotText(full);
              scrollToBottom();
            }
          } catch { /* fragmento parcial, ignorar */ }
        }
      }

      if (full) history.push({ role: 'assistant', content: full });

    } catch (err) {
      typing.remove();
      addMessage('bot', '¡Ups! No pude conectarme al servidor. Asegúrate de que está corriendo con "node index.js" 😅');
      console.error('[Citrino IA]', err);
    } finally {
      setSending(false);
    }
  }

  /* ── Abrir / Cerrar panel ─────────────────────── */
  function toggleChat(open) {
    const panel   = document.getElementById('chat-panel');
    const trigger = document.getElementById('chat-trigger-btn');
    const iconDia = trigger.querySelector('.chat-icon-diamond');
    const iconX   = trigger.querySelector('.chat-icon-close');

    if (open) {
      panel.classList.add('open');
      panel.setAttribute('aria-hidden', 'false');
      trigger.setAttribute('aria-expanded', 'true');
      iconDia.style.display = 'none';
      iconX.style.display   = 'flex';
      trigger.classList.add('chat-trigger-open');
      document.getElementById('chat-input').focus();
    } else {
      panel.classList.remove('open');
      panel.setAttribute('aria-hidden', 'true');
      trigger.setAttribute('aria-expanded', 'false');
      iconDia.style.display = 'flex';
      iconX.style.display   = 'none';
      trigger.classList.remove('chat-trigger-open');
    }
  }

  /* ── Auto-resize textarea ─────────────────────── */
  function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 100) + 'px';
  }

  /* ── Init ─────────────────────────────────────── */
  function init() {
    injectWidget();

    /* Mensaje de bienvenida */
    addMessage('bot', WELCOME_MSG);

    /* Botón trigger */
    document.getElementById('chat-trigger-btn').addEventListener('click', () => {
      const isOpen = document.getElementById('chat-panel').classList.contains('open');
      toggleChat(!isOpen);
    });

    /* Botón cerrar dentro del panel */
    document.getElementById('chat-close-btn').addEventListener('click', () => toggleChat(false));

    /* Botón enviar */
    document.getElementById('chat-send-btn').addEventListener('click', sendMessage);

    /* Enter para enviar (Shift+Enter = nueva línea) */
    document.getElementById('chat-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    /* Auto-resize del textarea */
    document.getElementById('chat-input').addEventListener('input', (e) => autoResize(e.target));

    /* Cerrar con Escape */
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.getElementById('chat-panel').classList.contains('open')) {
        toggleChat(false);
      }
    });
  }

  /* Esperar a que el DOM esté listo */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
