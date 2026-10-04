(function () {
  "use strict";

  var videos = document.querySelectorAll("#huggingr4-demos video");

  videos.forEach(function (video) {
    video.defaultPlaybackRate = 1.25;
    video.playbackRate = 1.25;

    video.addEventListener("loadedmetadata", function () {
      video.playbackRate = video.defaultPlaybackRate;
    }, { once: true });

    video.addEventListener("play", function () {
      videos.forEach(function (other) {
        if (other !== video) other.pause();
      });
    });
  });
})();
