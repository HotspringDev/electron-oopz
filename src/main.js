const { app } = require("electron");
const MainController = require("./controller/main-controller");

// ================= Performance & Memory Optimization Flags =================

// 1. Optimize V8 engine GC & limit heap size for single renderer process (e.g., set cap to 512MB to trigger GC earlier)
app.commandLine.appendSwitch("js-flags", "--expose-gc --max-old-space-size=512");

// 2. Disable unused background services and component update checks
app.commandLine.appendSwitch("disable-component-update");
app.commandLine.appendSwitch("disable-background-networking");
app.commandLine.appendSwitch("disable-breakpad"); // Disable crash dump reporting

// 3. Optimize Linux/Wayland compatibility and rendering overhead
if (process.platform === "linux") {
  app.commandLine.appendSwitch("ozone-platform-hint", "auto");
  app.commandLine.appendSwitch("enable-features", "WaylandWindowDecorations");
}

// =========================================================================

class ElectronOopz {
  constructor() {
    this.mainController = null;
    this.gcInterval = null;
  }

  // init method, the entry point of the app.
  init() {
    const lock = app.requestSingleInstanceLock();
    if (!lock) {
      app.quit();
    } else {
      app.on("second-instance", () => {
        if (this.mainController) this.mainController.show();
      });

        this.initApp();
    }
  }

  // init the main app.
  initApp() {
    app.on("ready", () => {
      this.mainController = new MainController();

      // Periodically trigger main process V8 garbage collection every 15 minutes to prevent memory leaks
      this.gcInterval = setInterval(() => {
        if (global.gc) {
          try {
            global.gc();
          } catch (e) {
            console.error("GC Execution failed:", e);
          }
        }
      }, 15 * 60 * 1000);
    });

    app.on("window-all-closed", () => {
      app.quit();
    });

    app.on("quit", () => {
      if (this.gcInterval) clearInterval(this.gcInterval);
    });

      app.on("activate", () => {
        if (this.mainController === null) {
          this.mainController = new MainController();
        } else {
          this.mainController.show();
        }
      });

      app.on(
        "certificate-error",
        function (event, webContents, url, error, certificate, callback) {
          event.preventDefault();
          callback(true);
        }
      );
  }
}

new ElectronOopz().init();
