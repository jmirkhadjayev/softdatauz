const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const PORT = process.env.PORT || 5000;
const ROOT_DIR = fs.existsSync(path.join(__dirname, "softdatauz-main")) ? path.join(__dirname, "softdatauz-main") : __dirname;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".webm": "video/webm",
  ".mp4": "video/mp4",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
  ".otf": "font/otf",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".pdf": "application/pdf"
};

// Safe API handler loader
function getApiHandler(endpoint) {
  try {
    const handlerPath = path.join(ROOT_DIR, "api", `${endpoint}.js`);
    if (fs.existsSync(handlerPath)) {
      delete require.cache[require.resolve(handlerPath)];
      return require(handlerPath);
    }
  } catch (err) {
    console.error(`Error loading API handler ${endpoint}:`, err);
  }
  return null;
}

// Adapt Node http req/res for Vercel-style handlers
function adaptReqRes(req, res, bodyBuffer) {
  let bodyStr = bodyBuffer.toString("utf8");
  let parsedBody = {};
  try {
    parsedBody = JSON.parse(bodyStr);
  } catch (e) {
    parsedBody = bodyStr;
  }
  req.body = parsedBody;

  res.status = function (code) {
    res.statusCode = code;
    return res;
  };
  res.json = function (data) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(data));
    return res;
  };
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Handle API routes (/api/form, /api/chat)
  if (pathname.startsWith("/api/")) {
    const endpoint = pathname.replace(/^\/api\//, "").split("/")[0].replace(/\.js$/, "");
    const handler = getApiHandler(endpoint);

    if (handler) {
      const chunks = [];
      req.on("data", chunk => chunks.push(chunk));
      req.on("end", async () => {
        const bodyBuffer = Buffer.concat(chunks);
        adaptReqRes(req, res, bodyBuffer);
        try {
          await handler(req, res);
        } catch (err) {
          console.error(`Handler error on ${pathname}:`, err);
          if (!res.headersSent) {
            res.status(500).json({ error: "internal_server_error", message: err.message });
          }
        }
      });
      return;
    }
  }

  // Prevent directory traversal
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, "");
  let filePath = path.join(ROOT_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`<h1>404 Not Found</h1><p>The path <code>${pathname}</code> was not found.</p>`);
      return;
    }

    if (stats.isDirectory()) {
      filePath = path.join(filePath, "index.html");
      if (!fs.existsSync(filePath)) {
        res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
        res.end(`<h1>404 Not Found</h1><p>index.html was not found in this directory.</p>`);
        return;
      }
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const fileSize = fs.statSync(filePath).size;

    // Handle range request for video/audio streaming
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        res.writeHead(416, {
          "Content-Range": `bytes */${fileSize}`,
          "Content-Type": contentType
        });
        return res.end();
      }

      const chunksize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });
      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": contentType
      });
      file.pipe(res);
    } else {
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": contentType,
        "Accept-Ranges": "bytes"
      });
      fs.createReadStream(filePath).pipe(res);
    }
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`SoftData server ishga tushdi: http://localhost:${PORT}`);
  console.log(`Asosiy sahifa: http://localhost:${PORT}/index.html`);
  console.log(`Port: ${PORT}`);
});
