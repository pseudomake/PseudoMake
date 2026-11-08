'use strict';
/* ============ Utilitaires ============ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const rnd = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];
const chance = p => Math.random() < p;
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '');
const toastEl = $('#toast');
let toastT;
function toast(msg, err = false) {
  toastEl.textContent = msg;
  toastEl.classList.toggle('err', err);
  toastEl.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => toastEl.classList.remove('show'), 2000);
}
async function copy(text) {
  try { await navigator.clipboard.writeText(text); }
  catch {
    const t = document.createElement('textarea');
    t.value = text; document.body.appendChild(t); t.select();
    try { document.execCommand('copy'); } catch { toast('Copie impossible sur ce navigateur.', true); t.remove(); return; }
    t.remove();
  }
  toast('Copié : ' + text);
}
const store = {
  get() { try { return JSON.parse(localStorage.getItem('pm_favs')) || []; } catch { return []; } },
  set(v) { try { localStorage.setItem('pm_favs', JSON.stringify(v)); } catch { toast('Enregistrement local impossible.', true); } }
};

/* ============ Données ============ */
const STYLES = [
  { id: 'random', label: '🎲 Aléatoire' },
  { id: 'stylish', label: '✨ Stylé', pre: ['neo', 'zen', 'lux', 'aero', 'nova', 'vibe', 'luna', 'sola', 'kai', 'ori'], suf: ['ix', 'ora', 'ex', 'ly', 'is', 'ova', 'ium', 'ine'], words: ['velvet', 'aura', 'lumen', 'prism', 'echo', 'ember', 'halo', 'onyx', 'opal', 'mirage', 'azure', 'nimbus'] },
  { id: 'gaming', label: '🎮 Gaming', pre: ['pro', 'ultra', 'hyper', 'max', 'rex', 'zed', 'tryhard', 'turbo'], suf: ['x', 'ox', 'tron', 'zor', 'ster', 'ix', 'ak', 'on'], words: ['sniper', 'clutch', 'blitz', 'raid', 'ace', 'frag', 'boss', 'rush', 'tank', 'pixel', 'combo', 'nitro'] },
  { id: 'cute', label: '🧸 Mignon', pre: ['mini', 'petit', 'choco', 'bubu', 'mimi', 'lulu', 'kiki', 'nono'], suf: ['ou', 'ette', 'ie', 'ino', 'oo', 'ito', 'mi', 'pie'], words: ['mochi', 'nuage', 'cookie', 'bonbon', 'peluche', 'miel', 'pomme', 'poussin', 'fraise', 'lapin', 'chaton', 'cacao'] },
  { id: 'mystery', label: '🌑 Mystérieux', pre: ['umbra', 'nyx', 'void', 'dusk', 'mor', 'vel', 'noct', 'sable'], suf: ['us', 'ar', 'eth', 'oth', 'yx', 'ael', 'or', 'ys'], words: ['ombre', 'enigme', 'cendre', 'spectre', 'eclipse', 'abysse', 'rune', 'brume', 'corbeau', 'minuit', 'secret', 'nox'] }
];
const SYL_C = ['b', 'd', 'k', 'l', 'm', 'n', 'r', 's', 't', 'v', 'z', 'x', 'th', 'ch', 'f', 'g', 'j', 'p'];
const SYL_V = ['a', 'e', 'i', 'o', 'u', 'ae', 'io', 'ia', 'ou', 'y'];
const UNIVERSES = [
  { id: 'gaming', t: 'Gaming', ic: '🎮', c: '#22d3ee', d: 'Pseudos compétitifs et dynamiques.', pre: ['pro', 'xx', 'ultra', 'king'], suf: ['gg', 'ez', 'x', 'yt'], words: ['sniper', 'clutch', 'headshot', 'rogue', 'glitch', 'raider', 'boost', 'rage', 'ranked', 'spawn', 'lag', 'arena'] },
  { id: 'social', t: 'Réseaux sociaux', ic: '💬', c: '#f472b6', d: 'Des identités faciles à retenir et à partager.', pre: ['the', 'real', 'its', 'just'], suf: ['daily', 'vibes', 'xo', 'life'], words: ['story', 'reel', 'snap', 'trend', 'mood', 'feed', 'glow', 'cosy', 'soleil', 'ciel', 'paris', 'loop'] },
  { id: 'creator', t: 'Création et streaming', ic: '🎬', c: '#fb923c', d: 'Pour chaînes, lives et créations.', pre: ['live', 'studio', 'team', 'on'], suf: ['tv', 'live', 'studio', 'cast'], words: ['stream', 'cam', 'clip', 'montage', 'micro', 'plateau', 'pixel', 'scene', 'track', 'focus', 'direct', 'flux'] },
  { id: 'fantasy', t: 'Fantasy', ic: '🐉', c: '#a78bfa', d: 'Noms inspirés des mondes imaginaires.', pre: ['ael', 'thal', 'eld', 'val', 'syl', 'gor', 'ar'], suf: ['wen', 'dor', 'rion', 'iel', 'ath', 'orn', 'ria'], words: ['dragon', 'elfe', 'mage', 'runes', 'sylve', 'griffon', 'aurore', 'lame', 'sorcier', 'phoenix', 'orcish', 'chene'] },
  { id: 'anime', t: 'Anime et manga', ic: '🌸', c: '#fb7185', d: 'Sonorités et ambiances venues du Japon.', pre: ['kuro', 'shiro', 'aka', 'ao', 'hana', 'yoru', 'tsuki'], suf: ['kun', 'chan', 'maru', 'ryu', 'zuki', 'hiro', 'ko'], words: ['sakura', 'ninja', 'kitsune', 'senpai', 'katana', 'neko', 'hoshi', 'kaze', 'ronin', 'tengu', 'mizu', 'yami'] },
  { id: 'cinema', t: 'Cinéma et séries', ic: '🍿', c: '#facc15', d: 'Un parfum de grand écran.', pre: ['cine', 'noir', 'max', 'lord'], suf: ['son', 'man', 'ford', 'ley'], words: ['scenario', 'clap', 'reel', 'heros', 'saga', 'rideau', 'casting', 'trailer', 'film', 'acteur', 'duo', 'finale'] },
  { id: 'music', t: 'Musique', ic: '🎧', c: '#34d399', d: 'Rythmes, notes et pseudos de scène.', pre: ['dj', 'mc', 'lo', 'sub'], suf: ['beat', 'wave', 'fm', 'tone'], words: ['bass', 'groove', 'vinyl', 'synth', 'accord', 'riff', 'tempo', 'echo', 'remix', 'melody', 'drop', 'jazz'] },
  { id: 'sport', t: 'Sport', ic: '🏆', c: '#4ade80', d: 'Énergie, vitesse et esprit d\'équipe.', pre: ['fast', 'iron', 'top', 'cap'], suf: ['run', 'fit', 'pro', 'strike'], words: ['sprint', 'goal', 'dribble', 'smash', 'trail', 'dunk', 'ring', 'podium', 'tempo', 'champion', 'vitesse', 'endurance'] },
  { id: 'mystery', t: 'Mystérieux', ic: '🌑', c: '#818cf8', d: 'Pseudos énigmatiques et sombres.', pre: ['umbra', 'nyx', 'void', 'noct'], suf: ['eth', 'us', 'yx', 'oth'], words: ['ombre', 'enigme', 'spectre', 'brume', 'cendre', 'minuit', 'abysse', 'masque', 'secret', 'nocturne', 'veil', 'rune'] },
  { id: 'cute', t: 'Mignon', ic: '🧸', c: '#f9a8d4', d: 'Pseudos doux et amusants.', pre: ['mini', 'petit', 'choco', 'mimi'], suf: ['ou', 'ette', 'ie', 'ito'], words: ['mochi', 'nuage', 'cookie', 'bonbon', 'peluche', 'miel', 'chaton', 'fraise', 'lapin', 'tartine', 'pompon', 'cacao'] },
  { id: 'pro', t: 'Professionnel', ic: '💼', c: '#60a5fa', d: 'Sobres, lisibles, crédibles.', pre: ['studio', 'atelier', 'maison', 'cabinet'], suf: ['conseil', 'works', 'lab', 'pro'], words: ['axis', 'nord', 'cadre', 'vertex', 'lumiere', 'bureau', 'sigma', 'solide', 'avenir', 'forge', 'bleu', 'alpha'] },
  { id: 'any', t: 'Aléatoire', ic: '🎲', c: '#c084fc', d: 'Laissez le hasard choisir pour vous.' }
];
const SEPS = ['_', '-', '.', '~'];
const SYMS = ['_', '-', '.', '×', '★', '✦', '•', '~', '◈'];
const SYM_END = ['★', '✦', '◈', '×', '_', '~'];

