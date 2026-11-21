/* «Хрустальный Горизонт» — интерактив v5 (GitHub Pages: dtm752.github.io/test5) */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// Мобильное меню
const menuButton = $('.menu-toggle');
const nav = $('#main-nav');
menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  nav?.classList.toggle('is-open', open);
});
nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  nav.classList.remove('is-open');
  menuButton?.setAttribute('aria-expanded', 'false');
}));

// Кнопки «Записаться» подставляют маршрут в форму заявки
const tourSelect = $('#tour-select');
$$('[data-tour]').forEach(el => el.addEventListener('click', () => {
  if (tourSelect) {
    const v = el.dataset.tour;
    [...tourSelect.options].forEach(o => { if (o.text.toLowerCase().includes(v.toLowerCase())) tourSelect.value = o.value; });
  }
}));

// Обработка формы заявки (локально, без сервера — отправка через mailto-заготовку)
const form = $('.request-form');
form?.addEventListener('submit', e => {
  e.preventDefault();
  const data = new FormData(form);
  if (!data.get('name') || !data.get('contact') || !form.querySelector('[name=consent]').checked) {
    alert('Заполните имя, контакт и подтвердите согласие на обработку персональных данных.');
    return;
  }
  // Статический сайт не отправляет данные на сервер. Открываем почтовый клиент с готовым письмом.
  const subject = encodeURIComponent('Заявка на сайте: ' + (data.get('tour') || '—'));
  const body = encodeURIComponent(
    'Имя: ' + data.get('name') + '\nКонтакт: ' + data.get('contact') +
    '\nМаршрут: ' + (data.get('tour') || '—') + '\nКомментарий: ' + (data.get('comment') || '—')
  );
  window.location.href = 'mailto:hello@crystal-horizon.example?subject=' + subject + '&body=' + body;
  alert('Спасибо! Если почтовое приложение не открылось, напишите нам ВКонтакте или по телефону из блока контактов.');
});
