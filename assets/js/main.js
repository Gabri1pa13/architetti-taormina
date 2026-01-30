(function(){
  // --- Global contact destinations (must be consistent across the site) ---
  const WHATSAPP_NUMBER = '393299736697';
  const STUDIO4E_URL = 'https://www.studio4e.it/';

  const encode = (s) => encodeURIComponent(String(s || '')).replace(/%20/g, '+');
  const waLink = (message) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encode(message)}`;

  const burger = document.querySelector('[data-burger]');
  const drawer = document.querySelector('[data-drawer]');
  const panel = drawer ? drawer.querySelector('.drawer-panel') : null;
  const closeBtn = drawer ? drawer.querySelector('[data-close]') : null;

  if(burger && drawer){
    burger.setAttribute('aria-expanded', 'false');

    const open = () => {
      drawer.style.display = 'block';
      document.body.style.overflow = 'hidden';
      burger.setAttribute('aria-expanded', 'true');
      // focus first link for accessibility
      const firstLink = drawer.querySelector('a');
      if(firstLink) firstLink.focus({preventScroll:true});
    };

    const close = () => {
      drawer.style.display = 'none';
      document.body.style.overflow = '';
      burger.setAttribute('aria-expanded', 'false');
      burger.focus({preventScroll:true});
    };

    burger.addEventListener('click', open);
    if(closeBtn) closeBtn.addEventListener('click', close);

    drawer.addEventListener('click', (e) => {
      // click on overlay closes
      if(e.target === drawer) close();
    });

    document.addEventListener('keydown', (e) => {
      if(drawer.style.display === 'block' && e.key === 'Escape') close();
    });

    // basic focus trap
    document.addEventListener('keydown', (e) => {
      if(drawer.style.display !== 'block') return;
      if(e.key !== 'Tab') return;

      const focusables = drawer.querySelectorAll('a, button, input, [tabindex]:not([tabindex="-1"])');
      if(!focusables.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if(e.shiftKey && document.activeElement === first){
        e.preventDefault();
        last.focus();
      } else if(!e.shiftKey && document.activeElement === last){
        e.preventDefault();
        first.focus();
      }
    });
  }

  // --- Premium UI: scroll progress + reveal animations ---
  const mountProgress = () => {
    if(document.querySelector('.progress')) return;
    const bar = document.createElement('div');
    bar.className = 'progress';
    bar.innerHTML = '<div class="progress__bar"></div>';
    document.body.appendChild(bar);

    const inner = bar.querySelector('.progress__bar');
    const onScroll = () => {
      const doc = document.documentElement;
      const max = (doc.scrollHeight - doc.clientHeight) || 1;
      const p = Math.min(1, Math.max(0, doc.scrollTop / max));
      inner.style.transform = `scaleX(${p})`;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, {passive:true});
  };

  const mountReveals = () => {
    const candidates = Array.from(document.querySelectorAll('.card, .blog-card, .hero-grid > *, .article > *'));
    candidates.forEach((el, i) => {
      // avoid animating items that are already explicitly marked
      if(el.classList.contains('reveal')) return;
      el.classList.add('reveal');
      el.style.setProperty('--reveal-delay', `${Math.min(i, 12) * 60}ms`);
    });

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, {threshold: 0.12, rootMargin: '0px 0px -10% 0px'});

    candidates.forEach(el => io.observe(el));
  };

  // --- Blog UX: floating WhatsApp, sticky CTA ribbon, auto TOC ---
  const isBlogArticle = () => {
    const path = (location.pathname || '').toLowerCase();
    if(path.includes('/blog/')) return true;
    // local file fallback for Taormina articles
    return document.querySelector('article .prose') && document.querySelector('.content-grid');
  };

  const mountFloatingWhatsApp = () => {
    if(document.querySelector('.wa-fab')) return;

    const title = (document.querySelector('h1')?.textContent || document.title || 'una guida').trim();
    const msg = `Ciao Studio4E, ho visto la pagina “${title}” su architettitaormina.it e vorrei una consulenza. Il mio progetto è:`;

    const a = document.createElement('a');
    a.className = 'wa-fab';
    a.href = waLink(msg);
    a.target = '_blank';
    a.rel = 'noopener';
    a.setAttribute('aria-label', 'Contatta Studio4E su WhatsApp');
    a.innerHTML = `
      <span class="wa-fab__icon" aria-hidden="true">✦</span>
      <span class="wa-fab__text">
        <span class="wa-fab__label">WhatsApp</span>
        <span class="wa-fab__sub">Risposta rapida</span>
      </span>
    `;
    document.body.appendChild(a);
  };

  const mountStickyRibbon = () => {
    if(document.querySelector('.sticky-cta')) return;
    const el = document.createElement('div');
    el.className = 'sticky-cta';
    el.innerHTML = `
      <div class="sticky-cta__inner">
        <div class="sticky-cta__copy">
          <div class="sticky-cta__title">Vuoi un parere professionale sul tuo progetto?</div>
          <div class="sticky-cta__sub">Scrivici su WhatsApp e raccontaci immobile, obiettivo e budget. Ti diciamo i prossimi step.</div>
        </div>
        <div class="sticky-cta__actions">
          <a class="btn btn-primary" target="_blank" rel="noopener" href="${waLink('Ciao Studio4E, vorrei una consulenza per un progetto a Taormina/Sicilia. Il mio progetto è:')}">Contatto WhatsApp</a>
          <a class="btn" target="_blank" rel="noopener" href="${STUDIO4E_URL}">Sito Studio4E</a>
        </div>
      </div>
    `;
    document.body.appendChild(el);
  };

  const slugify = (s) => (s || '')
    .toLowerCase()
    .trim()
    .replace(/[àáâãäå]/g,'a')
    .replace(/[èéêë]/g,'e')
    .replace(/[ìíîï]/g,'i')
    .replace(/[òóôõö]/g,'o')
    .replace(/[ùúûü]/g,'u')
    .replace(/[^a-z0-9\s-]/g,'')
    .replace(/\s+/g,'-')
    .replace(/-+/g,'-');

  const mountTOC = () => {
    const article = document.querySelector('article');
    const prose = document.querySelector('article .prose');
    const sidebar = document.querySelector('article .sidebar');
    if(!article || !prose || !sidebar) return;
    if(sidebar.querySelector('.toc')) return;

    const headings = Array.from(prose.querySelectorAll('h2, h3'))
      .filter(h => (h.textContent || '').trim().length > 0);
    if(headings.length < 3) return;

    // ensure IDs
    headings.forEach(h => {
      if(!h.id){
        const base = slugify(h.textContent);
        let id = base || 'sezione';
        let n = 2;
        while(document.getElementById(id)) { id = `${base}-${n++}`; }
        h.id = id;
      }
    });

    const toc = document.createElement('div');
    toc.className = 'toc';
    toc.innerHTML = '<div class="toc__title">In questa guida</div>';
    const ul = document.createElement('ul');
    ul.className = 'toc__list';
    headings.forEach(h => {
      const li = document.createElement('li');
      li.className = `toc__item toc__item--${h.tagName.toLowerCase()}`;
      li.innerHTML = `<a href="#${h.id}">${h.textContent.trim()}</a>`;
      ul.appendChild(li);
    });
    toc.appendChild(ul);

    const expert = document.createElement('div');
    expert.className = 'expert-card';
    expert.innerHTML = `
      <div class="expert-card__kicker">Studio4E</div>
      <div class="expert-card__title">Progetto, pratiche, ristrutturazione, interior</div>
      <div class="expert-card__p">Se vuoi evitare extra-costi e improvvisazione, ti diciamo subito: cosa serve, tempi realistici e range di budget.</div>
      <div class="expert-card__actions">
        <a class="btn btn-primary" target="_blank" rel="noopener" href="${waLink('Ciao Studio4E, vorrei un parere professionale sul mio progetto. Il mio progetto è:')}">Scrivi su WhatsApp</a>
        <a class="btn" target="_blank" rel="noopener" href="${STUDIO4E_URL}">Portfolio Studio4E</a>
      </div>
    `;

    sidebar.insertBefore(toc, sidebar.firstChild);
    sidebar.appendChild(expert);

    // highlight active section
    const spy = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const id = entry.target.id;
        const link = sidebar.querySelector(`.toc a[href="#${CSS.escape(id)}"]`);
        if(!link) return;
        if(entry.isIntersecting){
          sidebar.querySelectorAll('.toc a').forEach(a => a.classList.remove('is-active'));
          link.classList.add('is-active');
        }
      });
    }, {rootMargin: '-35% 0px -55% 0px', threshold: 0.01});
    headings.forEach(h => spy.observe(h));
  };

  // Blog search filter (optional)
  const search = document.querySelector('[data-search]');
  if(search){
    const cards = Array.from(document.querySelectorAll('[data-post]'));
    const normalize = (s) => (s || '').toLowerCase().trim();
    search.addEventListener('input', () => {
      const q = normalize(search.value);
      cards.forEach(card => {
        const hay = normalize(card.getAttribute('data-post'));
        card.style.display = hay.includes(q) ? '' : 'none';
      });
    });
  }

  // Mount premium UI
  mountProgress();
  mountReveals();

  if(isBlogArticle()){
    mountFloatingWhatsApp();
    mountStickyRibbon();
    mountTOC();
  }
})();
