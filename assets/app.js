/* ==========================================================================
   АйДа! Белорецк — прототип. Без Битрикс24: единственный канал заявки — телефон.
   Скрипт собирает состав группы, проверяет бизнес-правила и формирует
   «памятку для звонка», чтобы человек звонил с готовыми данными.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- 1. Данные: цены и слоты (в демо — статичные, в проде — из CMS) ---------- */
  var PRICES = {
    // 6 — мест в одном квадроцикле, а не лимит на день.
    // Машин на день можно поставить несколько, выезды идут параллельно.
    quad: {
      adult: 3650, child: 3000, perMachine: 6,
      label: 'Ялангас с заброской на квадроцикле',
      sub: 'Полный день · сбор 07:45 · 6 мест в машине',
      adultLabel: 'Взрослый', childLabel: 'Ребёнок 5–12 лет'
    },
    // «Магнитогорские субботы» — та же квадро-программа, но в цену входит дорога
    // Магнитогорск — Белорецк и обратно (85 км в одну сторону). Поэтому она выше белорецкой.
    mg: {
      adult: 4500, child: 4000, perMachine: 6,
      label: 'Магнитогорские субботы — квадро на Ялангас',
      sub: 'Один день · выезд из Магнитогорска 06:45 · дорога включена',
      adultLabel: 'Взрослый', childLabel: 'Ребёнок 5–12 лет'
    },
    hike: {
      adult: 1500, child: 1500, typicalGroup: 15,
      label: 'Поход на Ялангас',
      sub: 'Один день · сбор в Белорецке · от 1 500 ₽',
      adultLabel: 'Взрослый', childLabel: 'Ребёнок от 5 лет'
    },
    aigir: {
      adult: 1500, child: 1500, typicalGroup: 15,
      label: 'Поход на Айгир',
      sub: 'Один день · Зубы Шурале · от 1 500 ₽',
      adultLabel: 'Взрослый', childLabel: 'Ребёнок от 7 лет'
    },
    yandyk: {
      adult: 1500, child: 1500, typicalGroup: 15,
      label: 'Поход на Яндык',
      sub: 'Один день · хребет Маярдак · от 1 500 ₽',
      adultLabel: 'Взрослый', childLabel: 'Ребёнок от 5 лет'
    }
  };

  var DEPARTURES = {
    // Квадро-тур: полный день 07:45 → 19:00, включая заброску и ужин в Отнурке.
    // seats — вместимость ОДНОГО квадроцикла. Если на дне два экипажа, на дату можно
    // поставить вторую машину, и мест становится 12. Это правило бизнеса, не вёрстка.
    quad: [
      { id: 'q-08-11', date: '2026-11-08', label: '8 ноября, вс', taken: 0, seats: 18, machines: 3, time: '07:45' },
      { id: 'q-15-11', date: '2026-11-15', label: '15 ноября, вс', taken: 5, seats: 12, machines: 2, time: '07:45' },
      { id: 'q-21-11', date: '2026-11-21', label: '21 ноября, сб', taken: 2, seats: 6, machines: 1, time: '07:45' },
      { id: 'q-28-11', date: '2026-11-28', label: '28 ноября, сб', taken: 4, seats: 6, machines: 1, time: '07:45' },
      { id: 'q-06-12', date: '2026-12-06', label: '6 декабря, вс', taken: 1, seats: 12, machines: 2, time: '07:45' }
    ],
    // «Магнитогорские субботы» — новый формат, выезд раз в месяц.
    // Цена выше белорецкой, потому что в неё входит дорога 85 км в одну сторону и обратно.
    mg: [
      { id: 'mg-21-11', date: '2026-11-21', label: '21 ноября, сб', taken: 2, seats: 6, machines: 1, time: '06:45', price: 4500, child: 4000 },
      { id: 'mg-19-12', date: '2026-12-19', label: '19 декабря, сб', taken: 0, seats: 12, machines: 2, time: '06:45', price: 4500, child: 4000 },
      { id: 'mg-16-01', date: '2027-01-16', label: '16 января, сб', taken: 0, seats: 6, machines: 1, time: '06:45', price: 4500, child: 4000 },
      { id: 'mg-20-02', date: '2027-02-20', label: '20 февраля, сб', taken: 0, seats: 12, machines: 2, time: '06:45', price: 4500, child: 4000 },
      { id: 'mg-20-03', date: '2027-03-20', label: '20 марта, сб', taken: 0, seats: 6, machines: 1, time: '06:45', price: 4500, child: 4000 }
    ],
    // Пешие маршруты: размер группы не ограничен жёстко — ставим столько, сколько запишется.
    // 15 — то, что было в среднем в этом сезоне, а не потолок.
    hike: [
      { id: 'h-14-11', date: '2026-11-14', label: '14 ноября, сб', taken: 4, seats: 20, time: '07:30' },
      { id: 'h-28-11', date: '2026-11-28', label: '28 ноября, сб', taken: 0, seats: 20, time: '07:30' },
      { id: 'h-12-12', date: '2026-12-12', label: '12 декабря, сб', taken: 7, seats: 20, time: '07:30' }
    ],
    aigir: [
      { id: 'a-21-11', date: '2026-11-21', label: '21 ноября, сб', taken: 3, seats: 20, time: '06:30' },
      { id: 'a-05-12', date: '2026-12-05', label: '5 декабря, сб', taken: 0, seats: 20, time: '06:30' },
      { id: 'a-19-12', date: '2026-12-19', label: '19 декабря, сб', taken: 6, seats: 20, time: '06:30' }
    ],
    yandyk: [
      { id: 'y-15-11', date: '2026-11-15', label: '15 ноября, вс', taken: 2, seats: 20, time: '08:00' },
      { id: 'y-29-11', date: '2026-11-29', label: '29 ноября, вс', taken: 0, seats: 20, time: '08:00' },
      { id: 'y-13-12', date: '2026-12-13', label: '13 декабря, вс', taken: 5, seats: 20, time: '08:00' }
    ]
  };

  var PHONE_TEXT = '+7 (XXX) XXX-XX-XX'; // ← владелец подставляет реальный номер
  var PHONE_HREF = 'tel:+70000000000';   // ← и здесь

  /* ---------- 2. Хелперы ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function money(n) { return n.toLocaleString('ru-RU') + ' ₽'; }
  function plural(n, one, few, many) {
    var a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    if (b === 1) return one;
    return many;
  }
  function toast(msg) {
    var t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.setAttribute('data-show', 'true');
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.setAttribute('data-show', 'false'); }, 2600);
  }

  /* ---------- 3. Header: прозрачный → непрозрачный ---------- */
  var header = $('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 40);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- 4. Мобильное меню ---------- */
  var mmenu = $('#mobile-menu');
  var burger = $('.burger');
  function setMenu(open) {
    if (!mmenu) return;
    mmenu.setAttribute('data-open', open ? 'true' : 'false');
    if (burger) burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) { var f = mmenu.querySelector('a,button'); if (f) f.focus(); }
  }
  if (burger) burger.addEventListener('click', function () { setMenu(true); });
  $$('[data-menu-close]').forEach(function (b) { b.addEventListener('click', function () { setMenu(false); }); });
  $$('#mobile-menu a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });

  /* ---------- 5. Горизонтальная лента выездов ---------- */
  $$('[data-rail]').forEach(function (railId) {
    var rail = document.getElementById(railId);
    if (!rail) return;
    var scope = rail.closest('section') || document;
    var prev = $('[data-rail-prev]', scope);
    var next = $('[data-rail-next]', scope);
    function step() { return Math.min(rail.clientWidth * 0.8, 360); }
    if (prev) prev.addEventListener('click', function () { rail.scrollBy({ left: -step(), behavior: 'smooth' }); });
    if (next) next.addEventListener('click', function () { rail.scrollBy({ left: step(), behavior: 'smooth' }); });
  });

  /* ---------- 6. Drawer бронирования ---------- */
  var drawer = $('#drawer');
  var overlay = $('#drawer-overlay');
  var state = { product: 'quad', departure: null, adults: 2, children: 0, open: false };
  var lastFocus = null;

  function currentDeparture() {
    return (DEPARTURES[state.product] || []).filter(function (d) { return d.id === state.departure; })[0] || null;
  }
  function freeSeats() {
    var d = currentDeparture();
    if (!d) return PRICES[state.product].perMachine || PRICES[state.product].typicalGroup || 6;
    return Math.max(0, d.seats - d.taken);
  }

  function openDrawer(product, departureId) {
    if (!drawer) return;
    state.product = product || 'quad';
    var list = DEPARTURES[state.product] || [];
    var firstOpen = list.filter(function (d) { return d.taken < d.seats; })[0];
    state.departure = departureId || (firstOpen ? firstOpen.id : (list[0] && list[0].id));
    var freeOnOpen = freeSeats();
    // не подставляем по умолчанию весь остаток мест: 1 взрослый, если свободно мало
    state.adults = freeOnOpen >= 3 ? 2 : 1;
    state.children = 0;
    state.open = true;
    lastFocus = document.activeElement;

    var p0 = PRICES[state.product] || PRICES.hike;
    $('#drawer-title').textContent = p0.label;
    $('#drawer-sub').textContent = p0.sub;

    renderDepartures();
    renderCounters();
    renderSummary();

    drawer.setAttribute('data-open', 'true');
    overlay.setAttribute('data-open', 'true');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { var c = $('#drawer .drawer__close'); if (c) c.focus(); }, 60);
  }

  function closeDrawer() {
    if (!drawer || !state.open) return;
    state.open = false;
    drawer.setAttribute('data-open', 'false');
    overlay.setAttribute('data-open', 'false');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function renderDepartures() {
    var sel = $('#field-departure');
    if (!sel) return;
    var list = DEPARTURES[state.product] || [];
    sel.innerHTML = '';
    list.forEach(function (d) {
      var left = Math.max(0, d.seats - d.taken);
      var o = document.createElement('option');
      o.value = d.id;
      o.textContent = d.label + ' · ' + d.time +
        (left === 0 ? ' — мест нет'
          : (d.machines && d.machines > 1 ? ' — ' + d.machines + ' ' + plural(d.machines,'машина','машины','машин') + ', свободно ' + left + ' из ' + d.seats
             : ' — свободно ' + left + ' из ' + d.seats));
      if (left === 0) o.disabled = true;
      if (d.id === state.departure) o.selected = true;
      sel.appendChild(o);
    });
  }


  /* ---------- Лента ближайших выездов: собирается из DEPARTURES ---------- */
  // Порядок продуктов в ленте и подписи, которых нет в данных
  var FEED_META = {
    quad:   { kind: 'Заброска', meta: 'Полный день 07:45–19:00 · сбор на автовокзале Белорецка · ужин в Отнурке', price: 'от 3 650 ₽', sub: 'взрослый · ребёнок от 3 000 ₽', page: 'kvadrocikly-yalangas.html' },
    hike:   { kind: 'Поход',    meta: '1 день · Ялангас, 1 297 м · старт в Белорецке',              price: 'от 1 500 ₽', sub: 'с человека · страховка включена', page: 'marshrut-yalangas.html' },
    aigir:  { kind: 'Поход',    meta: '1 день · Айгир, Зубы Шурале · 84 км от Белорецка',           price: 'от 1 500 ₽', sub: 'с человека · страховка включена', page: 'marshrut-aigir.html' },
    yandyk: { kind: 'Поход',    meta: '1 день · Яндык, 929 м · самый мягкий маршрут',                price: 'от 1 500 ₽', sub: 'с человека · страховка включена', page: 'marshrut-yandyk.html' }
  };

  var MONTHS = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  var WEEKDAYS = ['вс','пн','вт','ср','чт','пт','сб'];

  function dateCell(d) {
    var dt = new Date(d.date + 'T00:00:00');
    return { day: dt.getDate(), month: MONTHS[dt.getMonth()], wd: WEEKDAYS[dt.getDay()] };
  }

  function feedItems() {
    var out = [];
    Object.keys(DEPARTURES).forEach(function (key) {
      // лента главной — только белорецкие выезды; mg живёт на своей странице
      if (!FEED_META[key]) return;
      DEPARTURES[key].forEach(function (d) {
        out.push({ key: key, d: d });
      });
    });
    out.sort(function (a, b) { return a.d.date < b.d.date ? -1 : a.d.date > b.d.date ? 1 : 0; });
    return out;
  }

  function renderFeed(filter) {
    var rail = $('#rail-departures');
    if (!rail) return;
    var items = feedItems().filter(function (it) {
      if (filter === 'all') return true;
      if (filter === 'hike') return it.key !== 'quad';
      return it.key === 'quad';
    });

    rail.innerHTML = items.map(function (it) {
      var k = it.key, d = it.d, m = FEED_META[k], p = PRICES[k];
      var c = dateCell(d);
      var left = Math.max(0, d.seats - d.taken);
      var full = left === 0;
      var low = left > 0 && left <= 2;
      var state = full ? 'full' : low ? 'low' : 'ok';
      var machines = d.machines ? d.machines + ' ' + plural(d.machines, 'машина', 'машины', 'машин') + ' · ' : '';
      var placesText = full ? 'Мест нет' : machines + 'свободно ' + left + ' из ' + d.seats;
      var dots = '';
      if (d.seats <= 8) {
        dots = '<span class="places__dots" aria-hidden="true">';
        for (var i = 0; i < d.seats; i++) dots += '<i' + (i < d.taken ? ' class="is-taken"' : '') + '></i>';
        dots += '</span>';
      }
      var pct = Math.round(d.taken / d.seats * 100);
      var bar = d.seats > 8 ? '<span class="places__bar" aria-hidden="true"><span class="places__bar-fill" style="width:' + pct + '%"></span></span>' : '';
      var cta = full
        ? '<button class="btn btn--sm btn--ghost" data-book data-product="' + k + '" data-departure="' + d.id + '">В лист ожидания</button>'
        : '<button class="btn btn--sm" data-book data-product="' + k + '" data-departure="' + d.id + '">Забронировать</button>';

      return '<article class="depart" role="listitem" data-departure-id="' + d.id + '" data-key="' + k + '">' +
        '<div class="depart__top">' +
          '<span class="depart__date"><b>' + c.day + '</b> ' + c.month + ', ' + c.wd + '</span>' +
          '<span class="depart__kind depart__kind--' + k + '">' + m.kind + '</span>' +
        '</div>' +
        '<h3>' + p.label + '</h3>' +
        '<a class="depart__meta" href="' + m.page + '">' + m.meta + '</a>' +
        '<div class="depart__bottom">' +
          '<p class="places' + (d.seats > 8 ? ' places--bar' : '') + '" data-state="' + state + '">' + bar + dots +
            '<span data-places-text>' + placesText + '</span></p>' +
          '<p class="depart__price">' + m.price + ' <small>' + m.sub + '</small></p>' +
          '<div class="depart__cta">' + cta + '</div>' +
        '</div>' +
      '</article>';
    }).join('');

    // точки-индикатор под лентой
    renderRailDots();
  }

  function renderRailDots() {
    var rail = $('#rail-departures');
    var host = $('#rail-dots');
    if (!rail || !host) return;
    var pages = Math.ceil(rail.scrollWidth / rail.clientWidth);
    if (pages <= 1) { host.innerHTML = ''; return; }
    var idx = Math.round(rail.scrollLeft / rail.clientWidth);
    var html = '';
    for (var i = 0; i < pages; i++) html += '<i' + (i === idx ? ' class="is-on"' : '') + '></i>';
    host.innerHTML = html;
  }

  function renderCounters() {
    var p = PRICES[state.product];
    var dep = currentDeparture() || { seats: p.perMachine || p.typicalGroup || 6, taken: 0 };
    var free = freeSeats();
    var total = state.adults + state.children;
    var remaining = Math.max(0, free - total);

    $('#lbl-adult').textContent = p.adultLabel;
    $('#lbl-child').textContent = p.childLabel;
    $('#val-adults').textContent = state.adults;
    $('#val-children').textContent = state.children;

    $('#adults-minus').disabled = state.adults <= 1;
    $('#adults-plus').disabled = free === 0 || total >= free;
    $('#children-plus').disabled = free === 0 || total >= free;
    $('#children-minus').disabled = state.children <= 0;

    // ограничение по составу группы
    var alertBox = $('#group-alert');
    var groupBlock = $('#group-block');
    var summaryBlock = $('#summary-block');
    var fullMessage = $('#full-message');
    var isFull = free === 0;

    // при полной группе прячем состав и сумму — остаётся один экран «лист ожидания»
    if (groupBlock) groupBlock.hidden = isFull;
    if (summaryBlock) summaryBlock.hidden = isFull;
    if (fullMessage) fullMessage.hidden = !isFull;
    if (isFull) { alertBox.innerHTML = ''; alertBox.hidden = true; return; }
    alertBox.hidden = false;

    var html = '';
    if (total > free) {
      html = '<div class="alert alert--warn"><b>На эту дату свободно ' + free + ' ' + plural(free, 'место', 'места', 'мест') + '.</b> Уменьшите состав группы или выберите другую дату.</div>';
    } else if (remaining === 0) {
      html = '<div class="alert alert--info"><b>Вы забираете все свободные места — ' + total + ' из ' + dep.seats + '.</b> Позвоните, и мы придержим их за вами до выезда.</div>';
    } else if (free <= 2) {
      html = '<div class="alert alert--warn"><b>Осталось ' + free + ' ' + plural(free, 'место', 'места', 'мест') + ' из ' + dep.seats + '.</b> Бронь подтверждаем по телефону — места могут уйти.</div>';
    } else {
      html = '<div class="alert alert--info">Свободно <b>' + free + ' из ' + dep.seats + '</b>. Вы выбрали ' + total + ' ' + plural(total, 'место', 'места', 'мест') + ' — осталось ' + remaining + '.</div>';
    }
    alertBox.innerHTML = html;

    // правило «дети до 5 лет не допускаются» — только для квадроциклов
    var minorRow = $('#row-under5');
    if (minorRow) minorRow.hidden = !(state.product === 'quad' || state.product === 'mg');
  }

  function renderSummary() {
    var p = PRICES[state.product];
    var d = currentDeparture();
    var adultsSum = state.adults * p.adult;
    var childrenSum = state.children * p.child;
    var total = adultsSum + childrenSum;

    $('#sum-adults').textContent = state.adults + ' × ' + money(p.adult);
    $('#sum-children').textContent = state.children + ' × ' + money(p.child);
    $('#sum-adults-row').hidden = false;
    $('#sum-children-row').hidden = state.children === 0;
    $('#sum-total').textContent = money(total);
    $('#sum-date').textContent = d ? d.label + ', ' + d.time : '—';

    // «памятка для звонка»
    var parts = [];
    parts.push((PRICES[state.product] || PRICES.hike).label);
    if (d) parts.push(d.label + ' в ' + d.time);
    parts.push('взрослых: ' + state.adults);
    if (state.children > 0) parts.push('детей 5–12: ' + state.children);
    if (state.product === 'quad' || state.product === 'mg') {
      var perM = (PRICES[state.product].perMachine) || 6;
      var machinesNeed = Math.ceil((state.adults + state.children) / perM) || 1;
      parts.push(machinesNeed + ' ' + plural(machinesNeed, 'машина', 'машины', 'машин'));
    }
    parts.push('от ' + money(total));
    $('#call-script').textContent = parts.join(' · ');

    var full = freeSeats() === 0;
    var btn = $('#drawer-call');
    if (btn) {
      btn.innerHTML = full ? 'Позвонить и встать в лист ожидания' : 'Позвонить и забронировать';
    }

    // кнопка листа ожидания, если группа заполнена
    var fullBox = $('#full-message');
    if (fullBox && full) fullBox.hidden = false;
  }

  // Слушатели полей drawer
  document.addEventListener('change', function (e) {
    if (e.target && e.target.id === 'field-departure') {
      state.departure = e.target.value;
      var left = freeSeats();
      if (state.adults + state.children > left) {
        state.adults = Math.max(1, Math.min(state.adults, left));
        state.children = Math.max(0, left - state.adults);
      }
      renderCounters();
      renderSummary();
    }
  });

  document.addEventListener('click', function (e) {
    if (!e.target || !e.target.closest) return;
    var bookBtn = e.target.closest('[data-book]');
    if (bookBtn) {
      e.preventDefault();
      openDrawer(bookBtn.getAttribute('data-product') || 'quad', bookBtn.getAttribute('data-departure'));
      return;
    }
    var plus = e.target.closest('[data-plus]');
    var minus = e.target.closest('[data-minus]');
    if (plus) {
      var k = plus.getAttribute('data-plus');
      if (k === 'under5') return; // правило: недоступно
      if (state.adults + state.children < freeSeats()) state[k]++;
      renderCounters(); renderSummary();
      return;
    }
    if (minus) {
      var m = minus.getAttribute('data-minus');
      if (m === 'under5') return;
      var floor = m === 'adults' ? 1 : 0;
      state[m] = Math.max(floor, state[m] - 1);
      renderCounters(); renderSummary();
    }
  });

  // ── лента «Магнитогорские субботы» (отдельная страница) ──
  (function mgRail() {
    var rail = $('#rail-mg');
    if (!rail) return;
    var list = (DEPARTURES.mg || []).filter(function (d) { return d.date; });
    rail.innerHTML = list.map(function (d) {
      var c = dateCell(d);
      var left = Math.max(0, d.seats - d.taken);
      var full = left === 0;
      var machines = d.machines ? d.machines + ' ' + plural(d.machines, 'машина', 'машины', 'машин') + ' · ' : '';
      return '<article class="depart" role="listitem">' +
        '<div class="depart__top">' +
          '<span class="depart__date"><b>' + c.day + '</b> ' + c.month + ', ' + c.wd + '</span>' +
          '<span class="depart__kind">Из Магнитогорска</span>' +
        '</div>' +
        '<h3>Ялангас с заброской</h3>' +
        '<p class="depart__meta">06:45 автовокзал Магнитогорска · возврат к 21:00 · раз в месяц</p>' +
        '<div class="depart__bottom">' +
          '<p class="places" data-state="' + (full ? 'full' : left <= 2 ? 'low' : 'ok') + '">' +
            '<span>' + (full ? 'Мест нет' : machines + 'свободно ' + left + ' из ' + d.seats) + '</span></p>' +
          '<p class="depart__price">от 4 500 ₽ <small>взрослый · ребёнок от 4 000 ₽</small></p>' +
          '<div class="depart__cta"><a class="btn btn--sm' + (full ? ' btn--ghost' : '') + '" href="tel:+70000000000" data-phone>' +
            (full ? 'В лист ожидания' : 'Забронировать') + '</a></div>' +
        '</div>' +
      '</article>';
    }).join('');
  })();

  // ── высота полосы анонса: шапка сдвигается под неё ──
  (function promoHeight() {
    var bar = document.querySelector('.promo-bar');
    var head = document.querySelector('.site-header');
    function set() {
      if (bar) {
        document.documentElement.style.setProperty('--promo-h', Math.round(bar.getBoundingClientRect().height) + 'px');
      }
      // шапка измеряется без полосы, поэтому вычитаем её высоту из top
      if (head) {
        document.documentElement.style.setProperty('--head-h', Math.round(head.getBoundingClientRect().height) + 'px');
      }
    }
    set();
    window.addEventListener('resize', set);
    window.addEventListener('load', set);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(set);
  })();

  // ── лента выездов и фильтры ──
  (function initFeed() {
    var rail = $('#rail-departures');
    if (!rail) return;
    renderFeed('all');
    $$('[data-filter]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        $$('[data-filter]').forEach(function (c) {
          c.classList.toggle('is-active', c === chip);
          c.setAttribute('aria-selected', c === chip ? 'true' : 'false');
        });
        renderFeed(chip.getAttribute('data-filter'));
        rail.scrollTo({ left: 0, behavior: 'auto' });
      });
    });
    rail.addEventListener('scroll', function () { renderRailDots(); }, { passive: true });
    window.addEventListener('resize', renderRailDots);
  })();

  $$('[data-open-drawer]').forEach(function (b) {
    b.addEventListener('click', function (e) { e.preventDefault(); openDrawer(b.getAttribute('data-product') || 'quad'); });
  });
  if (overlay) overlay.addEventListener('click', closeDrawer);
  $$('[data-drawer-close]').forEach(function (b) { b.addEventListener('click', closeDrawer); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeDrawer(); setMenu(false); }
  });

  // Кнопка «показать номер» / «скопировать памятку»
  var copyBtn = $('#copy-script');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var txt = $('#call-script').textContent;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(function () { toast('Памятка скопирована'); }, function () { toast('Не удалось скопировать'); });
      } else {
        toast('Скопируйте вручную: ' + txt);
      }
    });
  }

  // Ссылки на телефон — подставляем единый номер
  $$('[data-phone]').forEach(function (a) { a.setAttribute('href', PHONE_HREF); });
  $$('[data-phone-text]').forEach(function (a) { a.textContent = PHONE_TEXT; });

  // Значение по умолчанию для подписи «свободно X из 5» на карточках ленты
  $$('[data-departure-id]').forEach(function (card) {
    var id = card.getAttribute('data-departure-id');
    var allDeps = [];
    Object.keys(DEPARTURES).forEach(function (k) { allDeps = allDeps.concat(DEPARTURES[k]); });
    var found = allDeps.filter(function (d) { return d.id === id; })[0];
    if (!found) return;
    var box = $('[data-places-text]', card);
    var dots = $('[data-places-dots]', card);
    var left = Math.max(0, found.seats - found.taken);
    // Точки рисуем только когда мест немного — 18 кружков в карточку не влезают.
    // Дальше показываем машины и шкалу заполненности: она читается с любого числа.
    var MAX_DOTS = 8;
    if (dots) {
      dots.innerHTML = '';
      if (found.seats <= MAX_DOTS) {
        for (var i = 0; i < found.seats; i++) {
          var el = document.createElement('i');
          if (i < found.taken) el.className = 'is-taken';
          dots.appendChild(el);
        }
      } else {
        // вместо точек — шкала во всю ширину, текст под ней в одну строку
        dots.style.display = 'none';
        var holder = box.parentNode;
        holder.classList.add('places--bar');
        var bar = document.createElement('span');
        bar.className = 'places__bar';
        var fill = document.createElement('span');
        fill.className = 'places__bar-fill';
        fill.style.width = Math.round((found.taken / found.seats) * 100) + '%';
        bar.appendChild(fill);
        holder.insertBefore(bar, holder.firstChild);
      }
    }
    if (box) {
      box.parentNode.setAttribute('data-state', left === 0 ? 'full' : left <= 2 ? 'low' : 'ok');
      var machines = found.machines
        ? found.machines + ' ' + plural(found.machines, 'машина', 'машины', 'машин') + ' · '
        : '';
      box.textContent = left === 0 ? 'Мест нет' : machines + 'свободно ' + left + ' из ' + found.seats;
    }
  });

  // Скролл-индикатор для «прокрутите» на мобильных
  $$('[data-scroll-hint]').forEach(function (el) {
    el.addEventListener('click', function () {
      var t = document.getElementById(el.getAttribute('data-scroll-hint'));
      if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

})();
