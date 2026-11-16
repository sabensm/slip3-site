window.s3ToggleTheme = function () {
  var r = document.documentElement;
  var dark = r.dataset.theme ? r.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  r.dataset.theme = dark ? 'light' : 'dark';
  try { localStorage.setItem('s3-theme', r.dataset.theme); } catch (e) {}
};
document.querySelectorAll('.theme').forEach(function (b) {
  b.addEventListener('click', function () { window.s3ToggleTheme(); });
});
