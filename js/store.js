/* طبقة التخزين المحلي المشتركة (localStorage) — تُحمَّل في كل الصفحات.
   المفاتيح:
     waseela:users      كل الحسابات { "912345678": {...} }
     waseela:session    الحساب المسجَّل دخوله حالياً
     waseela:lastPhone  آخر رقم استُخدم (لتعبئته في صفحة الدخول)
   كلمة المرور لا تُحفظ نصاً: تُحفظ مشفّرة (PBKDF2) مع salt خاص بكل حساب. */
(function (global) {
  'use strict';
  var K = { users: 'waseela:users', session: 'waseela:session', last: 'waseela:lastPhone' };
  var mem = {};            // احتياطي إذا كان localStorage معطّلاً (وضع التصفح الخاص مثلاً)
  var persistent = true;

  function read(key, def) {
    try { var v = localStorage.getItem(key); return v == null ? def : JSON.parse(v); }
    catch (e) { persistent = false; return key in mem ? mem[key] : def; }
  }
  function write(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch (e) { persistent = false; mem[key] = val; return false; }
  }
  function remove(key) { try { localStorage.removeItem(key); } catch (e) {} delete mem[key]; }

  /* ---------- الهاتف ---------- */
  function normalizePhone(v) {
    v = String(v || '').replace(/[\u0660-\u0669]/g, function (d) { return d.charCodeAt(0) - 0x660; });
    v = v.replace(/\D/g, '');
    if (v.indexOf('249') === 0 && v.length > 9) v = v.slice(3);
    return v.replace(/^0+/, '');
  }
  function isValidPhone(p) { return /^[19]\d{8}$/.test(p); }

  /* ---------- التشفير ---------- */
  function randomHex(bytes) {
    var a = new Uint8Array(bytes);
    if (global.crypto && crypto.getRandomValues) crypto.getRandomValues(a);
    else for (var i = 0; i < bytes; i++) a[i] = Math.floor(Math.random() * 256);
    return Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
  }
  function toHex(buf) {
    return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
  }
  function hashPassword(password, salt, algo) {
    if (algo === 'pbkdf2' && global.crypto && crypto.subtle) {
      var enc = new TextEncoder();
      return crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
        .then(function (key) {
          return crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' }, key, 256);
        }).then(toHex);
    }
    // احتياطي ضعيف للمتصفحات بلا crypto.subtle (غير آمن — للتجربة فقط)
    var s = salt + password, h = 2166136261;
    for (var r = 0; r < 2000; r++) for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return Promise.resolve(h.toString(16));
  }
  function bestAlgo() { return (global.crypto && crypto.subtle) ? 'pbkdf2' : 'fnv'; }

  /* ---------- الحسابات ---------- */
  function fail(code) { var e = new Error(code); e.code = code; return Promise.reject(e); }
  function publicUser(u) {
    if (!u) return null;
    return { id: u.id, name: u.name, phone: u.phone, role: u.role, createdAt: u.createdAt, lastLoginAt: u.lastLoginAt };
  }
  function setSession(u) { write(K.session, { phone: u.phone, at: new Date().toISOString() }); write(K.last, u.phone); }

  function register(data) {
    var phone = normalizePhone(data.phone);
    if (!isValidPhone(phone)) return fail('INVALID_PHONE');
    var users = read(K.users, {});
    if (users[phone]) return fail('PHONE_EXISTS');
    var salt = randomHex(16), algo = bestAlgo();
    return hashPassword(data.password, salt, algo).then(function (hash) {
      var now = new Date().toISOString();
      var user = {
        id: 'u_' + randomHex(6), name: String(data.name).trim(), phone: phone,
        role: data.role === 'driver' ? 'driver' : 'rider',
        salt: salt, hash: hash, algo: algo, createdAt: now, lastLoginAt: now
      };
      users = read(K.users, {});          // إعادة القراءة تحسباً لتبويب آخر
      if (users[phone]) throw Object.assign(new Error('PHONE_EXISTS'), { code: 'PHONE_EXISTS' });
      users[phone] = user;
      write(K.users, users);
      setSession(user);
      return publicUser(user);
    });
  }

  function login(phoneRaw, password) {
    var phone = normalizePhone(phoneRaw);
    var users = read(K.users, {}), user = users[phone];
    if (!user) return fail('INVALID');
    return hashPassword(password, user.salt, user.algo).then(function (hash) {
      if (hash !== user.hash) throw Object.assign(new Error('INVALID'), { code: 'INVALID' });
      user.lastLoginAt = new Date().toISOString();
      users[phone] = user; write(K.users, users);
      setSession(user);
      return publicUser(user);
    });
  }

  function currentUser() {
    var s = read(K.session, null);
    if (!s) return null;
    return publicUser(read(K.users, {})[s.phone]);
  }
  function logout() { remove(K.session); }

  global.WaseelaStore = {
    normalizePhone: normalizePhone, isValidPhone: isValidPhone,
    register: register, login: login, currentUser: currentUser, logout: logout,
    getLastPhone: function () { return read(K.last, ''); },
    isPersistent: function () { return persistent; },
    clearAll: function () { remove(K.users); remove(K.session); remove(K.last); }
  };
})(window);
