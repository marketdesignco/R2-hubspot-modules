(function () {
  // Progressive enhancement for the Guides + Checklists filter pills.
  // Every pill is a real link to `?gc_tag=<slug>` — guides-checklists-grid
  // .module independently reads the same query param server-side, so a
  // plain navigation with JS disabled already renders the correct filtered
  // grid. When JS is available, this intercepts the click, fetches the
  // same URL (+ ajax=1, a hint the grid module can use to skip re-rendering
  // its own wrapper), and swaps only the grid's results container — found
  // by its page-unique ID, [data-guides-checklists-grid-results], since
  // this filter module and the grid module are two independent modules on
  // the same page, not nested within each other.

  function domReady(fn) {
    if (['interactive', 'complete'].indexOf(document.readyState) >= 0) {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  function syncActiveButtons(root, tag) {
    root.querySelectorAll('[data-tag-link]').forEach(function (link) {
      var isActive = link.getAttribute('data-tag') === tag;
      link.classList.toggle('is-active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function fetchAndSwap(root, tag) {
    var basePath = root.getAttribute('data-base-path');
    var url = basePath + '?gc_tag=' + encodeURIComponent(tag);
    var ajaxUrl = url + '&ajax=1';
    var gridResults = document.querySelector('[data-guides-checklists-grid-results]');

    if (!gridResults) {
      // The grid module isn't on this page (or hasn't rendered yet) —
      // fall back to a normal navigation rather than doing nothing.
      window.location.href = url;
      return;
    }

    root.classList.add('is-loading');

    fetch(ajaxUrl, { credentials: 'same-origin' })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Guides + Checklists filter fetch failed: ' + response.status);
        }
        return response.text();
      })
      .then(function (html) {
        var parsed = new DOMParser().parseFromString(html, 'text/html');
        var newResults = parsed.querySelector('[data-guides-checklists-grid-results]');
        if (!newResults) {
          throw new Error('Guides + Checklists filter response missing grid results region.');
        }

        gridResults.innerHTML = newResults.innerHTML;
        root.setAttribute('data-active-tag', tag);
        syncActiveButtons(root, tag);

        try {
          window.history.pushState({}, '', url);
        } catch (e) {
          // pushState can fail in rare sandboxed contexts; the visible URL
          // just won't update, the UI itself is already correct.
        }

        gridResults.setAttribute('tabindex', '-1');
        gridResults.focus({ preventScroll: true });
      })
      .catch(function () {
        // Fully HubSpot-native fallback: a real navigation to the exact
        // same URL server-renders the correct filtered result on both
        // modules, so nothing is ever silently broken if the fetch fails.
        window.location.href = url;
      })
      .finally(function () {
        root.classList.remove('is-loading');
      });
  }

  function initInstance(root) {
    if (root.dataset.guidesChecklistsFilterInit === 'true') {
      return;
    }
    root.dataset.guidesChecklistsFilterInit = 'true';

    root.addEventListener('click', function (event) {
      var tagLink = event.target.closest('[data-tag-link]');
      if (tagLink && root.contains(tagLink)) {
        event.preventDefault();
        fetchAndSwap(root, tagLink.getAttribute('data-tag'));
      }
    });
  }

  domReady(function () {
    document.querySelectorAll('[data-guides-checklists-filter]').forEach(initInstance);
  });
})();