/* ============ Moteur de génération ============ */
const Engine = {
  recent: new Set(),
  vowelRe: /[aeiouy]/i,
  syllable(pool) {
    const c = pick(SYL_C), v = pick(SYL_V);
    return chance(.25) ? v + pick(['n', 'r', 'l', 's', 'x']) : c + v;
  },
  syllables(n) { let s = ''; for (let i = 0; i < n; i++) s += this.syllable(); return s; },
  mutate(w) {
    const opts = [
      () => w,
      () => w.replace(/[aeiou]$/i, '') + pick(['o', 'a', 'ix', 'y']),
      () => w.length > 4 ? w.slice(0, -1) : w + 'o',
      () => w.replace(/c/i, 'k'),
      () => w + w.slice(-1)
    ];
    return pick(opts)();
  },
  pools(styleId, uniId) {
    const st = styleId === 'random' ? pick(STYLES.slice(1)) : STYLES.find(s => s.id === styleId);
    const un = uniId === 'any' ? pick(UNIVERSES.slice(0, -1)) : UNIVERSES.find(u => u.id === uniId);
    // L'univers pèse un peu plus que le style
    return {
      words: [...un.words, ...un.words, ...st.words],
      pre: [...un.pre, ...un.pre, ...st.pre],
      suf: [...un.suf, ...un.suf, ...st.suf]
    };
  },
  isPronounceable(s) {
    const l = s.toLowerCase().replace(/[^a-z]/g, '');
    return !!l && this.vowelRe.test(l) && !/[^aeiouy]{4,}/.test(l) && !/([a-z])\1{2,}/.test(l);
  },
  core(p, word, opts) {
    const { words, pre, suf } = p;
    if (word) {
      const w = chance(.7) ? word : this.mutate(word);
      const plans = [
        () => w + pick(suf), () => pick(pre) + w, () => w + pick(words),
        () => pick(words) + w, () => this.syllables(1) + w + this.syllables(1),
        () => w + this.syllables(chance(.5) ? 1 : 2), () => pick(pre) + w + pick(suf),
        () => w.slice(0, Math.ceil(w.length / 2)) + pick(words) + w.slice(-2)
      ];
      return pick(plans)();
    }
    const plans = [
      () => pick(words) + pick(words), () => pick(pre) + this.syllables(1 + rnd(2)) + pick(suf),
      () => this.syllables(2 + rnd(2)), () => pick(words) + pick(suf),
      () => pick(pre) + pick(words), () => this.syllables(2) + pick(suf),
      () => pick(pre) + this.syllables(2), () => pick(words)
    ];
    return pick(plans)();
  },
  decorate(base, opts) {
    // Casse
    let s = base;
    const mode = rnd(4);
    if (mode === 0) s = s.toLowerCase();
    else if (mode === 1) s = cap(s.toLowerCase());
    else if (mode === 2) s = s.toUpperCase();
    else s = cap(s.toLowerCase());
    // Séparateur symbolique au milieu (jamais en mode prononçable)
    if (opts.symbols && !opts.pron && chance(.35) && s.length > 5) {
      const i = 2 + rnd(s.length - 4);
      s = s.slice(0, i) + pick(SEPS) + s.slice(i);
    }
    if (opts.symbols && chance(.55)) s += pick(opts.pron ? ['_'] : SYM_END);
    if (opts.digits && chance(.7)) {
      const d = pick([() => String(rnd(10)), () => String(10 + rnd(90)), () => String(rnd(1000)).padStart(3, '0'), () => pick(['07', '13', '21', '42', '77', '99', '666', '2k'])])();
      s = chance(opts.pron ? 0 : .1) ? d + s : s + d;
    }
    return s;
  },
  fit(s, min, max) {
    if (s.length > max) return null;
    if (s.length < min) return null;
    return s;
  },
  one(p, word, opts) {
    const base = this.core(p, norm(word || ''), opts);
    if (!base || base.length < 2) return null;
    let s = this.decorate(base, opts);
    if (s.length < opts.min && opts.digits) s += String(rnd(1000));
    if (s.length < opts.min && !opts.digits) s += this.syllables(1);
    if (opts.pron && !this.isPronounceable(s)) return null;
    if (!opts.digits && /\d/.test(s)) return null;
    if (!opts.symbols && /[^a-zA-Z0-9]/.test(s)) return null;
    return this.fit(s, opts.min, opts.max);
  },
  generate(opts, count = 8) {
    const out = new Set();
    const word = norm(opts.word || '');
    let tries = 0;
    while (out.size < count && tries < 3000) {
      tries++;
      const p = this.pools(opts.style, opts.universe);
      const s = this.one(p, word, opts);
      if (!s) continue;
      const key = s.toLowerCase();
      if (out.has(s) || [...out].some(o => o.toLowerCase() === key)) continue;
      // Favorise la nouveauté sur les 400 premières tentatives
      if (this.recent.has(key) && tries < 400) continue;
      out.add(s);
    }
    // Secours : respecter la longueur coûte que coûte
    let guard = 0;
    while (out.size < count && guard++ < 500) {
      let s = (word || this.syllables(3)) + this.syllables(2);
      s = cap(s.slice(0, opts.max));
      while (s.length < opts.min) s += rnd(10);
      out.add(s.slice(0, opts.max));
    }
    const arr = [...out].slice(0, count);
    arr.forEach(a => this.recent.add(a.toLowerCase()));
    if (this.recent.size > 300) this.recent = new Set([...this.recent].slice(-100));
    return arr;
  }
};

