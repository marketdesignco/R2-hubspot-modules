document.querySelectorAll('.media-band-module__play').forEach(function (button) {
  button.addEventListener('click', function () {
    var wrap = button.closest('.media-band-module__video-wrap');
    if (!wrap) {
      return;
    }

    button.classList.add('media-band-module__play--hidden');

    var poster = wrap.querySelector('.media-band-module__poster');
    if (poster) {
      poster.classList.add('media-band-module__poster--hidden');
    }

    var video = wrap.querySelector('video');
    if (video) {
      video.setAttribute('controls', '');
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function () {});
      }
    }
  });
});
