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

  if (!videos.length) return;

  var dialog = document.createElement("dialog");
  if (typeof dialog.showModal !== "function") return;

  dialog.className = "huggingr4-demo-dialog";
  dialog.setAttribute("aria-labelledby", "huggingr4-demo-dialog-title");
  dialog.innerHTML = '<div class="huggingr4-demo-dialog-heading">' +
    '<h2 id="huggingr4-demo-dialog-title"></h2>' +
    '<button type="button" class="huggingr4-demo-close" autofocus>关闭 ×</button>' +
    '</div><div class="huggingr4-demo-dialog-player"></div>';
  document.body.appendChild(dialog);

  var title = dialog.querySelector("h2");
  var player = dialog.querySelector(".huggingr4-demo-dialog-player");
  var active = null;
  var previousOverflow;

  dialog.querySelector(".huggingr4-demo-close").addEventListener("click", function () {
    dialog.close();
  });

  dialog.addEventListener("click", function (event) {
    if (event.target !== dialog) return;
    var bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });

  dialog.addEventListener("close", function () {
    if (!active) return;
    active.video.pause();
    active.video.controls = false;
    active.preview.insertBefore(active.video, active.button);
    document.documentElement.style.overflow = previousOverflow;
    active.button.focus({ preventScroll: true });
    active = null;
  });

  videos.forEach(function (video) {
    var card = video.closest(".huggingr4-demo-card");
    var name = card.querySelector("h3").textContent;
    var preview = document.createElement("div");
    preview.className = "huggingr4-demo-preview";
    video.parentNode.insertBefore(preview, video);
    preview.appendChild(video);
    video.controls = false;

    var button = document.createElement("button");
    button.type = "button";
    button.className = "huggingr4-demo-open";
    button.setAttribute("aria-label", "放大播放：" + name);
    button.setAttribute("aria-haspopup", "dialog");
    button.innerHTML = '<span class="huggingr4-demo-play-icon" aria-hidden="true">▶</span>' +
      '<span class="huggingr4-demo-open-label">点击放大播放 ↗</span>';
    preview.appendChild(button);

    button.addEventListener("click", function () {
      if (dialog.open) return;
      active = { video: video, preview: preview, button: button };
      title.textContent = name;
      previousOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = "hidden";
      video.controls = true;
      player.appendChild(video);
      dialog.showModal();
      video.play().catch(function () { /* Native controls remain available. */ });
    });
  });
})();
