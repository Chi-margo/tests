// Типы заданий, данные, localStorage и общие утилиты
const TYPES = { single: 'Один ответ', multi: 'Несколько ответов', match: 'Сопоставление', seq: 'Последовательность', cat: 'Распределение', fill: 'Заполнение пропусков', bug: 'Найди ошибку', sort: 'Сортировка' };
const LEVELS = ['Легко', 'Средне', 'Сложно'];
const KEY = 'itb_tasks';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// Встроенные задания (по примерам из ТЗ)
const SEED = [
  { id: 's1', type: 'single', title: 'Методы массивов', level: 0, instr: 'Выберите один верный ответ.', items: [{ q: 'Какой метод добавляет элемент в конец массива JavaScript?', opts: ['push()', 'pop()', 'shift()', 'slice()'], ok: [0] }] },
  { id: 's2', type: 'multi', title: 'Типы данных JavaScript', level: 0, instr: 'Отметьте все верные варианты и нажмите «Проверить».', items: [{ q: 'Выберите типы данных JavaScript', opts: ['String', 'Number', 'Boolean', 'HTML'], ok: [0, 1, 2] }] },
  { id: 's3', type: 'match', title: 'Языки и технологии', level: 0, instr: 'Перетащите назначение к нужной технологии.', items: [{ a: 'HTML', b: 'Структура страницы' }, { a: 'CSS', b: 'Оформление' }, { a: 'JavaScript', b: 'Интерактивность' }, { a: 'SQL', b: 'Работа с данными' }] },
  { id: 's4', type: 'seq', title: 'Этапы разработки', level: 1, instr: 'Перетащите этапы в правильном порядке.', items: ['Анализ задачи', 'Проектирование', 'Разработка', 'Тестирование', 'Публикация'] },
  { id: 's5', type: 'cat', title: 'Frontend или Backend', level: 1, instr: 'Распределите технологии по категориям.', cats: ['Frontend', 'Backend'], items: [{ t: 'HTML', c: 0 }, { t: 'CSS', c: 0 }, { t: 'JavaScript', c: 0 }, { t: 'Node.js', c: 1 }, { t: 'PHP', c: 1 }, { t: 'Express', c: 1 }] },
  { id: 's6', type: 'fill', title: 'Объявление переменных', level: 0, instr: 'Впишите пропущенное слово.', items: [{ t: 'Для объявления переменной в JavaScript можно использовать ключевое слово ____.', ans: ['let', 'const', 'var'] }] },
  { id: 's7', type: 'bug', title: 'Найди ошибку в коде', level: 2, instr: 'Нажмите на строку с ошибкой.', items: [{ lines: ['const numbers = [1, 2, 3];', 'numbers.push(4);', 'console.log(number);'], bad: 2, why: 'Используется number вместо numbers.' }] },
  { id: 's8', type: 'sort', title: 'Типы значений', level: 1, instr: 'Перетащите значения к их типу.', cats: ['String', 'Number', 'Boolean'], items: [{ t: '"Hello"', c: 0 }, { t: '25', c: 1 }, { t: 'true', c: 2 }, { t: '"2026"', c: 0 }, { t: 'false', c: 2 }, { t: '3.14', c: 1 }] }
];

const Store = {
  mine() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } },
  all() { return SEED.concat(Store.mine()); },
  get(id) { return Store.all().find(t => t.id == id); },
  save(t) { const m = Store.mine(), i = m.findIndex(x => x.id == t.id); i < 0 ? m.push(t) : (m[i] = t); localStorage.setItem(KEY, JSON.stringify(m)); },
  del(id) { localStorage.setItem(KEY, JSON.stringify(Store.mine().filter(t => t.id != id))); }
};
const isMine = t => String(t.id)[0] == 'u';
const size = t => t.type == 'bug' ? t.items[0].lines.length : t.items.length;
