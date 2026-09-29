// Витрина заданий, плеер (выполнение), Drag & Drop
const R = {};
const chip = (t, d) => { const c = el('div', 'chip', esc(t)); c.draggable = true; Object.assign(c.dataset, d); return c; };

R.single = R.multi = (b, run) => {
  const multi = run.task.type == 'multi';
  run.items.forEach((it, qi) => {
    const q = el('div', 'q', `<h3>${esc(it.q)}</h3>`); q.dataset.i = qi;
    shuffle(it.opts.map((o, i) => [o, i])).forEach(([o, i]) =>
      q.append(el('label', 'opt', `<input type="${multi ? 'checkbox' : 'radio'}" name="q${run.k}_${qi}" value="${i}"><span>${esc(o)}</span>`)));
    q.append(el('p', 'fb')); b.append(q);
  });
};
R.match = (b, run) => {
  const pool = el('div', 'zone pool');
  shuffle(run.items.map((p, i) => i)).forEach(i => pool.append(chip(run.items[i].b, { i })));
  run.items.forEach((p, i) => { const r = el('div', 'row', `<b>${esc(p.a)}</b>`), s = el('div', 'zone slot'); s.dataset.i = i; r.append(s); b.append(r); });
  b.append(pool);
};
R.seq = (b, run) => {
  const z = el('div', 'zone list');
  shuffle(run.items.map((t, i) => i)).forEach(i => z.append(chip(run.items[i], { i })));
  b.append(z);
};
R.cat = R.sort = (b, run) => {
  const pool = el('div', 'zone pool'), cols = el('div', 'cols');
  shuffle(run.items).forEach(it => pool.append(chip(it.t, { c: it.c })));
  run.task.cats.forEach((n, c) => { const z = el('div', 'zone'), col = el('div', 'col', `<h4>${esc(n)}</h4>`); z.dataset.c = c; col.append(z); cols.append(col); });
  b.append(pool, cols);
};
R.fill = (b, run) => run.items.forEach((it, i) => {
  const p = el('p', 'fq'), [a, z] = it.t.split('____'), inp = el('input', 'blank');
  inp.dataset.i = i; inp.autocomplete = 'off';
  p.append(a, inp, z || ''); b.append(p);
});
R.bug = (b, run) => {
  const it = run.items[0], c = el('div', 'code');
  it.lines.forEach((l, i) => {
    const x = el('button', 'line', `<i>${i + 1}</i>${esc(l)}`);
    x.onclick = () => { $$('.line', c).forEach(y => y.classList.remove('sel')); x.classList.add('sel'); };
    c.append(x);
  });
  b.append(c);
};

// Drag & Drop (делегирование событий на контейнере)
let drag = null;
function dnd(w) {
  w.addEventListener('dragstart', e => { const c = e.target.closest && e.target.closest('.chip'); if (!c) return; drag = c; c.classList.add('drag'); e.dataTransfer.setData('text', 'x'); });
  w.addEventListener('dragend', () => { if (drag) drag.classList.remove('drag'); $$('.over', w).forEach(z => z.classList.remove('over')); drag = null; });
  w.addEventListener('dragover', e => {
    const z = drag && e.target.closest('.zone'); if (!z) return;
    e.preventDefault(); $$('.over', w).forEach(x => x != z && x.classList.remove('over')); z.classList.add('over');
  });
  w.addEventListener('drop', e => {
    const z = drag && e.target.closest('.zone'); if (!z) return;
    e.preventDefault(); const d = drag, from = d.parentNode;
    if (z.classList.contains('list')) {
      const t = e.target.closest('.chip');
      if (t && t != d) { const r = t.getBoundingClientRect(); z.insertBefore(d, e.clientY < r.top + r.height / 2 ? t : t.nextSibling); }
      else if (!t) z.append(d);
      z.classList.add('moved');
    } else {
      const o = z.classList.contains('slot') && z.querySelector('.chip');
      if (o && o != d) from.append(o);
      z.append(d);
    }
    d.classList.add('drop'); setTimeout(() => d.classList.remove('drop'), 300);
  });
}

