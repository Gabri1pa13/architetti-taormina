/*
 * Modulo richiesta → CRM dello studio (ArchFlow).
 * Il modulo con [data-archflow] viene inviato al gestionale ArchFlow (unica destinazione della richiesta):
 * all'invio si mostra un messaggio di ringraziamento, oppure, se l'invio non riesce, un invito a usare
 * WhatsApp o l'email. Il consenso privacy (checkbox #privacy-ok, obbligatoria) è richiesto prima dell'invio.
 * Campi: [data-af="name"] nome e cognome, [data-af="contact"] email o telefono, [data-af="city"] zona,
 * [data-af="type"] tipo di intervento; gli altri campi compilati finiscono nella descrizione come "Etichetta: valore".
 */
(function () {
  var ARCHFLOW = 'https://gestionale-architetti.vercel.app/api/public/leads';
  var STUDIO = 'studio-4e';
  var TEXT = {
    it: {
      sending: 'Invio in corso…',
      contact: 'Inserisci un indirizzo email o un numero di telefono valido.',
      thanks: 'Grazie, ti ricontattiamo entro 24 ore.',
      wa: 'o scrivici su WhatsApp',
      error: 'Invio non riuscito. Scrivici su {wa} oppure a {email}.',
      waName: 'WhatsApp'
    },
    en: {
      sending: 'Sending…',
      contact: 'Please enter a valid email address or phone number.',
      thanks: 'Thank you, we will get back to you within 24 hours.',
      wa: 'or message us on WhatsApp',
      error: 'Sending failed. Please message us on {wa} or write to {email}.',
      waName: 'WhatsApp'
    }
  };

  function txt(s) { return String(s == null ? '' : s).trim(); }
  function cut(s, n) { s = txt(s); return s ? s.slice(0, n) : null; }
  function fieldValue(f) {
    if (f.tagName === 'SELECT') {
      if (!f.value) return '';
      var o = f.options[f.selectedIndex];
      return o ? txt(o.text) : '';
    }
    return txt(f.value);
  }
  function labelOf(form, f) {
    var l = f.id ? form.querySelector('label[for="' + f.id + '"]') : null;
    if (!l) { var g = f.closest('.form-group, .af-field'); l = g ? g.querySelector('label') : null; }
    return l ? txt(l.getAttribute('data-short') || l.textContent).replace(/\s*\*$/, '') : (f.id || 'Campo');
  }
  function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
  function isPhone(v) { return /^[+()\d][\d\s().\/-]*$/.test(v) && v.replace(/\D/g, '').length >= 6; }

  function setup(form) {
    var lang = (form.getAttribute('data-lang') || document.documentElement.lang || 'it').slice(0, 2) === 'en' ? 'en' : 'it';
    var T = TEXT[lang];
    var waUrl = form.getAttribute('data-wa') || '';
    var email = form.getAttribute('data-email') || '';
    var q = function (sel) { return form.querySelector(sel); };
    var nameEl = q('[data-af="name"]');
    var contactEl = q('[data-af="contact"]');
    var cityEl = q('[data-af="city"]');
    var typeEl = q('[data-af="type"]');
    var consent = form.querySelector('#privacy-ok');
    var button = q('[type="submit"]');
    var busy = false;

    if (contactEl) contactEl.addEventListener('input', function () { contactEl.setCustomValidity(''); });

    function link(href, text, blank) {
      var a = document.createElement('a');
      a.href = href; a.textContent = text;
      if (blank) { a.target = '_blank'; a.rel = 'noopener'; }
      return a;
    }

    function showError() {
      var box = q('.af-error');
      if (!box) {
        box = document.createElement('p');
        box.className = 'af-error';
        box.setAttribute('role', 'alert');
        (button && button.parentNode === form ? form : (button ? button.parentNode : form)).appendChild(box);
      }
      box.textContent = '';
      var parts = T.error.split(/(\{wa\}|\{email\})/);
      for (var i = 0; i < parts.length; i++) {
        if (parts[i] === '{wa}') box.appendChild(waUrl ? link(waUrl, T.waName, true) : document.createTextNode(T.waName));
        else if (parts[i] === '{email}') box.appendChild(email ? link('mailto:' + email, email) : document.createTextNode(''));
        else box.appendChild(document.createTextNode(parts[i]));
      }
    }

    function showThanks() {
      var done = document.createElement('div');
      done.className = 'af-done';
      done.setAttribute('role', 'status');
      done.setAttribute('tabindex', '-1');
      var p = document.createElement('p');
      p.className = 'af-done-title';
      p.textContent = T.thanks;
      done.appendChild(p);
      if (waUrl) {
        var p2 = document.createElement('p');
        p2.className = 'af-done-wa';
        p2.appendChild(link(waUrl, T.wa, true));
        done.appendChild(p2);
      }
      form.parentNode.replaceChild(done, form);
      try { done.focus({ preventScroll: true }); } catch (e) {}
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy) return;
      var contact = contactEl ? txt(contactEl.value) : '';
      if (contactEl && !isEmail(contact) && !isPhone(contact)) {
        contactEl.setCustomValidity(T.contact);
        contactEl.reportValidity();
        return;
      }
      if (!consent || !consent.checked) { if (consent) consent.reportValidity(); return; }

      var parts = (nameEl ? txt(nameEl.value) : '').split(/\s+/).filter(Boolean);
      var mail = isEmail(contact);
      var lines = [];
      var fields = form.querySelectorAll('input, select, textarea');
      for (var i = 0; i < fields.length; i++) {
        var f = fields[i];
        if (f.type === 'checkbox' || f.type === 'submit' || f === nameEl || f === contactEl) continue;
        var v = fieldValue(f);
        if (v) lines.push(labelOf(form, f) + ': ' + v);
      }
      var qs = new URLSearchParams(location.search);
      var head = form.getAttribute('data-source') || ('Richiesta dal sito — ' + document.title);
      var body = {
        slug: STUDIO,
        first_name: cut(parts[0], 80),
        last_name: cut(parts.slice(1).join(' '), 80) || '-',
        email: mail ? cut(contact, 160) : null,
        phone: mail ? null : cut(contact, 40),
        city: cityEl ? cut(cityEl.value, 80) : null,
        project_type: typeEl ? cut(fieldValue(typeEl), 80) : null,
        description: (head + (lines.length ? '\n\n' + lines.join('\n') : '')).slice(0, 4000),
        privacy: true,
        source_site: location.href,
        utm_source: qs.get('utm_source'),
        utm_medium: qs.get('utm_medium'),
        utm_campaign: qs.get('utm_campaign')
      };

      busy = true;
      var old = q('.af-error'); if (old) old.parentNode.removeChild(old);
      var label = button ? button.textContent : '';
      if (button) { button.disabled = true; button.textContent = T.sending; }
      function fail() {
        busy = false;
        if (button) { button.disabled = false; button.textContent = label; }
        showError();
      }
      try {
        fetch(ARCHFLOW, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          keepalive: true
        }).then(function (r) { if (r.ok) showThanks(); else fail(); }, fail);
      } catch (err) { fail(); }
    });
  }

  var forms = document.querySelectorAll('form[data-archflow]');
  for (var i = 0; i < forms.length; i++) setup(forms[i]);
})();
