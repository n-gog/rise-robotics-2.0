let SITE = null;

async function loadContent() {
  if (SITE) return SITE;
  const candidates = ["content.json", "./content.json", "/content.json", "../content.json"];
  let lastErr = null;

  for (const path of candidates) {
    try {
      const res = await fetch(path, { cache: "no-store" });
      if (res.ok) {
        SITE = await res.json();
        return SITE;
      }
      lastErr = new Error(`Fetch failed: ${path} -> ${res.status} ${res.statusText}`);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("Failed to load content.json");
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (s) => {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[s];
  });
}

function iconSvg(name) {
  const common =
    'class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"';
  if (name === "instagram")
    return `<svg ${common}><path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Z" stroke="currentColor" stroke-width="1.8"/><path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" stroke-width="1.8"/><path d="M17.6 6.4h.01" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`;
  if (name === "linkedin")
    return `<svg ${common}><path d="M4 9.2V20h3.4V9.2H4Z" stroke="currentColor" stroke-width="1.8"/><path d="M5.7 6.4a1.9 1.9 0 1 0 0-3.8 1.9 1.9 0 0 0 0 3.8Z" stroke="currentColor" stroke-width="1.8"/><path d="M10.1 9.2V20h3.4v-6.1c0-1.6.3-3.2 2.3-3.2s2 1.9 2 3.3V20H21v-6.7c0-3.3-.7-5.9-4.6-5.9-1.9 0-3.2 1-3.7 2h-.1V9.2h-2.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`;
  if (name === "youtube")
    return `<svg ${common}><path d="M21.6 8.2a3 3 0 0 0-2.1-2.1C17.7 5.6 12 5.6 12 5.6s-5.7 0-7.5.5A3 3 0 0 0 2.4 8.2 31.6 31.6 0 0 0 2.4 12a31.6 31.6 0 0 0 .0 3.8 3 3 0 0 0 2.1 2.1c1.8.5 7.5.5 7.5.5s5.7 0 7.5-.5a3 3 0 0 0 2.1-2.1A31.6 31.6 0 0 0 21.6 12a31.6 31.6 0 0 0 0-3.8Z" stroke="currentColor" stroke-width="1.8"/><path d="M10.5 9.7 15.6 12l-5.1 2.3V9.7Z" fill="currentColor"/></svg>`;
  return `<svg ${common}><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" stroke="currentColor" stroke-width="1.8"/></svg>`;
}


function setActiveNav() {
  const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll(".nav a, .footer-links a").forEach((a) => {
    const href = (a.getAttribute("href") || "").toLowerCase();
    if (href === path) a.classList.add("active");
  });
}

function wrapImgWithLink(img, href) {
  if (!img || !href) return;

  // If already inside a link, just update it.
  const existing = img.closest("a");
  if (existing) {
    existing.href = href;
    existing.target = "_blank";
    existing.rel = "noopener";
    return;
  }

  const a = document.createElement("a");
  a.href = href;
  a.target = "_blank";
  a.rel = "noopener";
  a.style.display = "inline-flex";
  a.style.alignItems = "center";

  const parent = img.parentNode;
  if (!parent) return;
  parent.insertBefore(a, img);
  a.appendChild(img);
}

function linkPartnerLogos(site) {
  // Only link these logos on the About page image stack.
  const page = document.body.getAttribute("data-page");
  if (page !== "about") return;

  const aboutMount = document.getElementById("page-about");
  if (!aboutMount) return;

  // Defaults in case content.json does not include explicit partner URLs.
  const graceHref =
    site?.partners?.grace?.href ||
    site?.partnerLinks?.grace ||
    "https://graceinitiative.org/";

  const teeemHref =
    site?.partners?.teeem?.href ||
    site?.partnerLinks?.teeem ||
    "https://www.teeem.org/";

  // Scope to the About page right-side images only.
  const imgs = Array.from(aboutMount.querySelectorAll(".img-card img"));
  imgs.forEach((img) => {
    const src = String(img.getAttribute("src") || "").toLowerCase();
    const alt = String(img.getAttribute("alt") || "").toLowerCase();

    // GRACE
    if (src.includes("grace") || alt.includes("grace")) {
      wrapImgWithLink(img, graceHref);
      return;
    }

    // TEEEM (catch common spellings)
    if (
      src.includes("teeem") ||
      alt.includes("teeem") ||
      src.includes("teem") ||
      alt.includes("teem")
    ) {
      wrapImgWithLink(img, teeemHref);
    }
  });
}

function buildHeaderFooter(site) {
  const headerMount = document.getElementById("site-header");
  const footerMount = document.getElementById("site-footer");
  if (!headerMount || !footerMount) return;

  const brand = site.brand || {};
  const nav = site.nav || [];

  const navHtml = nav
    .map((item) => {
      const cls =
        item.variant === "gold"
          ? "gold"
          : item.variant === "gold-outline"
          ? "gold-outline"
          : "";
      return `<a href="${escapeHtml(item.href)}" class="${cls}">${escapeHtml(item.label)}</a>`;
    })
    .join("");

  headerMount.innerHTML = `
    <a class="skip-link" href="#main">Skip to content</a>
    <header class="site-header" id="top">
      <div class="container header-inner" style="padding-left:32px; padding-right:32px;">
        <a class="brand" href="index.html" aria-label="${escapeHtml(brand.name)} home">
          <img src="${escapeHtml(brand.logoPath)}" alt="${escapeHtml(brand.name)} logo"
               onerror="this.style.display='none';" />
          <div class="title">${escapeHtml(brand.name)}</div>
        </a>

        <button class="btn mobile-toggle" id="mobileToggle" aria-label="Open menu" aria-expanded="false">
          Menu ☰
        </button>

        <nav class="nav" aria-label="Primary">
          ${navHtml}
        </nav>
      </div>
    </header>
  `;

  footerMount.innerHTML = `
    <footer class="site-footer">
      <div class="container footer-inner">
        <div>
          <div class="footer-brand">
            <img src="${escapeHtml(brand.logoPath)}" alt="${escapeHtml(brand.name)} logo"
                 onerror="this.style.display='none';" />
            <div>
              <div class="name">${escapeHtml(brand.name)}</div>
              <div class="desc">${escapeHtml(brand.shortDescription || brand.slogan || "")}</div>
              <div class="footer-links" aria-label="Footer links">
                ${(site.nav || [])
                  .map((item) => `<a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`)
                  .join("")}
              </div>
              <div class="copy">© 2025 ${escapeHtml(brand.name)}</div>
            </div>
          </div>
        </div>

        <div class="follow">
          <h3>Follow us</h3>
          <div class="socials">
            ${(site.social || [])
              .map(
                (s) => `
              <a class="social" href="${escapeHtml(s.href)}" target="_blank" rel="noopener">
                <span class="left">
                  ${iconSvg(s.icon)}
                  <span><strong>${escapeHtml(s.label)}</strong>
                    <span style="color:var(--muted); font-weight:650"> ${escapeHtml(
                      s.handle || ""
                    )}</span>
                  </span>
                </span>
                <span aria-hidden="true">↗</span>
              </a>
            `
              )
              .join("")}
          </div>
        </div>
      </div>
    </footer>
  `;

  const headerEl = headerMount.querySelector("header.site-header");
  const toggle = headerMount.querySelector("#mobileToggle");

  // Fix: ensure the menu button never shows on desktop widths (prevents "remnant" display).
  const mq = window.matchMedia("(max-width: 980px)");
  const syncMobileToggle = () => {
    if (!toggle || !headerEl) return;
    const isMobile = mq.matches;

    // Hard-control visibility via inline style so it can't be overridden by generic .btn rules.
    toggle.style.display = isMobile ? "inline-flex" : "none";

    // If we leave mobile, close any open menu.
    if (!isMobile) {
      headerEl.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  };

  // Run once now and whenever viewport changes.
  syncMobileToggle();
  if (typeof mq.addEventListener === "function") {
    mq.addEventListener("change", syncMobileToggle);
  } else {
    // Safari fallback
    mq.addListener(syncMobileToggle);
  }

  if (toggle && headerEl) {
    toggle.addEventListener("click", () => {
      const open = headerEl.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  setActiveNav();
}

function formatNumber(n) {
  try {
    return new Intl.NumberFormat(undefined).format(n);
  } catch {
    return String(n);
  }
}

function animateCount(el, to, { prefix = "", suffix = "", duration = 1200 } = {}) {
  const start = performance.now();
  const from = 0;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion) {
    el.textContent = `${prefix}${formatNumber(to)}${suffix}`;
    return;
  }

  function tick(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    const val = Math.round(from + (to - from) * eased);
    el.textContent = `${prefix}${formatNumber(val)}${suffix}`;
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* Subtle animated dot-grid (reactbits-like vibe) */
function initDotGrid(canvas) {
  if (!canvas) return () => {};
  const ctx = canvas.getContext("2d");
  let raf = 0;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const state = {
    w: 0,
    h: 0,
    dots: [],
    t: 0,
  };

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    state.w = Math.floor(rect.width);
    state.h = Math.floor(rect.height);
    canvas.width = Math.floor(state.w * dpr);
    canvas.height = Math.floor(state.h * dpr);
    canvas.style.width = `${state.w}px`;
    canvas.style.height = `${state.h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const spacing = 22;
    const dots = [];
    for (let y = 0; y <= state.h + spacing; y += spacing) {
      for (let x = 0; x <= state.w + spacing; x += spacing) {
        dots.push({ x, y, phase: Math.random() * Math.PI * 2 });
      }
    }
    state.dots = dots;
  }

  function draw() {
    ctx.clearRect(0, 0, state.w, state.h);

    const g = ctx.createRadialGradient(
      state.w * 0.3,
      state.h * 0.2,
      10,
      state.w * 0.5,
      state.h * 0.4,
      Math.max(state.w, state.h)
    );
    g.addColorStop(0, "rgba(190,148,84,.18)");
    g.addColorStop(1, "rgba(190,148,84,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, state.w, state.h);

    ctx.fillStyle = "rgba(0,0,0,.12)";
    const amp = 0.8;
    for (const d of state.dots) {
      const wobble = reduceMotion ? 0 : Math.sin(state.t * 0.02 + d.phase) * amp;
      const r = 1.0 + wobble * 0.4;
      ctx.beginPath();
      ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function loop() {
    state.t += 1;
    draw();
    raf = requestAnimationFrame(loop);
  }

  resize();
  loop();
  window.addEventListener("resize", resize);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
  };
}

function initHome(site) {
  const mount = document.getElementById("page-home");
  if (!mount) return;

  const h = site.home || {};
  const right = h.heroRightCard || {};

  mount.innerHTML = `
    <section class="hero" aria-label="Hero">
      <div class="hero-inner">
        <div class="hero-grid">
          <div>
            <div class="badge">${escapeHtml(h.heroKicker || "")}</div>
            <h1>${escapeHtml(h.heroTitle || "")}</h1>
            <p>${escapeHtml(h.heroIntro || "")}</p>

            <div class="hero-actions">
              ${(h.heroCtas || [])
                .map(
                  (c) =>
                    `<a class="btn ${escapeHtml(c.variant || "")}" href="${escapeHtml(
                      c.href
                    )}">${escapeHtml(c.label)}</a>`
                )
                .join("")}
            </div>

            <div class="topic-chips">
              ${(h.pillTopics || [])
                .map((t) => `<span class="topic-chip">${escapeHtml(t)}</span>`)
                .join("")}
            </div>

            <div class="stats" id="stats">
              ${(h.stats || [])
                .map(
                  (s) => `
                <div class="stat">
                  <div class="num" data-count="${Number(s.value) || 0}"
                       data-prefix="${escapeHtml(s.prefix || "")}"
                       data-suffix="${escapeHtml(s.suffix || "")}">0</div>
                  <div class="lbl">${escapeHtml(s.label)}</div>
                </div>
              `
                )
                .join("")}
            </div>
          </div>

          <div class="hero-media" aria-label="Event photo carousel">
            <canvas id="dotGrid" style="position:absolute; inset:0; width:100%; height:100%; opacity:.35; pointer-events:none"></canvas>
            <img id="carouselImg" class="carousel-img" alt="" />
            <div class="hero-overlay" id="heroOverlay" style="width:fit-content; max-width:85%;">
              <h3 id="heroOverlayCaption" style="margin:0;">${escapeHtml(right.title || "")}</h3>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section" aria-label="Featured in">
      <h2>Featured in</h2>
      <div class="grid-3">
        ${(h.featuredIn || [])
          .slice(0, 3)
          .map(
            (a) => `
          <a class="feature-card" href="${escapeHtml(a.href || "#")}" target="_blank" rel="noopener">
            <div class="top">
              <div class="publisher">${escapeHtml(a.publisher || "")}</div>
              <div aria-hidden="true">↗</div>
            </div>
            <div class="title">${escapeHtml(a.title)}</div>
            <div class="note">${escapeHtml(a.note || "")}</div>
          </a>
        `
          )
          .join("")}
      </div>
    </section>

    <section class="section">
      <div class="panel">
        <h2 style="margin:0 0 10px">${escapeHtml(h.missionTitle || "Our mission")}</h2>
        <p style="margin:0; color:var(--muted); line-height:1.8">${escapeHtml(h.missionText || "")}</p>
      </div>
    </section>

    <section class="section">
      <div class="split">
        <div class="panel">
          <h3 style="margin:0 0 10px">${escapeHtml(h.aboutBlurbTitle || "About")}</h3>
          <p style="margin:0; color:var(--muted); line-height:1.8">${escapeHtml(h.aboutBlurbText || "")}</p>
          <div class="actions">
            <a class="btn" href="ourteam.html">Our team</a>
            <a class="btn outline" href="about.html">Learn more</a>
          </div>
        </div>
        <div class="panel">
          <h3 style="margin:0 0 10px">Get involved</h3>
          <p style="margin:0; color:var(--muted); line-height:1.8">Want to volunteer, mentor, partner, or donate? We’d love to hear from you.</p>
          <div class="actions">
            <a class="btn gold" href="contact.html">Contact us</a>
            <a class="btn gold" href="support.html">Support us</a>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="bubble">
        <div class="text">${escapeHtml(h.partnerBanner?.text || "")}</div>
        <div class="right">
          <a class="btn gold small" href="${escapeHtml(h.partnerBanner?.ctaHref || "support.html")}">
            ${escapeHtml(h.partnerBanner?.ctaLabel || "Support")}
          </a>
        </div>
      </div>
    </section>
  `;

  const cleanupDot = initDotGrid(document.getElementById("dotGrid"));
  window.addEventListener("beforeunload", cleanupDot, { once: true });

  const imgEl = document.getElementById("carouselImg");
  const slides = (h.carouselImages || []).filter((s) => s && s.src);
  const overlayEl = document.getElementById("heroOverlay");
  const overlayCaptionEl = document.getElementById("heroOverlayCaption");
  let idx = 0;

  function show(i) {
    const s = slides[i];
    if (!s) return;

    imgEl.classList.remove("fade");
    void imgEl.offsetWidth;
    imgEl.src = s.src;
    imgEl.alt = s.alt || "Rise event photo";
    imgEl.classList.add("fade");

    // Keep the same bubble, just swap its text to match the current image.
    const caption = String(s.caption || s.alt || "").trim();
    if (overlayCaptionEl) overlayCaptionEl.textContent = caption;
    if (overlayEl) overlayEl.style.display = caption ? "" : "none";
  }

  if (slides.length) {
    show(0);
    setInterval(() => {
      idx = (idx + 1) % slides.length;
      show(idx);
    }, 3800);
  } else {
    imgEl.style.display = "none";
    if (overlayEl) overlayEl.style.display = "none";
  }

  const statNums = mount.querySelectorAll("[data-count]");
  const run = () => {
    statNums.forEach((el) => {
      const to = Number(el.getAttribute("data-count")) || 0;
      const prefix = el.getAttribute("data-prefix") || "";
      const suffix = el.getAttribute("data-suffix") || "";
      animateCount(el, to, { prefix, suffix });
    });
  };

  const statsBox = document.getElementById("stats");
  if ("IntersectionObserver" in window && statsBox) {
    let done = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (done) return;
        if (entries.some((e) => e.isIntersecting)) {
          done = true;
          run();
          io.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(statsBox);
  } else {
    run();
  }
}

function initAbout(site) {
  const mount = document.getElementById("page-about");
  if (!mount) return;

  const a = site.about || {};

  mount.innerHTML = `
    <div class="two-col">
      <section class="card prose">
        <div class="badge">About</div>
        <h1>${escapeHtml(a.title || "About")}</h1>
        ${(a.paragraphs || []).map((p) => `<p>${escapeHtml(p)}</p>`).join("")}
        <div class="actions">
          <a class="btn gold" href="${escapeHtml(a.supportCta?.href || "support.html")}">
            ${escapeHtml(a.supportCta?.label || "Support")}
          </a>
          <a class="btn outline" href="learn.html">See lessons</a>
        </div>
      </section>

      <aside class="image-stack">
        ${(a.images || [])
          .slice(0, 2)
          .map(
            (im) => `
          <div class="img-card">
            <img src="${escapeHtml(im.src)}" alt="${escapeHtml(im.alt || "")}" loading="lazy"/>
          </div>
        `
          )
          .join("")}
      </aside>
    </div>
  `;
}

function initTeam(site) {
  const mount = document.getElementById("page-team");
  if (!mount) return;

  const t = site.team || {};

  const placeholderSvg =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      "<svg xmlns='http://www.w3.org/2000/svg' width='400' height='240'>" +
        "<rect width='100%' height='100%' fill='%23fbf7f0'/>" +
        "<text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' " +
        "fill='%236a5a49' font-family='system-ui' font-size='18'>Photo coming soon</text>" +
        "</svg>"
    );

  mount.innerHTML = `
    <section class="card prose">
      <div class="badge">Team</div>
      <h1>${escapeHtml(t.title || "Our Team")}</h1>
      <p>Meet the students building curriculum, training educators, and growing access to robotics.</p>
    </section>

    ${(t.sections || [])
      .map(
        (sec) => `
      <section class="team-section">
        <h2>${escapeHtml(sec.name)}</h2>
        <div class="people">
          ${(sec.people || [])
            .map(
              (p) => `
            <div class="person">
              <div class="photo">
                <img loading="lazy"
                     src="${escapeHtml(p.image || "")}"
                     alt="${escapeHtml(p.name)}" />
              </div>
              <div class="info">
                <div class="name">${escapeHtml(p.name)}</div>
                <div class="role">${escapeHtml(p.role)}</div>
                <div class="school">${escapeHtml(p.school || "")}</div>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </section>
    `
      )
      .join("")}
  `;

  mount.querySelectorAll(".person img").forEach((img) => {
    img.onerror = () => {
      img.src = placeholderSvg;
    };
  });
}

function initLearn(site) {
  const mount = document.getElementById("page-learn");
  if (!mount) return;

  const L = site.learn || {};

  mount.innerHTML = `
    <section class="card prose">
      <div class="badge">Learn</div>
      <h1>${escapeHtml(L.title || "Learn")}</h1>
      <p>${escapeHtml(L.subtitle || "")}</p>
      <div class="learn-chooser" id="trackChooser"></div>
    </section>

    <section class="section learn-portal">
      <aside class="sidebar">
        <div class="badge" id="trackBadge">Track</div>
        <div class="track-desc" id="trackDesc"></div>
        <ul class="lesson-list" id="lessonList"></ul>
      </aside>

      <article class="lesson-content" id="lessonContent">
        <h2>Pick a lesson</h2>
        <p style="color:var(--muted); line-height:1.8">Select a track above, then choose a lesson from the sidebar.</p>
      </article>
    </section>
  `;

  const tracks = L.tracks || [];
  const chooser = document.getElementById("trackChooser");
  const list = document.getElementById("lessonList");
  const content = document.getElementById("lessonContent");
  const badge = document.getElementById("trackBadge");
  const desc = document.getElementById("trackDesc");

  let activeTrack = tracks[0] || null;
  let activeLessonId = activeTrack?.lessons?.[0]?.id || null;

  function renderTrackButtons() {
    chooser.innerHTML = tracks
      .map(
        (tr) => `
      <button class="btn ${tr.key === activeTrack?.key ? "gold" : "outline"}"
              type="button"
              data-track="${escapeHtml(tr.key)}">
        ${escapeHtml(tr.label)}
      </button>
    `
      )
      .join("");

    chooser.querySelectorAll("button[data-track]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.getAttribute("data-track");
        activeTrack = tracks.find((t) => t.key === key) || activeTrack;
        activeLessonId = activeTrack?.lessons?.[0]?.id || null;
        renderSidebar();
        renderTrackButtons();
        renderLesson();
      });
    });
  }

  function renderSidebar() {
    if (!activeTrack) {
      list.innerHTML = "";
      badge.textContent = "Track";
      desc.textContent = "";
      return;
    }

    badge.textContent = activeTrack.label;
    desc.textContent = activeTrack.description || "";

    list.innerHTML = (activeTrack.lessons || [])
      .map(
        (lesson) => `
      <li>
        <button class="lesson-btn ${lesson.id === activeLessonId ? "active" : ""}"
                type="button"
                data-lesson="${escapeHtml(lesson.id)}">
          <div class="t">${escapeHtml(lesson.title)}</div>
          <div class="m">${escapeHtml(lesson.duration || "")}</div>
        </button>
      </li>
    `
      )
      .join("");

    list.querySelectorAll("button[data-lesson]").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeLessonId = btn.getAttribute("data-lesson");
        renderSidebar();
        renderLesson();
      });
    });
  }

  function renderLesson() {
    if (!activeTrack || !activeLessonId) {
      content.innerHTML = `<h2>Pick a lesson</h2><p style="color:var(--muted); line-height:1.8">Select a lesson from the sidebar.</p>`;
      return;
    }

    const lesson = (activeTrack.lessons || []).find((l) => l.id === activeLessonId);
    if (!lesson) {
      content.innerHTML = `<h2>Lesson not found</h2><p style="color:var(--muted)">Check <code>content.json</code>.</p>`;
      return;
    }

    content.innerHTML =
      lesson.contentHtml || `<h2>${escapeHtml(lesson.title)}</h2><p style="color:var(--muted)">(No content yet.)</p>`;
  }

  renderTrackButtons();
  renderSidebar();
  renderLesson();
}

function initSupport(site) {
  const mount = document.getElementById("page-support");
  if (!mount) return;

  const s = site.support || {};

  mount.innerHTML = `
    <section class="card prose">
      <div class="badge">Donate</div>
      <h1>${escapeHtml(s.title || "Support")}</h1>
      <p>${escapeHtml(s.subtitle || "")}</p>
    </section>

    <section class="section">
      <div class="split">
        <div class="panel">
          <h3 style="margin:0 0 10px">Where support goes</h3>
          <ul style="margin:10px 0 0; padding-left:18px; color:rgba(0,0,0,.68); line-height:1.8">
            ${(s.whereSupportGoes || []).map((x) => `<li>${escapeHtml(x)}</li>`).join("")}
          </ul>
        </div>

        <div class="panel">
          <h3 style="margin:0 0 10px">Donate</h3>
          <p style="margin:0; color:var(--muted); line-height:1.8">Please help us continue our mission by donating to Rise Robotics.</p>
          <div class="actions" style="margin-top:14px">
            ${(s.donationLinks || [])
              .map(
                (d) => `
              <a class="btn ${escapeHtml(d.variant || "")}"
                 href="${escapeHtml(d.href || "#")}"
                 ${d.href && d.href !== "#" ? 'target="_blank" rel="noopener"' : ""}>
                ${escapeHtml(d.label)}
              </a>
            `
              )
              .join("")}
            <a class="btn outline" href="${escapeHtml(s.partnerCta?.href || "contact.html")}">
              ${escapeHtml(s.partnerCta?.label || "Contact us for partnerships")}
            </a>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="panel">
        <h3 style="margin:0 0 10px">${escapeHtml(s.transparency?.title || "Transparency")}</h3>
        <p style="margin:0; color:var(--muted); line-height:1.8">${escapeHtml(s.transparency?.text || "")}</p>
        <div class="actions">
          <a class="btn gold" href="${escapeHtml(s.transparency?.ctaHref || "learn.html")}">
            ${escapeHtml(s.transparency?.ctaLabel || "See what students learn")}
          </a>
        </div>
      </div>
    </section>
  `;
}

function initContact(site) {
  const mount = document.getElementById("page-contact");
  if (!mount) return;

  const c = site.contact || {};

  mount.innerHTML = `
    <div class="form-grid">
      <section class="card form-card">
        <div class="badge">Contact</div>
        <h1 style="margin:10px 0 10px">${escapeHtml(c.title || "Contact")}</h1>
        <p style="margin:0 0 12px; color:var(--muted); line-height:1.8">${escapeHtml(c.subtitle || "")}</p>

        <!-- Netlify form -->
        <form name="contact" method="POST" data-netlify="true" netlify-honeypot="bot-field">
          <input type="hidden" name="form-name" value="contact" />
          <p style="display:none">
            <label>Don’t fill this out: <input name="bot-field" /></label>
          </p>

          <div class="field">
            <label for="name">Name</label>
            <input id="name" name="name" required />
          </div>

          <div class="field">
            <label for="email">Email</label>
            <input id="email" name="email" type="email" required />
          </div>

          <div class="field">
            <label for="topic">Topic</label>
            <select id="topic" name="topic" required>
              <option value="" selected disabled>Select one</option>
              <option>Partnership</option>
              <option>Mentorship / Volunteering</option>
              <option>Donations / Sponsorship</option>
              <option>General question</option>
            </select>
          </div>

          <div class="field">
            <label for="message">Message</label>
            <textarea id="message" name="message" required></textarea>
          </div>

          <button class="btn gold" type="submit">Send</button>
          <div class="note">We will reach out to you soon.</div>
        </form>
      </section>

      <aside class="card info-card">
        <h2 style="margin:0 0 10px">Other ways</h2>
        <p style="margin:0; color:var(--muted); line-height:1.8">Here are other methods to get in touch with us.</p>
        <div class="kv">
          ${(c.otherWays || [])
            .map(
              (r) => `
            <div class="row">
              <div class="k">${escapeHtml(r.label)}</div>
              <div class="v">${escapeHtml(r.value)}</div>
            </div>
          `
            )
            .join("")}
        </div>

        <div class="section" style="margin-top:16px">
          <h2 style="margin:0 0 10px">Prefer donating?</h2>
          <p style="margin:0; color:var(--muted); line-height:1.8">Support materials and instruction directly.</p>
          <div class="actions" style="margin-top:10px">
            <a class="btn gold" href="${escapeHtml(c.donateCta?.href || "support.html")}">
              ${escapeHtml(c.donateCta?.label || "Donate")}
            </a>
          </div>
        </div>
      </aside>
    </div>
  `;
}

async function init() {
  const site = await loadContent();
  buildHeaderFooter(site);

  const page = document.body.getAttribute("data-page");
  if (page === "home") initHome(site);
  if (page === "about") initAbout(site);
  if (page === "team") initTeam(site);
  if (page === "learn") initLearn(site);
  if (page === "support") initSupport(site);
  if (page === "contact") initContact(site);

  // Make partner logos clickable once the page content is mounted.
  // Use a microtask to ensure DOM is updated.
  Promise.resolve().then(() => linkPartnerLogos(site));
}

document.addEventListener("DOMContentLoaded", () => {
  init().catch((err) => {
    console.error(err);
    const main = document.querySelector("main");
    if (main)
      main.innerHTML = `
        <div class="container">
          <div class="card prose">
            <h1>Site error</h1>
            <p style="color:var(--muted)">
              Could not load <code>content.json</code> or a script error occurred.
              Try opening <code>/content.json</code> in your browser to confirm it loads.
            </p>
            <pre style="white-space:pre-wrap; color:var(--muted)">${escapeHtml(String(err))}</pre>
          </div>
        </div>`;
  });
});