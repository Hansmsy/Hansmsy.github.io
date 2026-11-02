// Preserve native fragments; the theme's smooth-scroll hides them from the URL.
document.addEventListener('click', function (event) {
  var link = event.target.closest('a[href^="#"]');
  if (link && link.closest('.blog-shell, .blog-skip')) event.stopImmediatePropagation();
}, true);

var blogPrintState = [];
window.addEventListener('beforeprint', function () {
  blogPrintState = Array.from(document.querySelectorAll('.blog-details')).map(function (detail) {
    var state = { detail: detail, open: detail.open };
    detail.open = true;
    return state;
  });
});
window.addEventListener('afterprint', function () {
  blogPrintState.forEach(function (state) { state.detail.open = state.open; });
  blogPrintState = [];
});