/* ============ Navigation ============ */
const sidebar = $('#sidebar'), scrim = $('#scrim');
function show(view) {
  $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + view));
  $$('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  closeMenu();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (view === 'favorites') renderFavs();
}
function openMenu() { sidebar.classList.add('open'); scrim.classList.add('show'); }
function closeMenu() { sidebar.classList.remove('open'); scrim.classList.remove('show'); }
document.addEventListener('click', e => {
  const b = e.target.closest('[data-view]');
  if (b) show(b.dataset.view);
});
$('#menuBtn').onclick = openMenu;
scrim.onclick = closeMenu;
$('#startBtn').onclick = () => show('generator');

/* ============ Générateur : interface ============ */
const state = { style: 'random', universe: 'any' };
function renderChoices() {
  $('#styleList').innerHTML = STYLES.map(s => `<button type="button" class="pill${s.id === state.style ? ' active' : ''}" data-style="${s.id}">${s.label}</button>`).join('');
  $('#universeList').innerHTML = UNIVERSES.map(u => `<button type="button" class="pill${u.id === state.universe ? ' active' : ''}" data-uni="${u.id}">${u.ic} ${u.t}</button>`).join('');
}
$('#styleList').onclick = e => { const b = e.target.closest('[data-style]'); if (b) { state.style = b.dataset.style; renderChoices(); } };
$('#universeList').onclick = e => { const b = e.target.closest('[data-uni]'); if (b) { state.universe = b.dataset.uni; renderChoices(); } };

