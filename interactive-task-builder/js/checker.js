// Проверка ответов: каждая функция читает состояние DOM, подсвечивает ошибки
// и возвращает { ok, total }
const C = {};

C.single = C.multi = (b, run) => {
  let ok = 0;
  $$('.q', b).forEach(q => {
    const it = run.items[q.dataset.i];
    const sel = $$('input:checked', q).map(i => +i.value);
    const good = sel.length == it.ok.length && it.ok.every(i => sel.includes(i));
    $$('.opt', q).forEach(o => {
      const inp = $('input', o), i = +inp.value;
      const k = inp.checked ? (it.ok.includes(i) ? 'good' : 'bad') : (it.ok.includes(i) && !good ? 'miss' : '');
      if (k) o.classList.add(k);
    });
    if (good) ok++; else $('.fb', q).textContent = 'Подсказка: верно — ' + it.ok.map(i => it.opts[i]).join(', ');
  });
  return { ok, total: run.items.length };
};

C.match = (b, run) => {
  let ok = 0; const miss = [];
  $$('.slot', b).forEach(s => {
    const c = $('.chip', s), p = run.items[s.dataset.i], good = c && c.dataset.i == s.dataset.i;
    if (c) c.classList.add(good ? 'good' : 'bad');
    if (good) ok++; else miss.push(p.a + ' — ' + p.b);
  });
  if (miss.length) b.append(el('p', 'fb', 'Подсказка: ' + esc(miss.join('; '))));
  return { ok, total: run.items.length };
};

C.seq = (b, run) => {
  let ok = 0;
  $$('.list .chip', b).forEach((c, i) => { const g = c.dataset.i == i; c.classList.add(g ? 'good' : 'bad'); if (g) ok++; });
  if (ok < run.items.length) b.append(el('p', 'fb', 'Верный порядок: ' + run.items.map(esc).join(' → ')));
  return { ok, total: run.items.length };
};

C.cat = C.sort = (b, run) => {
  let ok = 0; const miss = [];
  $$('.chip', b).forEach(c => {
    const z = c.parentNode, g = z.dataset.c != null && z.dataset.c == c.dataset.c;
    c.classList.add(g ? 'good' : 'bad');
    if (g) ok++; else miss.push(c.textContent + ' → ' + run.task.cats[c.dataset.c]);
  });
  if (miss.length) b.append(el('p', 'fb', 'Подсказка: ' + esc(miss.join('; '))));
  return { ok, total: run.items.length };
};

C.fill = (b, run) => {
  let ok = 0;
  $$('.blank', b).forEach(i => {
    const it = run.items[i.dataset.i];
    const good = it.ans.some(a => a.toLowerCase() == i.value.trim().toLowerCase());
    i.classList.add(good ? 'good' : 'bad');
    if (good) ok++; else i.parentNode.append(el('span', 'fb', ' Например: ' + esc(it.ans[0])));
  });
  return { ok, total: run.items.length };
};

C.bug = (b, run) => {
  const it = run.items[0], L = $$('.line', b), s = $('.line.sel', b);
  L[it.bad].classList.add('good');
  if (s && s != L[it.bad]) s.classList.add('bad');
  b.append(el('p', 'fb', 'Пояснение: ' + esc(it.why)));
  return { ok: s == L[it.bad] ? 1 : 0, total: 1 };
};

function showResult(host, ok, total) {
  const pct = total ? Math.round(ok / total * 100) : 0;
  const msg = pct >= 80 ? 'Отличный результат!' : pct >= 50 ? 'Неплохо. Ошибки выделены, подсказки — под заданиями.' : 'Стоит повторить: верные ответы указаны в подсказках.';
  const r = el('div', 'result', `<h2><span class="pct">0</span>%</h2><div class="bar"><i></i></div>
    <div class="stats"><div><b>${ok}</b>Правильно</div><div><b>${total - ok}</b>Ошибки</div><div><b>${pct}%</b>Результат</div></div>
    <p class="muted">${msg}</p>`);
  host.append(r);
  r.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const n = $('.pct', r), t0 = performance.now();
  (function f(t) { const p = Math.min(1, (t - t0) / 900); n.textContent = Math.round(pct * p); if (p < 1) requestAnimationFrame(f); })(t0);
  setTimeout(() => { $('.bar i', r).style.width = pct + '%'; }, 30);
  if (pct >= 80) confetti();
}

function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = el('canvas', 'confetti'); c.width = innerWidth; c.height = innerHeight; document.body.append(c);
  const x = c.getContext('2d');
  const P = Array.from({ length: 120 }, () => ({ x: Math.random() * c.width, y: -Math.random() * c.height / 2, v: 2 + Math.random() * 4, s: 6 + Math.random() * 6, r: Math.random() * 6, h: Math.random() * 360 }));
  let f = 0;
  (function d() {
    x.clearRect(0, 0, c.width, c.height);
    P.forEach(p => { p.y += p.v; p.x += Math.sin(p.y / 30); p.r += .1; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = `hsl(${p.h} 80% 65%)`; x.fillRect(0, 0, p.s, p.s * .6); x.restore(); });
    ++f < 220 ? requestAnimationFrame(d) : c.remove();
  })();
}
