// Hero rotating headline: typewriter effect + synced background

(function () {
  var section = document.querySelector('.hero-module');
  if (!section) return;

  var textEl = section.querySelector('[data-hero-rotating-text]');
  var dataItems = section.querySelectorAll('[data-hero-phrase-data] li');
  var dots = section.querySelectorAll('[data-hero-dot]');
  var wbImages = section.querySelectorAll('[data-hero-wb-image]');
  var diagrams = section.querySelectorAll('[data-hero-diagram]');
  var customContainer = section.querySelector('[data-hero-diagram-custom]');

  if (!textEl || !dataItems.length) return;

  var diagramMap = {};
  Array.prototype.forEach.call(diagrams, function (svg) {
    diagramMap[svg.getAttribute('data-hero-diagram')] = svg;
  });

  var svgFileCache = {};

  var phrases = Array.prototype.map.call(dataItems, function (li) {
    var key = li.getAttribute('data-hero-diagram') || 'none';
    return {
      text: li.getAttribute('data-hero-phrase') || '',
      hasImage: li.getAttribute('data-hero-has-image') === 'true',
      diagram: diagramMap[key] ? key : 'none',
      svgFileUrl: li.getAttribute('data-hero-svg-file') || ''
    };
  });

  var rotateSeconds = parseFloat(section.getAttribute('data-hero-rotate-seconds'));
  if (!rotateSeconds || rotateSeconds < 1) rotateSeconds = 5;

  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var current = 0;
  var typeTimer = null;
  var rotateTimer = null;

  // Priority per phrase: uploaded SVG file > uploaded background image > built-in diagram > none.

  function replayDrawAnimation(el) {
    el.classList.remove('is-drawing');
    // Force reflow so the CSS draw-in animation restarts on the next class add.
    void el.offsetWidth;
    el.classList.add('is-drawing');
  }

  function showBuiltIn(index) {
    if (customContainer) {
      customContainer.classList.remove('is-active', 'is-drawing');
      customContainer.innerHTML = '';
    }

    Array.prototype.forEach.call(wbImages, function (img) {
      var isMatch = parseInt(img.getAttribute('data-hero-wb-image'), 10) === index;
      img.classList.toggle('is-active', isMatch);
    });

    var showDiagram = !phrases[index].hasImage;
    var targetKey = phrases[index].diagram;

    Array.prototype.forEach.call(diagrams, function (svg) {
      var isMatch = showDiagram && svg.getAttribute('data-hero-diagram') === targetKey;
      svg.classList.toggle('is-active', isMatch);
      svg.classList.remove('is-drawing');
    });

    if (showDiagram && diagramMap[targetKey]) {
      replayDrawAnimation(diagramMap[targetKey]);
    }
  }

  function showCustomSvg(index, url) {
    if (svgFileCache[url] !== undefined) {
      applyCustomSvg(index, url, svgFileCache[url]);
      return;
    }
    if (typeof fetch !== 'function') {
      showBuiltIn(index);
      return;
    }
    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('SVG file request failed');
        return res.text();
      })
      .then(function (text) {
        svgFileCache[url] = text;
        applyCustomSvg(index, url, text);
      })
      .catch(function () {
        svgFileCache[url] = null;
        // Upload exists but couldn't be fetched/read — fall back rather than show nothing.
        if (index === current) showBuiltIn(index);
      });
  }

  function applyCustomSvg(index, url, svgText) {
    if (index !== current || phrases[index].svgFileUrl !== url) return;
    if (!customContainer || !svgText) {
      showBuiltIn(index);
      return;
    }

    Array.prototype.forEach.call(wbImages, function (img) { img.classList.remove('is-active'); });
    Array.prototype.forEach.call(diagrams, function (svg) {
      svg.classList.remove('is-active', 'is-drawing');
    });

    customContainer.innerHTML = svgText;
    customContainer.classList.add('is-active');
    replayDrawAnimation(customContainer);
  }

  function setActiveBackground(index) {
    var url = phrases[index].svgFileUrl;
    if (url) {
      showCustomSvg(index, url);
    } else {
      showBuiltIn(index);
    }
  }

  function setActiveDot(index) {
    Array.prototype.forEach.call(dots, function (dot) {
      var isMatch = parseInt(dot.getAttribute('data-hero-dot'), 10) === index;
      dot.classList.toggle('is-active', isMatch);
      dot.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });
  }

  function typeText(text, cb) {
    var i = 0;
    textEl.textContent = '';
    function step() {
      if (i <= text.length) {
        textEl.textContent = text.slice(0, i) || ' ';
        i++;
        typeTimer = setTimeout(step, 55);
      } else if (cb) {
        cb();
      }
    }
    step();
  }

  function eraseText(cb) {
    function step() {
      var current = textEl.textContent === ' ' ? '' : textEl.textContent;
      if (current.length > 0) {
        textEl.textContent = current.slice(0, -1) || ' ';
        typeTimer = setTimeout(step, 30);
      } else if (cb) {
        cb();
      }
    }
    step();
  }

  function scheduleNext() {
    if (phrases.length < 2 || reducedMotion) return;
    rotateTimer = setTimeout(function () {
      goTo((current + 1) % phrases.length);
    }, rotateSeconds * 1000);
  }

  function goTo(index) {
    clearTimeout(typeTimer);
    clearTimeout(rotateTimer);
    current = index;
    setActiveDot(current);
    setActiveBackground(current);
    eraseText(function () {
      typeText(phrases[current].text, scheduleNext);
    });
  }

  Array.prototype.forEach.call(dots, function (dot) {
    dot.addEventListener('click', function () {
      var index = parseInt(dot.getAttribute('data-hero-dot'), 10);
      if (index !== current) goTo(index);
    });
  });

  setActiveDot(current);
  setActiveBackground(current);

  if (reducedMotion) {
    textEl.textContent = phrases[current].text;
  } else {
    typeText(phrases[current].text, scheduleNext);
  }
})();
