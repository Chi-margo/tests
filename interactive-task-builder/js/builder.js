// Конструктор: выбор типа → форма редактора → предпросмотр → сохранение в localStorage
(() => {
  if (Q.get('play') || Q.get('mix')) return;
  $('nav a[data-k=new]').classList.add('on');

  const HINT = { single: 'Один верный вариант', multi: 'Несколько верных вариантов', match: 'Пары «термин — значение»', seq: 'Правильный порядок шагов', cat: 'Элементы по категориям', fill: 'Слово на месте пропуска', bug: 'Строка с ошибкой в коде', sort: 'Значения по типам' };
  const NEW = {
    single: { items: [{ q: '', opts: ['', ''], ok: [0] }] },
    multi: { items: [{ q: '', opts: ['', '', ''], ok: [0] }] },
    match: { items: [{ a: '', b: '' }, { a: '', b: '' }] },
    seq: { items: ['', ''] },
    cat: { cats: ['', ''], items: [{ t: '', c: 0 }, { t: '', c: 1 }] },
    sort: { cats: ['', ''], items: [{ t: '', c: 0 }, { t: '', c: 1 }] },
    fill: { items: [{ t: '', ans: [''] }] },
    bug: { items: [{ lines: ['', ''], bad: 0, why: '' }] }
  };
  let d;

  const inp = (p, v, f, ph, tag = 'input') => { const i = el(tag); i.value = v; i.placeholder = ph; i.oninput = () => f(i.value); p.append(i); return i; };
  const btn = (p, t, f, c = 'btn ghost') => { const b = el('button', c, t); b.type = 'button'; b.onclick = f; p.append(b); return b; };
  const card = (p, t, rm) => { const c = el('div', 'ecard', `<h4>${t}</h4>`); if (rm) btn(c, '×', rm, 'x'); p.append(c); return c; };
  const draw = () => { const b = $('#items'); b.innerHTML = ''; E[d.type](b); };

  const E = {};
  E.single = E.multi = b => {
    const multi = d.type == 'multi';
    d.items.forEach((it, qi) => {
      const c = card(b, 'Вопрос ' + (qi + 1), d.items.length > 1 && (() => { d.items.splice(qi, 1); draw(); }));
      inp(c, it.q, v => it.q = v, 'Текст вопроса');
      it.opts.forEach((o, oi) => {
        const r = el('div', 'row2'), cb = el('input');
        cb.type = multi ? 'checkbox' : 'radio'; cb.name = 'ok' + qi; cb.checked = it.ok.includes(oi); cb.title = 'Верный ответ';
        cb.onchange = () => { it.ok = multi ? (cb.checked ? [...it.ok, oi] : it.ok.filter(x => x != oi)) : [oi]; };
        r.append(cb); inp(r, o, v => it.opts[oi] = v, 'Вариант ответа');
        it.opts.length > 2 && btn(r, '×', () => { it.opts.splice(oi, 1); it.ok = it.ok.filter(x => x != oi).map(x => x > oi ? x - 1 : x); draw(); }, 'x');
        c.append(r);
      });
      btn(c, '+ Вариант', () => { it.opts.push(''); draw(); });
    });
    btn(b, '+ Вопрос', () => { d.items.push({ q: '', opts: ['', ''], ok: [0] }); draw(); });
  };
  E.match = b => {
    d.items.forEach((p, i) => {
      const r = el('div', 'row2');
      inp(r, p.a, v => p.a = v, 'Термин'); inp(r, p.b, v => p.b = v, 'Соответствие');
      d.items.length > 2 && btn(r, '×', () => { d.items.splice(i, 1); draw(); }, 'x'); b.append(r);
    });
    btn(b, '+ Добавить пару', () => { d.items.push({ a: '', b: '' }); draw(); });
  };
  E.seq = b => {
    b.append(el('p', 'muted', 'Вводите шаги в правильном порядке — ученик увидит их перемешанными.'));
    d.items.forEach((t, i) => {
      const r = el('div', 'row2'); inp(r, t, v => d.items[i] = v, 'Шаг ' + (i + 1));
      d.items.length > 2 && btn(r, '×', () => { d.items.splice(i, 1); draw(); }, 'x'); b.append(r);
    });
    btn(b, '+ Добавить шаг', () => { d.items.push(''); draw(); });
  };
  E.cat = E.sort = b => {
    b.append(el('h4', '', 'Категории'));
    d.cats.forEach((n, i) => {
      const r = el('div', 'row2');
      inp(r, n, v => d.cats[i] = v, 'Название категории').onchange = draw;
      d.cats.length > 2 && btn(r, '×', () => { d.cats.splice(i, 1); d.items.forEach(x => { if (x.c == i) x.c = 0; else if (x.c > i) x.c--; }); draw(); }, 'x');
      b.append(r);
    });
    btn(b, '+ Категория', () => { d.cats.push(''); draw(); });
    b.append(el('h4', '', 'Элементы'));
    d.items.forEach((x, i) => {
      const r = el('div', 'row2'); inp(r, x.t, v => x.t = v, 'Элемент');
      const s = el('select', '', d.cats.map((n, k) => `<option value="${k}">${esc(n || 'Категория ' + (k + 1))}</option>`).join(''));
      s.value = x.c; s.onchange = () => x.c = +s.value; r.append(s);
      d.items.length > 1 && btn(r, '×', () => { d.items.splice(i, 1); draw(); }, 'x'); b.append(r);
    });
    btn(b, '+ Элемент', () => { d.items.push({ t: '', c: 0 }); draw(); });
  };
  E.fill = b => {
    d.items.forEach((x, i) => {
      const c = card(b, 'Предложение ' + (i + 1), d.items.length > 1 && (() => { d.items.splice(i, 1); draw(); }));
      inp(c, x.t, v => x.t = v, 'Текст; пропуск обозначьте четырьмя подчёркиваниями ____');
      inp(c, x.ans.join(', '), v => x.ans = v.split(',').map(s => s.trim()).filter(Boolean), 'Допустимые ответы через запятую');
    });
    btn(b, '+ Предложение', () => { d.items.push({ t: '', ans: [''] }); draw(); });
  };
  E.bug = b => {
    const x = d.items[0];
    const t = inp(b, x.lines.join('\n'), v => x.lines = v.split('\n'), 'Код: одна строка кода — одна строка поля', 'textarea'); t.rows = 6; t.className = 'mono';
    const n = inp(b, x.bad + 1, v => x.bad = (+v || 1) - 1, 'Номер строки с ошибкой'); n.type = 'number'; n.min = 1;
    inp(b, x.why, v => x.why = v, 'Пояснение: в чём ошибка');
  };

  const norm = t => t.type == 'bug' ? { ...t, items: [{ ...t.items[0], why: t.items[0].why.trim() }], title: t.title.trim() }
    : JSON.parse(JSON.stringify(t), (k, v) => typeof v == 'string' ? v.trim() : v);

  function validate(t) {
    if (!t.title) return 'Введите название задания.';
    const it = t.items;
    if (t.type == 'bug') { const x = it[0]; return x.lines.length < 2 || x.bad >= x.lines.length || !x.why ? 'Нужно минимум 2 строки кода, номер строки с ошибкой в их пределах и пояснение.' : ''; }
    if (t.type == 'fill') return it.some(x => !x.t.includes('____') || !x.ans.filter(Boolean).length) ? 'В каждом предложении нужен пропуск «____» и хотя бы один ответ.' : '';
    if (/(^|[\[,:{])""([\],}]|$)/.test(JSON.stringify({ i: it, c: t.cats }))) return 'Заполните все поля или удалите пустые.';
    if (t.type == 'single' || t.type == 'multi') return it.some(x => !x.ok.length) ? 'В каждом вопросе отметьте верный ответ.' : '';
    if (it.length < 2) return 'Добавьте минимум 2 элемента.';
    return '';
  }
  const say = (m, err) => { const s = $('#msg'); s.textContent = m; s.className = err ? 'err' : ''; };

  function start(type, task) {
    d = task || { id: 'u' + Date.now(), type, title: '', instr: '', level: 0, pick: 0, ...JSON.parse(JSON.stringify(NEW[type])) };
    $('#types').hidden = true; $('#form').hidden = false;
    $('#bt').textContent = (task ? 'Редактирование: ' : 'Новое задание: ') + TYPES[d.type];
    $('#f-title').value = d.title; $('#f-instr').value = d.instr || ''; $('#f-level').value = d.level; $('#f-pick').value = d.pick || 0;
    $('#pickw').hidden = ['seq', 'bug'].includes(d.type);
    draw();
  }

  Object.entries(TYPES).forEach(([k, v]) => { const b = el('button', 'type', `<b>${v}</b><span>${HINT[k]}</span>`); b.onclick = () => start(k); $('#types').append(b); });
  $('#f-level').innerHTML = LEVELS.map((v, i) => `<option value="${i}">${v}</option>`).join('');
  $('#f-title').oninput = e => d.title = e.target.value;
  $('#f-instr').oninput = e => d.instr = e.target.value;
  $('#f-level').onchange = e => d.level = +e.target.value;
  $('#f-pick').oninput = e => d.pick = Math.max(0, +e.target.value || 0);

  $$('.tabs button').forEach(b => b.onclick = () => {
    $$('.tabs button').forEach(x => x.classList.toggle('on', x == b));
    const p = b.dataset.m == 'p'; $('#ed').hidden = p; $('#pv').hidden = !p;
    if (p) { try { play([norm(d)], $('#pv')); } catch (e) { $('#pv').textContent = 'Заполните задание, чтобы увидеть предпросмотр.'; } }
  });

  $('#save').onclick = () => {
    const t = norm(d), e = validate(t);
    if (e) return say(e, 1);
    if (t.pick >= t.items.length) t.pick = 0;
    Store.save(t); location.href = 'index.html#mine';
  };

  const ed = Q.get('edit') && Store.get(Q.get('edit'));
  if (ed && isMine(ed)) start(ed.type, JSON.parse(JSON.stringify(ed)));
})();
