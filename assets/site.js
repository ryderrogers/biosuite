/* Biosuite — shared behavior. No dependencies. */

/* ===== ANALYTICS =====
   Google Analytics stays OFF until a Measurement ID (G-XXXXXXXXXX) is pasted below.
   BEFORE turning it on, update /privacy/ (the "Analytics and cookies" section),
   because GA sets cookies and the policy currently says the site sets none. */
window.BIOSUITE_GA_ID = "";
(function () {
  var id = window.BIOSUITE_GA_ID;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { dataLayer.push(arguments); };
  if (!id) return;
  var g = document.createElement('script');
  g.async = true; g.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
  document.head.appendChild(g);
  gtag('js', new Date());
  gtag('config', id);
})();

(function () {
  function track(name, params) { if (window.BIOSUITE_GA_ID && window.gtag) gtag('event', name, params || {}); }

  /* Mobile menu */
  var btn = document.querySelector('.menu-btn'), menu = document.getElementById('menu');
  if (btn && menu) {
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      menu.hidden = open;
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); btn.focus(); }
    });
  }

  /* Reservation: Stripe link only works after the terms box is checked */
  var agree = document.getElementById('agree'), pay = document.getElementById('stripe-btn'), hint = document.getElementById('agree-hint');
  if (agree && pay) {
    var url = pay.getAttribute('data-href');
    var sync = function () {
      if (agree.checked) {
        pay.setAttribute('href', url);
        pay.removeAttribute('aria-disabled');
        pay.classList.remove('is-disabled');
        if (hint) hint.textContent = 'You’ll finish on Stripe’s secure checkout.';
      } else {
        pay.removeAttribute('href');
        pay.setAttribute('aria-disabled', 'true');
        pay.classList.add('is-disabled');
        if (hint) hint.textContent = 'Check the box above to continue.';
      }
    };
    agree.addEventListener('change', function () { sync(); if (agree.checked) track('terms_checked', {}); });
    pay.addEventListener('click', function (e) {
      if (!agree.checked) { e.preventDefault(); agree.focus(); return; }
      track('begin_checkout', { currency: 'USD', value: 1000, items: [{ item_name: 'Biosuite Reservation' }] });
    });
    sync();
  }

  /* Conversion events (no-ops while analytics is off) */
  document.querySelectorAll('a[href="/reserve/"]').forEach(function (a) {
    a.addEventListener('click', function () { track('reserve_cta_click', { label: (a.textContent || '').trim(), page: location.pathname }); });
  });
  document.querySelectorAll('a[href^="tel:"]').forEach(function (a) { a.addEventListener('click', function () { track('phone_click', {}); }); });
  document.querySelectorAll('a[href^="/store/"]').forEach(function (a) { a.addEventListener('click', function () { track('store_click', {}); }); });
  document.querySelectorAll('.faq details').forEach(function (d) {
    d.addEventListener('toggle', function () { if (d.open) track('faq_open', { question: (d.querySelector('summary').textContent || '').trim() }); });
  });

  /* Inquiry form -> Formspree (same endpoint as before), mail-client fallback */
  var form = document.querySelector('.form');
  if (form) {
    var FORMSPREE_URL = 'https://formspree.io/f/xyklyadv';
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      track('generate_lead', { form: 'inquiry' });
      var v = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
      var name = v('name'), email = v('email'), phone = v('phone'), interest = v('interest'), budget = v('budget'), message = v('message');
      var subject = 'Biosuite Inquiry — ' + name;
      var body = 'Biosuite inquiry via biosuiteusa.com\n\nName: ' + name + '\nEmail: ' + email + '\nPhone: ' + (phone || 'Not provided') + '\nInterest: ' + interest + '\nConfiguration: ' + (budget || 'Not provided') + '\n\n---\n' + (message || '(No message)');
      var submit = form.querySelector('button[type="submit"]');
      var box = document.getElementById('inquirySuccess');
      var done = function (ok) {
        form.style.display = 'none';
        box.innerHTML = ok
          ? 'Thank you. I’ll reply within two business days. — Ryder'
          : 'Your mail app should have opened. If not, write directly to <a href="mailto:ryder@hpcla.com">ryder@hpcla.com</a>.';
        box.hidden = false;
        box.focus();
      };
      submit.disabled = true; submit.textContent = 'Sending…';
      var payload = JSON.stringify({ _subject: subject, _replyto: email, form_type: 'Biosuite inquiry', name: name, email: email, phone: phone || 'Not provided', interest: interest, configuration: budget || 'Not provided', message: message || '(No message)', page: location.href });
      var send = function (attempt) {
        var ctl = ('AbortController' in window) ? new AbortController() : null;
        var timer = ctl ? setTimeout(function () { ctl.abort(); }, 10000) : null;
        return fetch(FORMSPREE_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: payload, signal: ctl ? ctl.signal : undefined })
          .then(function (r) { clearTimeout(timer); if (!r.ok) throw new Error('formspree ' + r.status); })
          .catch(function (err) {
            clearTimeout(timer);
            if (attempt < 2) return new Promise(function (res) { setTimeout(res, 1500); }).then(function () { return send(attempt + 1); });
            throw err;
          });
      };
      send(1).then(function () { done(true); }).catch(function () {
        location.href = 'mailto:ryder@hpcla.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        setTimeout(function () { done(false); }, 600);
      });
    });
  }
})();
