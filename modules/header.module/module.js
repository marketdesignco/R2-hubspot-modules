// Header hamburger toggle

var headerHamburger = document.querySelector('.header-module__hamburger');
var headerMobilePanel = document.querySelector('.header-module__mobile-panel');

if (headerHamburger && headerMobilePanel) {
  headerHamburger.addEventListener('click', function () {
    var isOpen = headerHamburger.getAttribute('aria-expanded') === 'true';
    headerHamburger.setAttribute('aria-expanded', String(!isOpen));
    headerMobilePanel.classList.toggle('is-open', !isOpen);
  });
}

// Mobile submenu accordion toggles

var mobileToggles = document.querySelectorAll('.header-module__mobile-toggle');

Array.prototype.forEach.call(mobileToggles, function (toggle) {
  toggle.addEventListener('click', function () {
    var item = toggle.parentNode;
    var isOpen = item.classList.contains('header-module__mobile-item--open');
    toggle.setAttribute('aria-expanded', String(!isOpen));
    item.classList.toggle('header-module__mobile-item--open', !isOpen);
  });
});
