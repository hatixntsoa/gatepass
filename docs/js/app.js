(function () {
  "use strict";

  const USERNAME = "Groupe11";
  const AUDIO_TITLE = "GatePass · ENI 2026";
  const AVATAR = "assets/eni.png";

  // Random engagement counts (same spirit as the React version)
  function formatCount(n) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    return String(n);
  }

  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  const reels = document.getElementById("reels");
  const progressEl = document.getElementById("progress");
  const slides = Array.from(reels.querySelectorAll(".slide"));
  let activeIndex = 0;

  // ----- Build progress bars -----
  slides.forEach((_, i) => {
    const bar = document.createElement("div");
    bar.className = "progress-bar" + (i === 0 ? " active" : "");
    bar.innerHTML = '<div class="fill"></div>';
    progressEl.appendChild(bar);
  });
  const progressBars = Array.from(progressEl.querySelectorAll(".progress-bar"));

  // ----- Inject overlay (actions + footer) into every slide -----
  slides.forEach((slide) => {
    const caption = slide.dataset.caption || "";
    const overlay = document.createElement("div");
    overlay.className = "overlay";
    overlay.innerHTML = `
      <div class="gradient"></div>
      <aside class="actions">
        <button type="button" class="action-btn" aria-label="Like">
          <i data-lucide="heart"></i>
          <span>${formatCount(rand(1000, 500000))}</span>
        </button>
        <button type="button" class="action-btn" aria-label="Comments">
          <i data-lucide="message-circle"></i>
          <span>${formatCount(rand(100, 15000))}</span>
        </button>
        <button type="button" class="action-btn" aria-label="Repost">
          <i data-lucide="repeat"></i>
          <span>${formatCount(rand(50, 5000))}</span>
        </button>
        <button type="button" class="action-btn" aria-label="Share">
          <i data-lucide="send"></i>
          <span>${formatCount(rand(200, 25000))}</span>
        </button>
        <button type="button" class="action-btn" aria-label="Save">
          <i data-lucide="bookmark"></i>
          <span>${formatCount(rand(300, 40000))}</span>
        </button>
        <button type="button" class="action-btn" aria-label="More">
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
          <button type="button" class="follow-btn">Follow</button>
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

  // Init Lucide icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // ----- Update progress + active index -----
  function setActive(index) {
    if (index === activeIndex) return;
    activeIndex = index;
    progressBars.forEach((bar, i) => {
      bar.classList.remove("active", "done");
      if (i < index) bar.classList.add("done");
      else if (i === index) bar.classList.add("active");
    });
  }

  // IntersectionObserver for snap slides
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

  // Keyboard navigation
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

  // Ensure first progress bar is filled on load
  setActive(0);
})();
