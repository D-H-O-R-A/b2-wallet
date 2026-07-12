/**
 * B2 Wallet - Dicionário e Sistema de Tradução Nativa (i18n) v3.0
 *
 * Tech Lead: Diego Oris (Better2Better)
 * Suporte nativo para 10 idiomas: PT, EN, ES, FR, ZH, JA, KO, DE, IT, RU
 */

window.B2Translations = window.B2Translations || {};

/**
 * Traduz estaticamente os elementos HTML com data-i18n, data-i18n-placeholder, data-i18n-title.
 * Suporta tradução em tempo real ao mudar idioma.
 *
 * @param {string} lang - Código de idioma (pt, en, es, fr, zh, ja, ko, de, it, ru).
 * @param {boolean} [skipNavigation=false] - Se deve pular o redirecionamento de tela automático.
 */
window.B2TranslateUI = function (lang, skipNavigation = false) {
  if (lang && typeof lang === 'string') {
    const baseLang = lang.split('-')[0].split('_')[0].toLowerCase();
    if (window.B2Translations[baseLang]) {
      lang = baseLang;
    }
  }
  const t = window.B2Translations[lang] || window.B2Translations['en'];
  const englishT = window.B2Translations['en'] || {};
  const portugueseT = window.B2Translations['pt'] || {};

  const getTranslation = (key) => {
    if (t[key] !== undefined) return t[key];
    if (englishT[key] !== undefined) return englishT[key];
    return portugueseT[key];
  };

  // Textos internos
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = getTranslation(key);
    if (val !== undefined) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.setAttribute('placeholder', val);
      } else {
        if (key === 'createdBy') {
          const text = val;
          if (text.includes('better2better.com.br')) {
            el.innerHTML = text.replace(
              'better2better.com.br',
              '<a href="https://better2better.com.br" target="_blank" class="b2b-highlight-link">better2better.com.br</a>'
            );
          } else if (text.includes('better2better')) {
            el.innerHTML = text.replace(
              'better2better',
              '<a href="https://better2better.com.br" target="_blank" class="b2b-highlight-link">better2better.com.br</a>'
            );
          } else {
            el.innerHTML = `<a href="https://better2better.com.br" target="_blank" class="b2b-highlight-link">${text}</a>`;
          }
        } else {
          el.textContent = val;
        }
      }
    }
  });

  // Placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const val = getTranslation(key);
    if (val !== undefined) el.setAttribute('placeholder', val);
  });

  // Titles (tooltips)
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    const val = getTranslation(key);
    if (val !== undefined) el.setAttribute('title', val);
  });


  // Salva preferência e aplica lang no html
  localStorage.setItem('b2_language', lang);
  document.documentElement.setAttribute('lang', lang);
  // Re-renderiza a view atual para aplicar traduções em conteúdo renderizado dinamicamente
  try {
    if (window.B2App) {
      window.B2App.currentLanguage = lang;
      if (window.B2App.decryptedSeed) {
        window.B2App.setActiveChain(window.B2App.activeChainKey);
      }
    }
    if (!skipNavigation && window.B2UIRenderer && typeof window.B2UIRenderer.navigateTo === 'function') {
      const viewId = window.B2UIRenderer.currentViewId || (window.B2App && window.B2App.activeChainKey ? 'view-dashboard' : 'view-welcome');
      // pequeno atraso para garantir que o DOM reflita a mudança de atributos
      setTimeout(() => { window.B2UIRenderer.navigateTo(viewId); }, 50);
    }
  } catch (e) {
    // não bloquear em caso de erro
    console.warn('B2TranslateUI: falha ao re-renderizar view:', e && e.message);
  }
};

// Expõe lista de idiomas disponíveis para o seletor
window.B2AvailableLanguages = [
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
];
