const { app, BrowserWindow, protocol, net, session } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const { pathToFileURL } = require("node:url");

const SCHEME = "networkk-admin";
const ADMIN_PATH = "/G3142-AF26-0x99";

protocol.registerSchemesAsPrivileged([
  {
    scheme: SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true
    }
  }
]);

function safePathFromUrl(requestUrl) {
  const url = new URL(requestUrl);
  const requested = decodeURIComponent(url.pathname || "/");
  const distRoot = path.resolve(__dirname, "..", "dist");
  const candidate = path.resolve(distRoot, "." + requested);
  if (candidate !== distRoot && !candidate.startsWith(distRoot + path.sep)) return null;
  return { distRoot, candidate };
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1500,
    height: 950,
    minWidth: 1100,
    minHeight: 700,
    title: "Networkk Admin",
    backgroundColor: "#050807",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: false
    }
  });

  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));

  win.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith(SCHEME + "://")) event.preventDefault();
  });

  win.loadURL(SCHEME + "://app" + ADMIN_PATH);
}

app.whenReady().then(() => {
  protocol.handle(SCHEME, async (request) => {
    const resolved = safePathFromUrl(request.url);
    if (!resolved) return new Response("Forbidden", { status: 403 });

    let filePath = resolved.candidate;
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(resolved.distRoot, "index.html");
    }

    return net.fetch(pathToFileURL(filePath).toString());
  });

  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(["clipboard-read", "clipboard-sanitized-write"].includes(permission));
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
