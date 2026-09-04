(function () {
  // Vanilla-JS enhancement layer for the Blog Listing module. No external
  // libraries. Every control (tag filter link, sort form, pagination link)
  // is a real link/form pointing at this same page with an updated query
  // string, so everything already works with JS disabled. When JS is
  // available, clicks/changes are intercepted, the same URL (plus an
  // "ajax=1" flag) is fetched, and only the results region is swapped in —
  // no full page reload, no navigation to a /tag/... route.
  //
  // Scoped per instance via [data-blog-listing] + module_id-namespaced query
  // params, so multiple instances of this module can coexist on one page
  // without their filters/pagination interfering with each other.

  function domReady(fn) {
    if (['interactive', 'complete'].indexOf(document.readyState) >= 0) {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  function buildUrl(root, overrides) {
    var basePath = root.getAttribute('data-base-path');
    var tagParam = root.getAttribute('data-tag-param');
    var sortParam = root.getAttribute('data-sort-param');
    var pageParam = root.getAttribute('data-page-param');

    var tag = overrides.tag !== undefined ? overrides.tag : root.getAttribute('data-active-tag');
    var sort = overrides.sort !== undefined ? overrides.sort : root.getAttribute('data-active-sort');
    var page = overrides.page !== undefined ? overrides.page : root.getAttribute('data-active-page');

    var params = new URLSearchParams();
    params.set(tagParam, tag);
    params.set(sortParam, sort);
    params.set(pageParam, page);

    return {
      visibleUrl: basePath + '?' + params.toString(),
      tag: tag,
      sort: sort,
      page: page
    };
  }

  function setLoading(root, isLoading) {
    root.classList.toggle('is-loading', !!isLoading);
  }

  function syncActiveTagButtons(root, tag) {
    var links = root.querySelectorAll('[data-tag-link]');
    links.forEach(function (link) {
      var isActive = link.getAttribute('data-tag') === tag;
      link.classList.toggle('is-active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function updateLinksForState(root, tag, sort) {
    // Keep every filter/sort/pagination link's own href in sync with the
    // new state, so a no-JS reload or a second click always lands on the
    // correct combination even after client-side swaps.
    var tagParam = root.getAttribute('data-tag-param');
    var sortParam = root.getAttribute('data-sort-param');
    var pageParam = root.getAttribute('data-page-param');
    var basePath = root.getAttribute('data-base-path');

    root.querySelectorAll('[data-tag-link]').forEach(function (link) {
      var linkTag = link.getAttribute('data-tag');
      var params = new URLSearchParams();
      params.set(tagParam, linkTag);
      params.set(sortParam, sort);
      params.set(pageParam, '1');
      link.setAttribute('href', basePath + '?' + params.toString());
    });

    var tagInput = root.querySelector('[data-tag-input]');
    if (tagInput) {
      tagInput.value = tag;
    }
  }

  function fetchAndSwap(root, state) {
    var resultsEl = root.querySelector('[data-results]');
    if (!resultsEl) {
      return;
    }

    var url = buildUrl(root, state);
    var ajaxUrl = url.visibleUrl + (url.visibleUrl.indexOf('?') > -1 ? '&' : '?') + 'ajax=1';

    setLoading(root, true);

    fetch(ajaxUrl, { credentials: 'same-origin' })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Blog listing fetch failed: ' + response.status);
        }
        return response.text();
      })
      .then(function (html) {
        var parsed = new DOMParser().parseFromString(html, 'text/html');
        var newResults = parsed.querySelector('[data-results]');
        if (!newResults) {
          throw new Error('Blog listing response missing results region.');
        }

        resultsEl.innerHTML = newResults.innerHTML;

        root.setAttribute('data-active-tag', url.tag);
        root.setAttribute('data-active-sort', url.sort);
        root.setAttribute('data-active-page', url.page);

        syncActiveTagButtons(root, url.tag);
        updateLinksForState(root, url.tag, url.sort);

        try {
          window.history.pushState({}, '', url.visibleUrl);
        } catch (e) {
          // pushState can fail in rare sandboxed contexts; the visible URL
          // just won't update, the UI itself is already correct.
        }

        resultsEl.setAttribute('tabindex', '-1');
        resultsEl.focus({ preventScroll: true });
      })
      .catch(function () {
        // Fully HubSpot-native fallback: a real navigation to the exact
        // same URL server-renders the correct filtered/sorted/paginated
        // result, so nothing is ever silently broken if the fetch fails.
        window.location.href = url.visibleUrl;
      })
      .finally(function () {
        setLoading(root, false);
      });
  }

  function initInstance(root) {
    if (root.dataset.blogListingInit === 'true') {
      return;
    }
    root.dataset.blogListingInit = 'true';
    root.classList.add('is-enhanced');

    root.addEventListener('click', function (event) {
      var tagLink = event.target.closest('[data-tag-link]');
      if (tagLink && root.contains(tagLink)) {
        event.preventDefault();
        fetchAndSwap(root, { tag: tagLink.getAttribute('data-tag'), page: '1' });
        return;
      }

      var pageLink = event.target.closest('[data-page-link]');
      if (pageLink && root.contains(pageLink)) {
        if (pageLink.classList.contains('is-disabled') || pageLink.getAttribute('aria-disabled') === 'true') {
          event.preventDefault();
          return;
        }
        event.preventDefault();
        fetchAndSwap(root, { page: pageLink.getAttribute('data-page') });
      }
    });

    var sortForm = root.querySelector('[data-sort-form]');
    var sortSelect = root.querySelector('[data-sort-select]');
    if (sortForm && sortSelect) {
      sortForm.addEventListener('submit', function (event) {
        event.preventDefault();
        fetchAndSwap(root, { sort: sortSelect.value, page: '1' });
      });
      sortSelect.addEventListener('change', function () {
        fetchAndSwap(root, { sort: sortSelect.value, page: '1' });
      });
    }
  }

  domReady(function () {
    var instances = document.querySelectorAll('[data-blog-listing]');
    instances.forEach(initInstance);
  });
})();
