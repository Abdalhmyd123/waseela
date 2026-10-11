(function () {
  var S = WaseelaStore;
  var $ = function (id) { return document.getElementById(id); };
  var phone = $('phone'), pass = $('pass'), btn = $('submit'), formMsg = $('formMsg');

  if (S.currentUser()) { location.replace('home.html'); return; }   // مسجَّل دخوله بالفعل
  phone.value = S.getLastPhone();                                   // آخر رقم استُخدم

  function setErr(box, el, text) { $(box).classList.toggle('bad', !!text); $(el).textContent = text || ''; }

  $('toggle').onclick = function () {
    var show = pass.type === 'password';
    pass.type = show ? 'text' : 'password';
    this.textContent = show ? 'إخفاء' : 'إظهار';
    this.setAttribute('aria-pressed', show);
  };
  phone.addEventListener('input', function () { setErr('phoneBox', 'phoneErr', ''); formMsg.textContent = ''; });
  pass.addEventListener('input', function () { setErr('passBox', 'passErr', ''); formMsg.textContent = ''; });

  $('login').addEventListener('submit', function (e) {
    e.preventDefault();
    var p = S.normalizePhone(phone.value), ok = true;
    formMsg.className = 'form-msg'; formMsg.textContent = '';
    if (!S.isValidPhone(p)) { setErr('phoneBox', 'phoneErr', 'اكتب رقم الهاتف من 9 أرقام، مثال: 912345678'); ok = false; phone.focus(); }
    else setErr('phoneBox', 'phoneErr', '');
    if (pass.value.length < 6) { setErr('passBox', 'passErr', 'كلمة المرور لازم تكون 6 أحرف أو أكثر'); if (ok) pass.focus(); ok = false; }
    else setErr('passBox', 'passErr', '');
    if (!ok) return;

    btn.disabled = true; btn.textContent = 'جارٍ الدخول…';
    S.login(p, pass.value).then(function (user) {
      formMsg.className = 'form-msg ok'; formMsg.textContent = 'تم تسجيل الدخول';
      window.dispatchEvent(new CustomEvent('waseela:login-success', { detail: user }));
      setTimeout(function () { location.href = 'home.html'; }, 500);
    }).catch(function (err) {
      btn.disabled = false; btn.textContent = 'تسجيل الدخول';
      formMsg.textContent = err && err.code === 'INVALID'
        ? 'رقم الهاتف أو كلمة المرور غير صحيحة. جرّب مرة ثانية.'
        : 'تعذّر تسجيل الدخول. جرّب مرة ثانية.';
    });
  });

  $('forgot').onclick = function (e) { e.preventDefault(); window.dispatchEvent(new Event('waseela:forgot-password')); };
})();
