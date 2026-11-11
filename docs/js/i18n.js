(function () {
  "use strict";
  let content = null;
  let language = "en";
  const LANGUAGE_KEY = "gatepass-language";
  const LANGUAGE_TTL = 4 * 60 * 60 * 1000;

  async function init() {
    try {
      const response = await fetch("js/content.json");
      if (!response.ok) throw new Error("HTTP " + response.status);
      content = await response.json();
    } catch (error) {
      console.error("Could not load js/content.json", error);
      content = { slides: [], translations: {}, locale: { en: {}, fr: {} }, commentTexts: { en: [], fr: [], thanks: { en: [], fr: [] } } };
    }
    try {
      const stored = JSON.parse(localStorage.getItem(LANGUAGE_KEY) || "null");
      if (stored && Date.now() - stored.savedAt < LANGUAGE_TTL) language = stored.value === "fr" ? "fr" : "en";
      else localStorage.removeItem(LANGUAGE_KEY);
    } catch (_) { localStorage.removeItem(LANGUAGE_KEY); }
    apply();
    return content;
  }

  function apply() {
    if (!content) return;
    const sections = Array.from(document.querySelectorAll("section.slide"));
    sections.forEach((section, index) => {
      const slide = content.slides[index];
      const target = section.querySelector(".slide-content");
      if (!slide || !target) return;
      target.innerHTML = slide[language] || slide.en || slide.fr;
      const translatedCaption = content.translations[slide.caption] || slide.caption;
      section.dataset.caption = language === "en" ? translatedCaption : slide.caption;
    });
    document.documentElement.lang = language;
    document.dispatchEvent(new CustomEvent("gatepass:language", { detail: { language, locale: content.locale[language] || content.locale.en } }));
  }

  function setLanguage(value) {
    language = value === "fr" ? "fr" : "en";
    try { localStorage.setItem(LANGUAGE_KEY, JSON.stringify({ value: language, savedAt: Date.now() })); } catch (_) {}
    location.reload();
  }

  window.GPI18n = {
    init, apply, setLanguage,
    get language() { return language; },
    get content() { return content; },
    get locale() { return content?.locale?.[language] || {}; }
  };
})();