const minEl = $('#minLen'), maxEl = $('#maxLen');
function syncLen(from) {
  let mn = +minEl.value, mx = +maxEl.value;
  if (mn > mx) { if (from === 'min') maxEl.value = mx = mn; else minEl.value = mn = mx; }
  $('#minVal').textContent = mn; $('#maxVal').textContent = mx;
  $$('#lengthPresets .pill').forEach(p => p.classList.toggle('active', +p.dataset.min === mn && +p.dataset.max === mx));
}
minEl.oninput = () => syncLen('min');
maxEl.oninput = () => syncLen('max');
$('#lengthPresets').onclick = e => {
  const b = e.target.closest('.pill'); if (!b) return;
  minEl.value = b.dataset.min; maxEl.value = b.dataset.max; syncLen();
};

function favSet() { return new Set(store.get()); }
function renderResults(list) {
  const favs = favSet();
  $('#resultsEmpty').hidden = true;
  $('#results').innerHTML = list.map((n, i) => `
    <div class="res" style="animation-delay:${i * 60}ms">
      <span class="name">${esc(n)}</span>
      <span class="acts">
        <button class="icon-btn" data-copy="${esc(n)}" title="Copier" aria-label="Copier ${esc(n)}">⧉</button>
        <button class="icon-btn${favs.has(n) ? ' on' : ''}" data-fav="${esc(n)}" title="Favori" aria-label="Ajouter ${esc(n)} aux favoris">${favs.has(n) ? '♥' : '♡'}</button>
      </span>
    </div>`).join('');
}
function esc(s) { return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

let genTimer;
function runGeneration() {
  const opts = {
    style: state.style, universe: state.universe, word: $('#customWord').value.trim(),
    min: +minEl.value, max: +maxEl.value,
    digits: $('#optDigits').checked, symbols: $('#optSymbols').checked, pron: $('#optPron').checked
  };
  if (opts.word && norm(opts.word).length > opts.max) {
    toast(`Votre mot dépasse la longueur maximale (${opts.max}). Augmentez-la ou raccourcissez le mot.`, true);
    return;
  }
  if (opts.word && !norm(opts.word)) { toast('Le mot doit contenir au moins une lettre ou un chiffre.', true); return; }
  $('#composing').hidden = false; $('#results').innerHTML = ''; $('#resultsEmpty').hidden = true;
  $('#genBtn').disabled = true;
  clearTimeout(genTimer);
  genTimer = setTimeout(() => {
    try { renderResults(Engine.generate(opts, 8)); }
    catch (err) { console.error(err); toast('Une erreur est survenue. Réessayez.', true); }
    $('#composing').hidden = true; $('#genBtn').disabled = false;
    $('#genBtn').textContent = '✦ Générer 8 nouveaux pseudos';
  }, 450);
}
$('#genForm').onsubmit = e => { e.preventDefault(); runGeneration(); };
$('#results').onclick = e => {
  const c = e.target.closest('[data-copy]'); if (c) return copy(c.dataset.copy);
  const f = e.target.closest('[data-fav]'); if (f) { toggleFav(f.dataset.fav); renderResultsState(); }
};
function renderResultsState() {
  const favs = favSet();
  $$('#results [data-fav]').forEach(b => {
    const on = favs.has(b.dataset.fav);
    b.classList.toggle('on', on); b.textContent = on ? '♥' : '♡';
  });
}

/* ============ Favoris ============ */
function toggleFav(name) {
  let f = store.get();
  if (f.includes(name)) { f = f.filter(x => x !== name); toast('Retiré des favoris'); }
  else { f.unshift(name); toast('Ajouté aux favoris ♥'); }
  store.set(f); updateFavCount(); renderFavs();
}
function updateFavCount() { $('#favCount').textContent = store.get().length; }
function renderFavs() {
  const f = store.get();
  $('#favEmpty').hidden = f.length > 0;
  $('#clearFavs').hidden = f.length === 0;
  $('#favList').innerHTML = f.map(n => `
    <div class="res"><span class="name">${esc(n)}</span><span class="acts">
      <button class="icon-btn" data-copy="${esc(n)}" aria-label="Copier">⧉</button>
      <button class="icon-btn on" data-fav="${esc(n)}" aria-label="Retirer des favoris">♥</button></span></div>`).join('');
}
$('#favList').onclick = e => {
  const c = e.target.closest('[data-copy]'); if (c) return copy(c.dataset.copy);
  const f = e.target.closest('[data-fav]'); if (f) { toggleFav(f.dataset.fav); renderResultsState(); }
};
$('#clearFavs').onclick = () => {
  if (confirm('Supprimer tous vos favoris ?')) { store.set([]); updateFavCount(); renderFavs(); renderResultsState(); toast('Favoris vidés'); }
};

/* ============ Accueil + Explorer ============ */
$('#homeUniverses').innerHTML = UNIVERSES.map(u => `<button class="chip" style="--c:${u.c}" data-explore="${u.id}">${u.ic} ${u.t}</button>`).join('');
$('#exploreGrid').innerHTML = UNIVERSES.map(u => `
  <button class="uni" style="--c:${u.c}" data-explore="${u.id}">
    <span class="ic">${u.ic}</span><h3>${u.t}</h3><p>${u.d}</p><span class="go">Composer dans cet univers →</span>
  </button>`).join('');
document.addEventListener('click', e => {
  const b = e.target.closest('[data-explore]'); if (!b) return;
  state.universe = b.dataset.explore; renderChoices(); show('generator'); runGeneration();
});

/* ============ Outils ============ */
$('#toolTabs').onclick = e => {
  const b = e.target.closest('[data-tool]'); if (!b) return;
  $$('#toolTabs .pill').forEach(p => p.classList.toggle('active', p === b));
  $$('.tool').forEach(t => t.hidden = t.id !== 'tool-' + b.dataset.tool);
};
function cellsHTML(cats) {
  return Object.entries(cats).map(([k, v]) => `<div class="cat"><h4>${k}</h4><div class="cells">${[...v].map(s => s.trim() ? `<button class="cell" data-copy="${s}">${s}</button>` : '').join('')}</div></div>`).join('');
}
document.addEventListener('click', e => {
  const c = e.target.closest('.cell[data-copy], .row [data-copy]'); if (c) copy(c.dataset.copy);
});
$('#symbolBox').innerHTML = cellsHTML({
  'Étoiles': '★☆✦✧✩✪✫✬✭✮✯⚝✶✷✸✹', 'Flèches': '→←↑↓↔↕⇒⇐⇑⇓➤➜➔➳↯↺↻', 'Cœurs': '♥♡❤❣❥❦❧☙♠♣♦♢',
  'Décor': '◈◆◇◉○●◌◍◎♔♕♖♗♘♙☾☽☼☀☁☂', 'Mathématiques': '×÷±∞≈≠≤≥√∑∏∆∇∂∫', 'Ponctuation': '•·°«»‹›¦§¶†‡※‣⁂', 'Séparateurs': '|¦‖─━═╌╍│┃░▒▓▪▫■□▲△▼▽'
});
$('#emojiBox').innerHTML = cellsHTML({
  'Visages': '😀😎🥳😍🤩😈👻🤖👽🥺😴🤓😏🙃😇🤠',
  'Animaux': '🐺🦊🐱🐼🐲🦁🐉🦅🦋🐙🐧🦄🐢🐍🦉🐰',
  'Nature': '🌸🌙⭐🔥❄️🌊⚡🍀🌈☀️🌿🍂🌋🌍☁️🌵',
  'Objets': '🎮🎧🎬🎤🎸⚔️🛡️💎👑🔮🧪🚀🏆📸💻🗝️',
  'Cœurs': '❤️🧡💛💚💙💜🖤🤍🤎💖💫✨💥💢💤🎀'
});
// Texte stylé
const range = (u, l, d) => ({ u, l, d });
const MATH = {
  'Gras': range(0x1D400, 0x1D41A, 0x1D7CE), 'Italique gras': range(0x1D468, 0x1D482),
  'Script gras': range(0x1D4D0, 0x1D4EA), 'Gothique gras': range(0x1D56C, 0x1D586),
  'Sans-serif gras': range(0x1D5D4, 0x1D5EE, 0x1D7EC), 'Machine à écrire': range(0x1D670, 0x1D68A, 0x1D7F6),
  'Cerclé': range(0x24B6, 0x24D0), 'Pleine largeur': range(0xFF21, 0xFF41, 0xFF10)
};
const SMALLCAPS = 'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢ';
function styleText(t, r) {
  return [...t].map(ch => {
    const c = ch.charCodeAt(0);
    if (c >= 65 && c <= 90) return String.fromCodePoint(r.u + c - 65);
    if (c >= 97 && c <= 122) return String.fromCodePoint(r.l + c - 97);
    if (c >= 48 && c <= 57 && r.d) return String.fromCodePoint(r.d + c - 48);
    return ch;
  }).join('');
}
function allStyles(txt) {
  const t = txt.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const res = Object.entries(MATH).map(([k, r]) => [k, styleText(t, r)]);
  res.push(['Petites capitales', [...t.toLowerCase()].map(c => c >= 'a' && c <= 'z' ? SMALLCAPS[c.charCodeAt(0) - 97] : c).join('')]);
  res.push(['Espacé', [...t].join(' ')]);
  res.push(['Barré', [...t].map(c => c + '\u0336').join('')]);
  res.push(['Souligné', [...t].map(c => c + '\u0332').join('')]);
  return res;
}
function rowsHTML(list) {
  return list.map(([k, v]) => `<div class="row"><span><small style="color:var(--mute)">${k}</small><br>${esc(v)}</span><button class="btn ghost" data-copy="${esc(v)}">Copier</button></div>`).join('');
}
$('#fancyInput').oninput = e => {
  const v = e.target.value.trim();
  $('#fancyOut').innerHTML = v ? rowsHTML(allStyles(v)) : '<p>Saisissez un texte pour voir les variantes.</p>';
};
$('#fancyOut').innerHTML = '<p>Saisissez un texte pour voir les variantes.</p>';
// Mot de passe
const PW = { up: 'ABCDEFGHJKLMNPQRSTUVWXYZ', low: 'abcdefghijkmnopqrstuvwxyz', num: '23456789', sym: '!@#$%^&*-_+=?' };
function secureInt(n) { const a = new Uint32Array(1); const lim = Math.floor(2 ** 32 / n) * n; do crypto.getRandomValues(a); while (a[0] >= lim); return a[0] % n; }
function genPwd() {
  const sets = [['pwdUp', 'up'], ['pwdLow', 'low'], ['pwdNum', 'num'], ['pwdSym', 'sym']].filter(([id]) => $('#' + id).checked).map(([, k]) => PW[k]);
  if (!sets.length) { toast('Activez au moins un type de caractères.', true); return; }
  const len = Math.max(+$('#pwdLen').value, sets.length), all = sets.join('');
  const out = sets.map(s => s[secureInt(s.length)]);
  while (out.length < len) out.push(all[secureInt(all.length)]);
  for (let i = out.length - 1; i > 0; i--) { const j = secureInt(i + 1);[out[i], out[j]] = [out[j], out[i]]; }
  $('#pwdOut').textContent = out.join('');
}
$('#pwdGen').onclick = genPwd;
$('#pwdLen').oninput = e => { $('#pwdLenVal').textContent = e.target.value; genPwd(); };
$('#pwdCopy').onclick = () => { const v = $('#pwdOut').textContent; v && v !== '—' ? copy(v) : toast('Générez d\'abord un mot de passe.', true); };
['pwdUp', 'pwdLow', 'pwdNum', 'pwdSym'].forEach(id => $('#' + id).onchange = genPwd);
// Styliser un pseudo
const DECOS = [['✦', '✦'], ['★', '★'], ['◈', '◈'], ['『', '』'], ['【', '】'], ['꧁', '꧂'], ['⚔ ', ' ⚔'], ['•', '•'], ['☾ ', ' ☽'], ['▌', '▐']];
$('#decorInput').oninput = e => {
  const v = e.target.value.trim();
  if (!v) { $('#decorOut').innerHTML = '<p>Entrez votre pseudo pour obtenir des variantes.</p>'; return; }
  const l = [...DECOS.map(([a, b]) => ['Décoré', a + v + b]), ['Alterné', [...v].map((c, i) => i % 2 ? c.toLowerCase() : c.toUpperCase()).join('')],
    ['Leet', v.replace(/a/gi, '4').replace(/e/gi, '3').replace(/o/gi, '0').replace(/i/gi, '1')],
    ['Souligné bas', v.replace(/\s+/g, '_')], ...allStyles(v).slice(0, 4)];
  $('#decorOut').innerHTML = rowsHTML(l);
};
$('#decorOut').innerHTML = '<p>Entrez votre pseudo pour obtenir des variantes.</p>';
// Testeur
$('#testInput').oninput = e => {
  const v = e.target.value.trim(), out = $('#testOut');
  if (!v) { out.innerHTML = '<p>Saisissez un pseudo pour l\'analyser.</p>'; return; }
  const digits = (v.match(/\d/g) || []).length, syms = (v.match(/[^\p{L}\p{N}]/gu) || []).length;
  const pron = Engine.isPronounceable(norm(v));
  const bad = /[^aeiouy\W\d_]{4,}/i.test(v) || /(.)\1{2,}/.test(v);
  const lenScore = v.length >= 5 && v.length <= 14 ? 100 : v.length < 5 ? 50 : Math.max(20, 100 - (v.length - 14) * 10);
  const read = Math.max(10, 100 - digits * 10 - syms * 12 - (bad ? 30 : 0));
  const pr = pron ? 90 : 35;
  const appearance = /^[A-Z][a-z]+([A-Z][a-z]+)*\d{0,3}$/.test(v) ? 'Élégant (CamelCase)' : v === v.toLowerCase() ? 'Minimaliste (minuscules)' : v === v.toUpperCase() ? 'Percutant (majuscules)' : 'Mixte';
  const m = (t, val, sc) => `<div class="metric"><b>${t}</b><strong>${val}</strong>${sc != null ? `<div class="bar"><i style="width:${sc}%"></i></div>` : ''}</div>`;
  out.innerHTML = m('Longueur', v.length + ' caractères — ' + (v.length < 5 ? 'très court' : v.length <= 14 ? 'idéal' : 'long'), lenScore)
    + m('Lisibilité', read >= 75 ? 'Excellente' : read >= 50 ? 'Correcte' : 'Difficile', read)
    + m('Prononciation', pron ? 'Facile à dire' : 'Délicate', pr)
    + m('Chiffres', digits ? digits + ' présent(s)' : 'Aucun')
    + m('Symboles', syms ? syms + ' présent(s)' : 'Aucun')
    + m('Apparence', appearance);
};
$('#testOut').innerHTML = '<p>Saisissez un pseudo pour l\'analyser.</p>';

/* ============ Démarrage ============ */
renderChoices(); syncLen(); updateFavCount(); renderFavs(); genPwd(); show('home');