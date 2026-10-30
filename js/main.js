/* ═══════════════════════════════════════════════════════════════
   SEMPRE CABE MAIS UM — main.js
   Parallax da capa, revelação ao rolar, progresso de leitura,
   tema claro/escuro, lista de livros que abre, e duas ferramentas
   de leitura. Sem dependências.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  const store = {
    get(k, d) { try { return localStorage.getItem(k) ?? d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  /* ── tema ─────────────────────────────────────────────────── */
  function applyTheme(t) {
    root.setAttribute('data-theme', t);
    store.set('selibi:theme', t);
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#140f1c' : '#e5117b');
  }
  applyTheme(store.get('selibi:theme',
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  $('#btnTheme').addEventListener('click', () => {
    applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  /* ── progresso e topo fixo ─────────────────────────────────── */
  const topbar = $('#topbar');
  const bar = $('#progressBar');
  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? clamp(y / h, 0, 1) * 100 : 0) + '%';
      topbar.classList.toggle('is-stuck', y > 10);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── revelação ao rolar ───────────────────────────────────── */
  const revs = $$('.rev');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    revs.forEach(el => io.observe(el));
  } else {
    revs.forEach(el => el.classList.add('is-in'));
  }

  /* ── parallax da capa ──────────────────────────────────────── */
  const layers = $$('[data-depth]');
  let queued = false;

  function parallax() {
    if (!reduceMotion) {
      const vh = window.innerHeight;
      layers.forEach(l => {
        const host = l.closest('section') || l.parentElement;
        if (!host) return;
        const r = host.getBoundingClientRect();
        if (r.bottom < -240 || r.top > vh + 240) return;
        const depth = parseFloat(l.dataset.depth) || 0.2;
        const off = (vh / 2 - (r.top + r.height / 2)) * depth;
        l.style.transform = l.classList.contains('hero__cadeira')
          ? 'translateY(-50%) translate3d(0,' + off.toFixed(2) + 'px,0)'
          : 'translate3d(0,' + off.toFixed(2) + 'px,0)';
      });
    }
    queued = false;
  }
  function requestParallax() {
    if (!queued) queued = requestAnimationFrame(parallax);
  }
  window.addEventListener('scroll', requestParallax, { passive: true });
  window.addEventListener('resize', requestParallax);
  requestParallax();

  /* ── lista de livros que abre ──────────────────────────────── */
  $$('.livros__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const li = btn.closest('li');
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      li.classList.toggle('is-open', !open);
    });
  });

  /* ── ferramenta 1: gerador de perguntas ────────────────────── */
  const PERGUNTAS = [
    'Qual personagem você teria sido nessa história — e o que teria mudado?',
    'Em que momento você mudou de ideia sobre alguém do livro?',
    'A personagem principal tem razão? Diga sim ou não, e por quê.',
    'Qual cena você contaria para alguém que não leu?',
    'Se este livro fosse um filme, quem faria a protagonista? E por quê?',
    'O que o adulto dentro de você diria a esta personagem?',
    'Qual frase do livro você levaria para a vida?',
    'Existe alguma coisa aqui que você discordaria? O quê, exatamente?',
    'O que mudou na vida da personagem depois do último capítulo?',
    'Qual detalhe pequeno ficou na sua cabeça?',
    'Se a história fosse contada do ponto de vista de outra pessoa, mudaria o quê?',
    'O que você diria à protagonista se tivesse cinco minutos com ela?',
    'Qual problema da personagem é, ao mesmo tempo, um problema seu?',
    'O que o livro deixa de fora? O que você acrescentaria?',
    'A história te fez rir? Em qual momento exatamente?'
  ];
  const qOut = $('#qOut');
  $('#btnQ').addEventListener('click', () => {
    let i;
    do { i = Math.floor(Math.random() * PERGUNTAS.length); }
    while (PERGUNTAS.length > 1 && i === Number(qOut.dataset.last));
    qOut.dataset.last = i;
    qOut.style.opacity = '0';
    setTimeout(() => {
      qOut.textContent = PERGUNTAS[i];
      qOut.style.opacity = '1';
    }, reduceMotion ? 0 : 160);
  });
  qOut.style.transition = 'opacity .2s';

  /* ── ferramenta 2: a cadeira que sobrou ────────────────────── */
  const INVITES = [
    'Leia a página 12 e escolha UMA frase para comentar. Só uma.',
    'Procure um diálogo que poderia ter sido diferente. Reescreva-o em voz alta.',
    'Descreva a cena em três frases. Sem adjetivos.',
    'Escolha um personagem e dê a ele um nome novo. O que muda?',
    'Qual foi o momento mais ridículo? Leia em voz alta para a turma.',
    'A protagonista está certa? Argumente com a página aberta.',
    'Escolha uma passagem e explique, com suas palavras, do que ela trata.',
    'O que o livro pede que você acredite? Você acredita?',
    'Quem está certo aqui: a personagem ou quem a julga? Defenda um lado.',
    'Escreva uma frase que o livro poderia ter dito no lugar da personagem.'
  ];
  const cadeira = $('#cadeira');
  const cadeiraOut = $('#cadeiraOut');
  let convite = 0;
  cadeira.addEventListener('click', () => {
    cadeiraOut.textContent = INVITES[convite % INVITES.length];
    convite++;
    cadeiraOut.style.opacity = '0';
    requestAnimationFrame(() => { cadeiraOut.style.opacity = '1'; });
  });
})();
