(function () {
  "use strict";
  function create({ state, saveState, rand, slideCount }) {
    const users = ["hatixntsoa", "caline", "nandrianina"];
    function generateRandomComments(count) {
      const list = [];
      const used = new Set();
      const pool = window.GPI18n.content.commentTexts[window.GPI18n.language];
      for (let i = 0; i < count; i++) {
        let user;
        do { user = ["rakioto", "mialy_dev", "hery_code", "soa_tech", "faly_iot", "nena_maker", "toky_esp", "vola_embed", "lanto_hw", "aina_soft", "fitia_lab", "roja_proto", "sitraka_mcu", "hafaliana", "tsiky_bot", "malala_io", "kanto_chip", "nirina_bit"][rand(0, 17)]; }
        while (used.has(user) && used.size < 18);
        used.add(user);
        list.push({
          id: "r" + i + "_" + Date.now() + rand(0, 9999), user,
          text: pool[rand(0, pool.length - 1)], likes: rand(0, 120), liked: false,
          replies: [], isAuthor: false
        });
      }
      return list;
    }
    function ensureComments(slideIdx) {
      if (state.comments[slideIdx] && state.comments[slideIdx].length) return state.comments[slideIdx];
      const finalSlide = slideIdx === slideCount() - 1;
      const locale = window.GPI18n.language || "en";
      const pool = finalSlide
        ? window.GPI18n.content.commentTexts.thanks[locale]
        : window.GPI18n.content.commentTexts[locale];
      const shuffled = users.map(user => ({ user, text: pool[rand(0, pool.length - 1)], likes: rand(80, 4200) }));
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = rand(0, i);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      const authors = shuffled.map((comment, index) => ({
        id: "a" + slideIdx + "_" + index, user: comment.user, text: comment.text,
        likes: comment.likes, liked: false, replies: [], isAuthor: true
      }));
      const all = [...authors, ...generateRandomComments(rand(8, 15))];
      state.comments[slideIdx] = all;
      saveState(state);
      return all;
    }
    return ensureComments;
  }
  window.GPComments = { create };
})();