// Плеер: запускает одно или несколько заданий (режим «микс»)
function play(tasks, host) {
  host.innerHTML = '';
  const w = el('div', '', '<div class="bar top"><i></i></div>'); host.append(w);
  const runs = tasks.map((t, k) => ({ task: t, k, items: t.pick > 0 && !['bug', 'seq'].includes(t.type) ? shuffle(t.items).slice(0, t.pick) : t.items }));
  const boxes = runs.map(r => {
    const s = el('section', 'sec', `<h2>${esc(r.task.title)}</h2><p class="muted">${esc(r.task.instr || '')}</p>`), b = el('div', 'box');
    R[r.task.type](b, r); s.append(b); w.append(s); return b;
  });
  const a = el('div', 'actions'), ck = el('button', 'btn', 'Проверить'), re = el('button', 'btn ghost', 'Начать заново');
  a.append(ck, re); w.append(a); dnd(w);

  const prog = () => {
    const n = s => $$(s, w);
    const tot = n('.q,.blank,.slot,.chip[data-c],.code,.list').length;
    const dn = n('.q').filter(q => $('input:checked', q)).length + n('.blank').filter(i => i.value.trim()).length + n('.slot').filter(s => $('.chip', s)).length
      + n('.zone:not(.pool) .chip[data-c]').length + n('.line.sel').length + n('.list.moved').length;
    $('.top i', w).style.width = (tot ? dn / tot * 100 : 100) + '%';
  };
  ['input', 'click', 'drop'].forEach(e => w.addEventListener(e, () => setTimeout(prog, 0)));
  ck.onclick = () => {
    let ok = 0, total = 0;
    runs.forEach((r, i) => { const x = C[r.task.type](boxes[i], r); ok += x.ok; total += x.total; });
    w.classList.add('locked'); ck.disabled = true; $('.top i', w).style.width = '100%';
    showResult(w, ok, total);
  };
  re.onclick = () => play(tasks, host);
}

// «Случайный микс»: по одному заданию из нескольких разных типов
function mix() {
  const g = {};
  Store.all().forEach(t => (g[t.type] = g[t.type] || []).push(t));
  return shuffle(Object.keys(g)).slice(0, 4).map(k => shuffle(g[k])[0]);
}

// Витрина
function showcase() {
  const grid = $('#grid');
  $('#ft').innerHTML = '<option value="">Все типы</option>' + Object.entries(TYPES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
  $('#fl').innerHTML = '<option value="">Любая сложность</option>' + LEVELS.map((v, i) => `<option value="${i}">${v}</option>`).join('');
  const draw = () => {
    const mine = location.hash == '#mine', all = location.hash == '#all';
    $('#lt').textContent = mine ? 'Мои задания' : 'Все задания';
    $('.hero').hidden = mine || all;
    $$('nav a').forEach(a => a.classList.toggle('on', a.dataset.k == (mine ? 'mine' : all ? 'all' : 'home')));
    const s = $('#q').value.toLowerCase(), t = $('#ft').value, l = $('#fl').value;
    const list = Store.all().filter(x => (!mine || isMine(x)) && x.title.toLowerCase().includes(s) && (!t || x.type == t) && (l === '' || x.level == l));
    grid.innerHTML = '';
    list.forEach((x, i) => {
      const c = el('article', 'card', `<h3>${esc(x.title)}</h3><div class="tags"><span class="tag">${TYPES[x.type]}</span><span class="tag lv${x.level}">${LEVELS[x.level]}</span><span class="tag">${size(x)} эл.</span></div>`);
      c.style.animationDelay = i * 40 + 'ms';
      const a = el('div', 'acts', `<a class="btn" href="builder.html?play=${x.id}">Начать</a>`);
      if (isMine(x)) {
        a.insertAdjacentHTML('beforeend', `<a class="btn ghost" href="builder.html?edit=${x.id}">Изменить</a>`);
        const d = el('button', 'btn ghost', 'Удалить');
        d.onclick = () => { if (confirm('Удалить задание «' + x.title + '»?')) { Store.del(x.id); draw(); } };
        a.append(d);
      }
      c.append(a); grid.append(c);
    });
    $('#empty').hidden = list.length > 0;
  };
  $('.tools').addEventListener('input', draw); $('.tools').addEventListener('change', draw);
  addEventListener('hashchange', draw); draw();
}

// Инициализация по странице
const Q = new URLSearchParams(location.search);
if ($('#grid')) showcase();
if ($('#player') && (Q.get('play') || Q.get('mix'))) {
  const isMix = !!Q.get('mix'), ts = isMix ? mix() : [Store.get(Q.get('play'))].filter(Boolean);
  $('#editor').hidden = true; $('#player').hidden = false;
  $('#ph').textContent = isMix ? 'Случайный микс' : '';
  ts.length ? play(ts, $('#pbox')) : ($('#pbox').textContent = 'Задание не найдено.');
}
