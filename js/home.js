(function () {
  var S = WaseelaStore, user = S.currentUser();
  if (!user) { location.replace('login.html'); return; }          // لا يوجد حساب مسجَّل دخوله

  var $ = function (id) { return document.getElementById(id); };
  function fmt(iso) {
    try { return new Date(iso).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' }); }
    catch (e) { return iso; }
  }
  $('hello').textContent = 'أهلاً يا ' + user.name.split(' ')[0];
  $('uName').textContent = user.name;
  $('uPhone').textContent = '+249 ' + user.phone;
  $('uRole').textContent = user.role === 'driver' ? 'سائق ركشة' : 'راكب';
  $('uCreated').textContent = fmt(user.createdAt);
  $('uLast').textContent = fmt(user.lastLoginAt);
  $('note').textContent = S.isPersistent()
    ? 'البيانات محفوظة في ذاكرة المتصفح على هذا الجهاز فقط.'
    : 'المتصفح يمنع التخزين المحلي، فالبيانات ستضيع عند إغلاق الصفحة.';

  $('logout').onclick = function () { S.logout(); location.href = 'login.html'; };
})();
