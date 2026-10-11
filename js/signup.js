(function () {
  var S = WaseelaStore;
  var $ = function (id) { return document.getElementById(id); };
  var f = { name: $('name'), phone: $('phone'), pass: $('pass'), pass2: $('pass2'), terms: $('terms') };
  var btn = $('submit'), formMsg = $('formMsg');

  if (S.currentUser()) { location.replace('home.html'); return; }

  function setErr(box, el, html) {
    if (box) $(box).classList.toggle('bad', !!html);
    $(el).innerHTML = html || '';
  }
  function clear(box, el) { return function () { setErr(box, el, ''); formMsg.textContent = ''; }; }
  f.name.addEventListener('input', clear('nameBox', 'nameErr'));
  f.phone.addEventListener('input', clear('phoneBox', 'phoneErr'));
  f.pass.addEventListener('input', clear('passBox', 'passErr'));
  f.pass2.addEventListener('input', clear('pass2Box', 'pass2Err'));
  f.terms.addEventListener('change', clear(null, 'termsErr'));

  $('toggle').onclick = function () {
    var show = f.pass.type === 'password';
    f.pass.type = f.pass2.type = show ? 'text' : 'password';
    this.textContent = show ? 'إخفاء' : 'إظهار';
    this.setAttribute('aria-pressed', show);
  };

  $('signup').addEventListener('submit', function (e) {
    e.preventDefault();
    formMsg.className = 'form-msg'; formMsg.textContent = '';
    var name = f.name.value.trim().replace(/\s+/g, ' ');
    var p = S.normalizePhone(f.phone.value);
    var first = null;
    function bad(box, el, text, field) { setErr(box, el, text); if (!first) first = field; }

    if (name.length < 3) bad('nameBox', 'nameErr', 'اكتب اسمك الكامل (3 أحرف على الأقل)', f.name); else setErr('nameBox', 'nameErr', '');
    if (!S.isValidPhone(p)) bad('phoneBox', 'phoneErr', 'اكتب رقم الهاتف من 9 أرقام، مثال: 912345678', f.phone); else setErr('phoneBox', 'phoneErr', '');
    if (f.pass.value.length < 6) bad('passBox', 'passErr', 'كلمة المرور لازم تكون 6 أحرف أو أكثر', f.pass); else setErr('passBox', 'passErr', '');
    if (f.pass2.value !== f.pass.value) bad('pass2Box', 'pass2Err', 'كلمتا المرور غير متطابقتين', f.pass2); else setErr('pass2Box', 'pass2Err', '');
    if (!f.terms.checked) bad(null, 'termsErr', 'وافق على الشروط عشان تكمل', f.terms); else setErr(null, 'termsErr', '');
    if (first) { first.focus(); return; }

    var role = document.querySelector('input[name=role]:checked').value;
    btn.disabled = true; btn.textContent = 'جارٍ إنشاء الحساب…';
    S.register({ name: name, phone: p, password: f.pass.value, role: role }).then(function (user) {
      formMsg.className = 'form-msg ok'; formMsg.textContent = 'تم إنشاء حسابك. أهلاً بك يا ' + user.name.split(' ')[0];
      window.dispatchEvent(new CustomEvent('waseela:signup-success', { detail: user }));
      setTimeout(function () { location.href = 'home.html'; }, 800);
    }).catch(function (err) {
      btn.disabled = false; btn.textContent = 'إنشاء الحساب';
      if (err && err.code === 'PHONE_EXISTS') {
        setErr('phoneBox', 'phoneErr', 'هذا الرقم مسجَّل من قبل. <a href="login.html">سجّل الدخول</a>');
        f.phone.focus();
      } else formMsg.textContent = 'تعذّر إنشاء الحساب. جرّب مرة ثانية.';
    });
  });
})();
