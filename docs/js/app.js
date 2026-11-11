(async function () {
  "use strict";
  await window.GPI18n.init();

  const USERNAME = "Groupe11";
  const AUDIO_TITLE = "GatePass · ENI 2026";
  const AVATAR = "assets/eni.png";
  const SHARE_URL = "https://gatepass.hatixntsoa.me";
  const GITHUB_URL = "https://github.com/hatixntsoa/gatepass";

  // ---------- Helpers ----------
  function formatCount(n) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    return String(n);
  }

  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function loadState() { return window.GPStorage.load(); }
  function saveState(value) { window.GPStorage.save(value); }

  let state = loadState();
  // shape: { likes: { [slideIdx]: true }, bookmarks: { [slideIdx]: true },
  //          baseCounts: { [slideIdx]: { likes, comments, shares, saves } },
  //          comments: { [slideIdx]: Comment[] } }

  if (!state.likes) state.likes = {};
  if (!state.bookmarks) state.bookmarks = {};
  if (!state.baseCounts) state.baseCounts = {};
  if (!state.comments) state.comments = {};
  if (typeof state.following !== "boolean") state.following = false;

  function ensureBaseCounts(slideIdx) {
    if (!state.baseCounts[slideIdx]) {
      state.baseCounts[slideIdx] = {
        likes: rand(800, 420000),
        comments: rand(40, 18000),
        shares: rand(20, 12000),
        saves: rand(50, 35000),
      };
      saveState(state);
    }
    return state.baseCounts[slideIdx];
  }

  // ---------- DOM refs ----------
  const reels = document.getElementById("reels");
  const progressEl = document.getElementById("progress");
  const slides = Array.from(reels.querySelectorAll(".slide"));
  const ensureComments = window.GPComments.create({ state, saveState, rand, slideCount: () => slides.length });
  let activeIndex = 0;

  // Keep persisted top-author comments in the currently selected language.
  if (state.commentsLanguage !== window.GPI18n.language) {
    Object.keys(state.comments).forEach(key => {
      const slideIndex = Number(key);
      const authors = (state.comments[key] || []).filter(comment => comment.isAuthor);
      const finalSlide = slideIndex === slides.length - 1;
      const pool = finalSlide
        ? window.GPI18n.content.commentTexts.thanks[window.GPI18n.language]
        : window.GPI18n.content.commentTexts[window.GPI18n.language];
      authors.forEach(comment => { comment.text = pool[rand(0, pool.length - 1)]; });
    });
    state.commentsLanguage = window.GPI18n.language;
    if (Object.keys(state.comments).length) saveState(state);
  }

  // ---------- Progress bars ----------
  slides.forEach((_, i) => {
    const bar = document.createElement("div");
    bar.className = "progress-bar" + (i === 0 ? " active" : "");
    bar.innerHTML = '<div class="fill"></div>';
    progressEl.appendChild(bar);
  });
  const progressBars = Array.from(progressEl.querySelectorAll(".progress-bar"));

  // ---------- Inject overlays ----------
  slides.forEach((slide, idx) => {
    const caption = slide.dataset.caption || "";
    const counts = ensureBaseCounts(idx);
    const liked = !!state.likes[idx];
    const bookmarked = !!state.bookmarks[idx];

    const likeCount = counts.likes + (liked ? 1 : 0);
    const saveCount = counts.saves + (bookmarked ? 1 : 0);

    const overlay = document.createElement("div");
    overlay.className = "overlay";
    overlay.innerHTML = `
      <div class="gradient"></div>
      <aside class="actions" data-slide="${idx}">
        <button type="button" class="action-btn like-btn${liked ? " liked" : ""}" data-action="like" aria-label="Like">
          <i data-lucide="heart"></i>
          <span class="count">${formatCount(likeCount)}</span>
        </button>
        <button type="button" class="action-btn" data-action="comments" aria-label="Comments">
          <i data-lucide="message-circle"></i>
          <span class="count">${formatCount(counts.comments)}</span>
        </button>
        <button type="button" class="action-btn" data-action="share" aria-label="Share">
          <i data-lucide="send"></i>
          <span class="count">${formatCount(counts.shares)}</span>
        </button>
        <button type="button" class="action-btn bookmark-btn${bookmarked ? " bookmarked" : ""}" data-action="bookmark" aria-label="Save">
          <i data-lucide="bookmark"></i>
          <span class="count">${formatCount(saveCount)}</span>
        </button>
        <button type="button" class="action-btn" data-action="more" aria-label="More">
          <i data-lucide="more-vertical"></i>
        </button>
      </aside>
      <footer class="footer">
        <div class="user-row">
          <div class="avatar">
            <img src="${AVATAR}" alt="${USERNAME}" />
          </div>
          <span class="username">${USERNAME}</span>
          <span class="verified" title="Verified">
            <i data-lucide="badge-check"></i>
          </span>
          <button type="button" class="follow-btn${state.following ? " is-following" : ""}">${state.following ? (window.GPI18n.locale.following || "Following") : (window.GPI18n.locale.follow || "Follow")}</button>
        </div>
        <p class="caption">${caption}</p>
        <div class="audio-row">
          <i data-lucide="music"></i>
          <span>${AUDIO_TITLE}</span>
        </div>
      </footer>
    `;
    slide.appendChild(overlay);
  });

  // Init Lucide
  if (window.lucide) lucide.createIcons();

  // ---------- Active slide tracking ----------
  function setActive(index) {
    if (index === activeIndex) return;
    activeIndex = index;
    progressBars.forEach((bar, i) => {
      bar.classList.remove("active", "done");
      if (i < index) bar.classList.add("done");
      else if (i === index) bar.classList.add("active");
    });
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = slides.indexOf(entry.target);
          if (idx !== -1) setActive(idx);
        }
      });
    },
    { root: reels, threshold: 0.6 }
  );
  slides.forEach((s) => observer.observe(s));

  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.min(activeIndex + 1, slides.length - 1);
      slides[next].scrollIntoView({ behavior: "smooth" });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = Math.max(activeIndex - 1, 0);
      slides[prev].scrollIntoView({ behavior: "smooth" });
    }
  });
  setActive(0);

  // ---------- Viewport height helper ----------
  function isMobile() {
    return (
      /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
      (window.matchMedia && window.matchMedia("(max-width: 600px)").matches) ||
      (window.innerHeight > window.innerWidth && window.innerWidth < 900)
    );
  }

  function requestFullscreen() {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  }

  function setViewportHeight() {
    const h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    document.documentElement.style.setProperty("--app-height", `${h}px`);
  }
  setViewportHeight();
  window.addEventListener("resize", setViewportHeight);
  window.addEventListener("orientationchange", () => setTimeout(setViewportHeight, 100));
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", setViewportHeight);
    window.visualViewport.addEventListener("scroll", setViewportHeight);
  }

  if (isMobile()) {
    const enterFs = () => {
      requestFullscreen();
      document.removeEventListener("touchstart", enterFs);
      document.removeEventListener("click", enterFs);
    };
    document.addEventListener("touchstart", enterFs, { once: true, passive: true });
    document.addEventListener("click", enterFs, { once: true });
  }

  // ---------- Floating heart particle ----------
  function spawnHeart(x, y) {
    const el = document.createElement("div");
    el.className = "heart-float";
    el.textContent = "♥";
    el.style.left = x + "px";
    el.style.top = y + "px";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 850);
  }

  // ---------- Like ----------
  function toggleLike(btn, slideIdx) {
    const currentlyLiked = !!state.likes[slideIdx];
    const counts = ensureBaseCounts(slideIdx);
    const countEl = btn.querySelector(".count");

    if (currentlyLiked) {
      delete state.likes[slideIdx];
      btn.classList.remove("liked");
      countEl.textContent = formatCount(counts.likes);
    } else {
      state.likes[slideIdx] = true;
      btn.classList.add("liked");
      countEl.textContent = formatCount(counts.likes + 1);
      const rect = btn.getBoundingClientRect();
      spawnHeart(rect.left + rect.width / 2 - 10, rect.top);
    }
    saveState(state);
  }

  // ---------- Bookmark ----------
  function toggleBookmark(btn, slideIdx) {
    const currently = !!state.bookmarks[slideIdx];
    const counts = ensureBaseCounts(slideIdx);
    const countEl = btn.querySelector(".count");

    if (currently) {
      delete state.bookmarks[slideIdx];
      btn.classList.remove("bookmarked");
      countEl.textContent = formatCount(counts.saves);
    } else {
      state.bookmarks[slideIdx] = true;
      btn.classList.add("bookmarked");
      countEl.textContent = formatCount(counts.saves + 1);
    }
    saveState(state);
  }

  // ---------- Toast helper ----------
  function showToast(message, duration) {
    duration = duration || 2200;
    let toast = document.querySelector(".gp-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "gp-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, duration);
  }

  // ---------- Share ----------
  async function copyLinkFallback() {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(SHARE_URL);
        return true;
      }
    } catch (_) {}
    // Last-resort fallback for older / non-secure contexts
    try {
      const ta = document.createElement("textarea");
      ta.value = SHARE_URL;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0;";
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, SHARE_URL.length);
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch (_) {
      return false;
    }
  }

  async function doShare(btn, slideIdx) {
    if (slides[slideIdx].classList.contains("github-slide")) { location.href = GITHUB_URL; return; }
    const caption = slides[slideIdx].dataset.caption || "GatePass";
    const shareData = {
      title: "GatePass – ENI 2026",
      text: `${caption} · Projet Microcontrôleurs Groupe11`,
      url: SHARE_URL,
    };

    // Web Share API only works in a secure context (HTTPS or localhost)
    const canNativeShare =
      typeof navigator.share === "function" &&
      (window.isSecureContext || location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1");

    let shared = false;

    if (canNativeShare) {
      try {
        await navigator.share(shareData);
        shared = true;
      } catch (err) {
        // AbortError = user cancelled the sheet → do nothing
        if (err && err.name === "AbortError") return;
        // Any other error → fall through to clipboard
      }
    }

    if (!shared) {
      const copied = await copyLinkFallback();
      btn.classList.add("shared");
      setTimeout(() => btn.classList.remove("shared"), 400);
      if (copied) {
        showToast((window.GPI18n.locale.linkCopied || (window.GPI18n.language === "fr" ? "Lien Copié" : "Link Copied")) + " ✓");
      } else {
        showToast((window.GPI18n.locale.copyLink || (window.GPI18n.language === "fr" ? "Copiez ce lien : " : "Copy this link: ")) + SHARE_URL, 4000);
      }
    }

    // Count a successful share / copy
    const counts = ensureBaseCounts(slideIdx);
    counts.shares += 1;
    const countEl = btn.querySelector(".count");
    if (countEl) countEl.textContent = formatCount(counts.shares);
    saveState(state);
  }

  // ---------- More modal ----------
  const moreModal = document.createElement("div");
  moreModal.className = "more-modal";
  moreModal.innerHTML = `
    <div class="more-backdrop"></div>
    <div class="more-card">
      <h3>Groupe 11</h3>
      <p>M1 OCC ENI 2026</p>
      <button type="button" class="language-toggle">${window.GPI18n.language === "en" ? "Français" : "English"}</button>
      <button type="button" class="more-close-btn">${window.GPI18n.locale.close || "Close"}</button>
    </div>
  `;
  document.body.appendChild(moreModal);

  function openMore() {
    moreModal.classList.add("open");
    document.body.classList.add("sheet-open");
  }
  function closeMore() {
    moreModal.classList.remove("open");
    document.body.classList.remove("sheet-open");
  }
  moreModal.querySelector(".more-backdrop").addEventListener("click", closeMore);
  moreModal.querySelector(".more-close-btn").addEventListener("click", closeMore);
  moreModal.querySelector(".language-toggle").addEventListener("click", () => window.GPI18n.setLanguage(window.GPI18n.language === "en" ? "fr" : "en"));

  // ---------- Comments sheet ----------
  const commentsSheet = document.createElement("div");
  commentsSheet.className = "comments-sheet";
  commentsSheet.innerHTML = `
    <div class="comments-backdrop"></div>
    <div class="comments-panel">
      <div class="comments-header">
        <h3><span class="comments-count">0</span> ${window.GPI18n.locale.comments || "comments"}</h3>
        <button type="button" class="comments-close" aria-label="${window.GPI18n.locale.close || "Close"}">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="comments-list"></div>
      <div class="comments-composer">
        <input type="text" placeholder="${window.GPI18n.locale.addComment || "Add a comment…"}" maxlength="200" />
        <button type="button">${window.GPI18n.locale.send || "Send"}</button>
      </div>
    </div>
  `;
  document.body.appendChild(commentsSheet);
  if (window.lucide) lucide.createIcons({ nodes: [commentsSheet] });

  let currentCommentsSlide = 0;

  function renderComments(slideIdx) {
    const list = ensureComments(slideIdx);
    const listEl = commentsSheet.querySelector(".comments-list");
    const countEl = commentsSheet.querySelector(".comments-count");
    countEl.textContent = list.length;

    listEl.innerHTML = list
      .map((c) => {
        const initial = c.user.charAt(0).toUpperCase();
        const verified = c.isAuthor
          ? `<span class="verified-sm"><i data-lucide="badge-check"></i></span>`
          : "";
        const repliesHtml =
          c.replies && c.replies.length
            ? `<div class="comment-replies">${c.replies
                .map(
                  (r) => `
              <div class="comment" style="padding:6px 0">
                <div class="comment-avatar" style="width:28px;height:28px;font-size:11px">${r.user.charAt(0).toUpperCase()}</div>
                <div class="comment-body">
                  <div class="comment-user">${r.user}</div>
                  <div class="comment-text">${escapeHtml(r.text)}</div>
                </div>
              </div>`
                )
                .join("")}</div>`
            : "";

        return `
        <div class="comment" data-id="${c.id}">
          <div class="comment-avatar">${initial}</div>
          <div class="comment-body">
            <div class="comment-user">@${c.user}${verified}</div>
            <div class="comment-text">${escapeHtml(c.text)}</div>
            <div class="comment-meta">
              <button type="button" class="c-like${c.liked ? " liked" : ""}" data-cid="${c.id}">
                ${window.GPI18n.locale.like || "Like"}<span class="comment-like-count">${c.likes > 0 ? " " + formatCount(c.likes) : ""}</span>
              </button>
              <button type="button" class="c-reply" data-cid="${c.id}">${window.GPI18n.locale.reply || "Reply"}</button>
            </div>
            <div class="comment-reply-form" data-cid="${c.id}">
              <input type="text" placeholder="${window.GPI18n.locale.yourReply || "Your reply…"}" maxlength="150" />
              <button type="button" class="c-reply-send">OK</button>
            </div>
            ${repliesHtml}
          </div>
        </div>`;
      })
      .join("");

    if (window.lucide) lucide.createIcons({ nodes: [listEl] });

    // bind like / reply on the fresh DOM
    listEl.querySelectorAll(".c-like").forEach((btn) => {
      btn.addEventListener("click", () => {
        const cid = btn.dataset.cid;
        const comment = list.find((x) => x.id === cid);
        if (!comment) return;
        if (comment.liked) {
          comment.liked = false;
          comment.likes = Math.max(0, comment.likes - 1);
          btn.classList.remove("liked");
        } else {
          comment.liked = true;
          comment.likes += 1;
          btn.classList.add("liked");
        }
        btn.querySelector(".comment-like-count").textContent =
          comment.likes > 0 ? " " + formatCount(comment.likes) : "";
        saveState(state);
      });
    });

    listEl.querySelectorAll(".c-reply").forEach((btn) => {
      btn.addEventListener("click", () => {
        const cid = btn.dataset.cid;
        const form = listEl.querySelector(`.comment-reply-form[data-cid="${cid}"]`);
        if (form) {
          form.classList.toggle("open");
          if (form.classList.contains("open")) {
            form.querySelector("input").focus();
          }
        }
      });
    });

    listEl.querySelectorAll(".c-reply-send").forEach((btn) => {
      btn.addEventListener("click", () => {
        const form = btn.closest(".comment-reply-form");
        const cid = form.dataset.cid;
        const input = form.querySelector("input");
        const text = input.value.trim();
        if (!text) return;
        const comment = list.find((x) => x.id === cid);
        if (!comment) return;
        if (!comment.replies) comment.replies = [];
        comment.replies.push({ user: window.GPI18n.locale.me || "you", text });
        input.value = "";
        form.classList.remove("open");
        saveState(state);
        renderComments(slideIdx); // re-render to show the reply
      });
    });
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function openComments(slideIdx) {
    currentCommentsSlide = slideIdx;
    renderComments(slideIdx);
    commentsSheet.classList.add("open");
    document.body.classList.add("sheet-open");
  }

  function closeComments() {
    commentsSheet.classList.remove("open");
    document.body.classList.remove("sheet-open");
  }

  commentsSheet.querySelector(".comments-backdrop").addEventListener("click", closeComments);
  commentsSheet.querySelector(".comments-close").addEventListener("click", closeComments);

  // Composer – add new comment
  const composerInput = commentsSheet.querySelector(".comments-composer input");
  const composerBtn = commentsSheet.querySelector(".comments-composer button");
  function submitComment() {
    const text = composerInput.value.trim();
    if (!text) return;
    const list = ensureComments(currentCommentsSlide);
    list.push({
      id: "u_" + Date.now(),
      user: window.GPI18n.locale.me || "you",
      text,
      likes: 0,
      liked: false,
      replies: [],
      isAuthor: false,
    });
    // bump the visible count on the action button
    const counts = ensureBaseCounts(currentCommentsSlide);
    counts.comments += 1;
    const actionCount = document.querySelector(
      `.actions[data-slide="${currentCommentsSlide}"] [data-action="comments"] .count`
    );
    if (actionCount) actionCount.textContent = formatCount(counts.comments);
    saveState(state);
    composerInput.value = "";
    renderComments(currentCommentsSlide);
  }
  composerBtn.addEventListener("click", submitComment);
  composerInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitComment();
  });

  // ---------- Action button clicks (event delegation) ----------
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".action-btn");
    if (!btn) return;
    const actions = btn.closest(".actions");
    if (!actions) return;
    const slideIdx = parseInt(actions.dataset.slide, 10);
    const action = btn.dataset.action;

    if (action === "like") toggleLike(btn, slideIdx);
    else if (action === "comments") openComments(slideIdx);
    else if (action === "share") doShare(btn, slideIdx);
    else if (action === "bookmark") toggleBookmark(btn, slideIdx);
    else if (action === "more") openMore();
  });

  // One persistent follow state shared by every slide.
  function renderFollowState() {
    document.querySelectorAll(".follow-btn").forEach(button => {
      button.textContent = state.following ? (window.GPI18n.locale.following || "Following") : (window.GPI18n.locale.follow || "Follow");
      button.classList.toggle("is-following", state.following);
    });
  }
  document.addEventListener("click", (e) => {
    const fb = e.target.closest(".follow-btn");
    if (!fb) return;
    state.following = !state.following;
    saveState(state);
    renderFollowState();
  });
  document.addEventListener("gatepass:language", renderFollowState);
  renderFollowState();
})();
