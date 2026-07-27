const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("versions", {
  node: () => process.versions.node,
                                chrome: () => process.versions.chrome,
                                electron: () => process.versions.electron,
});

// ================= DOM & Render Pipeline Optimization =================

window.addEventListener("DOMContentLoaded", () => {
  // 1. Media lazy rendering / throttling: Pause off-screen <video> elements to save CPU and GPU cycles
  const videoObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (video instanceof HTMLVideoElement) {
          if (entry.isIntersecting) {
            // Resume playback when scrolled into viewport
            video.play().catch(() => {});
          } else {
            // Pause playback when scrolled out of viewport
            video.pause();
          }
        }
      });
    },
    { threshold: 0.05 }
  );

  // Observe dynamically inserted video nodes (e.g., media cards in chat history)
  const mutationObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node;
          if (element.tagName === "VIDEO") {
            videoObserver.observe(element);
          } else {
            element.querySelectorAll("video").forEach((v) => videoObserver.observe(v));
          }
        }
      });
    }
  });

  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Initial scan for existing video elements
  document.querySelectorAll("video").forEach((v) => videoObserver.observe(v));

  // 2. Scheduled garbage collection inside the renderer process
  setInterval(() => {
    if (window.gc) {
      try {
        window.gc();
      } catch (e) {}
    }
  }, 10 * 60 * 1000);
});
