window.HELP_IMPROVE_VIDEOJS = false;

var INTERP_BASE = "./static/interpolation/stacked";
var NUM_INTERP_FRAMES = 240;

var interp_images = [];

// Safari-safe padStart replacement
function pad6(n) {
  var s = String(n);
  while (s.length < 6) s = "0" + s;
  return s;
}

function preloadInterpolationImages() {
  for (var i = 0; i < NUM_INTERP_FRAMES; i++) {
    var path = INTERP_BASE + '/' + pad6(i) + '.jpg';
    interp_images[i] = new Image();
    interp_images[i].src = path;
  }
}

function setInterpolationImage(i) {
  var image = interp_images[i];
  image.ondragstart = function() { return false; };
  image.oncontextmenu = function() { return false; };
  $('#interpolation-image-wrapper').empty().append(image);
}

$(document).ready(function() {
  $(".navbar-burger").click(function() {
    $(".navbar-burger").toggleClass("is-active");
    $(".navbar-menu").toggleClass("is-active");
  });

  // Parse numeric data-* ourselves before attaching.
  // bulma-carousel merges dataset values as strings, which can break
  // boundary math when slidesToShow/slidesToScroll are > 1.
  function readIntAttr(el, attrName, fallback) {
    var raw = el.getAttribute(attrName);
    var parsed = parseInt(raw, 10);
    return isNaN(parsed) ? fallback : parsed;
  }

  // We clear default breakpoints so desktop grouping stays exact.
  var baseOptions = {
    slidesToScroll: 1,
    slidesToShow: 1,
    loop: true,
    infinite: false,
    autoplay: false,
    autoplaySpeed: 3000,
    navigation: true,
    pagination: true,
    breakpoints: []
  };

  var carouselEls = document.querySelectorAll('.carousel');
  var carousels = [];

  for (var c = 0; c < carouselEls.length; c++) {
    var el = carouselEls[c];
    var show = readIntAttr(el, 'data-slides-to-show', baseOptions.slidesToShow);
    var scroll = readIntAttr(el, 'data-slides-to-scroll', baseOptions.slidesToScroll);

    // Remove these attributes so the library won't overwrite numeric options
    // with string values from dataset.
    el.removeAttribute('data-slides-to-show');
    el.removeAttribute('data-slides-to-scroll');

    var opts = $.extend({}, baseOptions, {
      slidesToShow: show,
      slidesToScroll: scroll
    });

    var instances = bulmaCarousel.attach(el, opts);
    if (instances && instances.length) {
      carousels.push(instances[0]);
    }
  }

  console.log('[bulmaCarousel] instances:', carousels ? carousels.length : 0);

  // Avoid arrow functions for Safari compatibility
  if (carousels && carousels.length) {
    for (var i = 0; i < carousels.length; i++) {
      carousels[i].on('before:show', function(state) {
        // console.log(state);
      });
    }
  }

  // ---- Interpolation (optional): only enable if the HTML exists ----
  var sliderEl = document.getElementById('interpolation-slider');
  var wrapperEl = document.getElementById('interpolation-image-wrapper');

  if (sliderEl && wrapperEl) {
    preloadInterpolationImages();
    sliderEl.addEventListener('input', function() {
      setInterpolationImage(this.value);
    });
    setInterpolationImage(0);
    sliderEl.max = NUM_INTERP_FRAMES - 1;
  } else {
    // Do nothing: interpolation section not present
  }

  bulmaSlider.attach();
});

$(function() {
  var playlist = [
    "https://modelscope.cn/datasets/Hlyyyyy/oneshot-videos/resolve/master/tests/ID_Fengyuan-SMPLX_taiji-Scene_orbit_view_normal_neg_gen_1768979805_ourGen81.mp4",
    "./static/videos_web/ID_Hepburn-SMPLX_walk_backview-Scene_city1_scene_gen_1775017332_ourGen81.mp4",
    "./static/videos_web/ID_WillSmith-SMPLX_taiji-Scene_bluebackground2_scene_gen_1777381670_ourGen81.mp4",
    "./static/videos_web/ID_JenHsun-SMPLX_forward_circle-Scene_bluebackground2_scene_gen_1769067994_ourGen81.mp4",
    "./static/videos_web/ID_Hepburn-SMPLX_taiji-Scene_museum4_scene_gen_ourGen81.mp4",
    "./static/videos_web/ID_WillSmith-SMPLX_Austria1_human-Scene_Austria1_scene_gen_1777452744_ourGen81.mp4",
    "./static/videos_web/ID_Siyu-SMPLX_IMG_2478-Scene_IMG_2478_gen_ourGen81.mp4",
    "./static/videos_web/ID_Hepburn-SMPLX_walk_backview-Scene_skiing_scene_gen_1775026058_ourGen81.mp4",
  ];

  var currentIndex = 0;
  var player1 = document.getElementById('hero-video-1');
  var player2 = document.getElementById('hero-video-2');
  var activePlayer = player1; // track with variable, not DOM query

  if (player1) player1.removeAttribute('loop');
  if (player2) player2.removeAttribute('loop');

  // Remove <source> children from player1 so subsequent load() calls
  // don't confuse the browser's media loading algorithm.
  if (player1) {
    var sources = player1.querySelectorAll('source');
    for (var s = 0; s < sources.length; s++) {
      player1.removeChild(sources[s]);
    }
  }

  function safePlay(videoEl, onOk) {
    try {
      videoEl.muted = true;
      videoEl.setAttribute('muted', '');
      videoEl.setAttribute('playsinline', '');
      videoEl.playsInline = true;

      var ret = videoEl.play();
      if (ret && typeof ret.then === 'function') {
        ret.then(onOk).catch(function(err) {
          console.error("[hero] play() rejected:", err);
          onOk(); // still swap visibility so chain continues
        });
      } else {
        onOk();
      }
    } catch (e) {
      console.error("[hero] play() threw:", e);
    }
  }

  function playNext() {
    currentIndex = (currentIndex + 1) % playlist.length;
    var prevPlayer = activePlayer;
    var nextPlayer = (prevPlayer === player1) ? player2 : player1;

    console.log('[hero] switching to video', currentIndex, playlist[currentIndex]);

    nextPlayer.src = playlist[currentIndex];
    nextPlayer.load();
    activePlayer = nextPlayer; // update immediately before async play

    safePlay(nextPlayer, function() {
      $(nextPlayer).addClass('active');
      $(prevPlayer).removeClass('active');
    });
  }

  function onVideoEnded(e) {
    // Only advance when the ACTIVE player ends; ignore stale events
    // from the inactive (background) player.
    if (e.target !== activePlayer) {
      console.log('[hero] ignoring ended from inactive player');
      return;
    }
    playNext();
  }

  function onVideoError(e) {
    console.error('[hero] video error, skipping:', e.target.src);
    if (e.target === activePlayer) {
      playNext();
    }
  }

  if (player1) {
    player1.addEventListener('ended', onVideoEnded);
    player1.addEventListener('error', onVideoError);
  }
  if (player2) {
    player2.addEventListener('ended', onVideoEnded);
    player2.addEventListener('error', onVideoError);
  }
});
