/*
  Normalizes whatever URL an editor pastes into a proper embeddable one.
  Editors naturally copy a normal watch/share link (youtube.com/watch?v=,
  youtu.be/, /shorts/, vimeo.com/ID) rather than the raw /embed/ path — but
  a plain YouTube watch page sends X-Frame-Options/frame-ancestors headers
  that refuse to be framed by another site, so pasting one as-is breaks
  playback entirely. Anything not recognized (Wistia, Loom, HubSpot video,
  an already-correct embed URL) is returned unchanged.
*/
function guideVideoTeaserToEmbedUrl(raw) {
  if (!raw) {
    return '';
  }

  var value = raw.trim();

  try {
    var url = new URL(value);
    var host = url.hostname.replace(/^www\./, '').replace(/^m\./, '');

    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      if (url.pathname.indexOf('/embed/') === 0) {
        return value;
      }

      var videoId = url.searchParams.get('v');
      if (!videoId && url.pathname.indexOf('/shorts/') === 0) {
        videoId = url.pathname.split('/shorts/')[1];
      }
      if (!videoId && url.pathname.indexOf('/live/') === 0) {
        videoId = url.pathname.split('/live/')[1];
      }

      if (videoId) {
        videoId = videoId.split('/')[0].split('?')[0];
        return 'https://www.youtube.com/embed/' + videoId;
      }
    }

    if (host === 'youtu.be') {
      var shortId = url.pathname.replace(/^\//, '').split('/')[0];
      if (shortId) {
        return 'https://www.youtube.com/embed/' + shortId;
      }
    }

    if (host === 'player.vimeo.com') {
      return value;
    }

    if (host === 'vimeo.com') {
      var parts = url.pathname.split('/').filter(Boolean);
      var vimeoId = parts[parts.length - 1];
      if (vimeoId && /^\d+$/.test(vimeoId)) {
        return 'https://player.vimeo.com/video/' + vimeoId;
      }
    }

    return value;
  } catch (e) {
    return value;
  }
}

document.querySelectorAll('.guide-video-teaser-module__play').forEach(function (button) {
  button.addEventListener('click', function () {
    var media = button.closest('.guide-video-teaser-module__media');
    if (!media) {
      return;
    }

    var stack = media.querySelector('.guide-video-teaser-module__stack');
    var player = media.querySelector('.guide-video-teaser-module__player');
    var frame = player ? player.querySelector('.guide-video-teaser-module__frame') : null;
    var src = guideVideoTeaserToEmbedUrl(button.getAttribute('data-embed-src'));

    if (!player || !frame || !src) {
      return;
    }

    var separator = src.indexOf('?') === -1 ? '?' : '&';
    var iframe = document.createElement('iframe');
    iframe.src = src + separator + 'autoplay=1&rel=0';
    iframe.title = 'Guide walkthrough video';
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
    iframe.setAttribute('allowfullscreen', '');
    frame.appendChild(iframe);

    if (stack) {
      stack.hidden = true;
    }
    player.hidden = false;
  });
});
