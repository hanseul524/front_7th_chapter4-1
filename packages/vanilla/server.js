import express from "express";
import compression from "compression";
import sirv from "sirv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { render } from "./src/main-server.js";

// node js 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// express 서버
const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || (prod ? "/front_7th_chapter4-1/vanilla/" : "/");

const app = express();

// 개발환경 분기처리
let vite;
if (!prod) {
  // vite dev server + middleware
  const { createServer } = await import("vite");
  vite = await createServer({
    server: { middlewareMode: true },
    base,
    appType: "custom",
  });

  app.use(vite.middlewares);
  //app.use("src", express.static("./src"))
} else {
  // compression + sirv
  app.use(compression());
  app.use(sirv("dist", { base }));
}

app.get("*", async (req, res) => {
  let url = req.originalUrl;

  if (base !== "/" && url.startsWith(base)) {
    url = url.substring(base.length);
  }
  if (!url || url.startsWith("?")) {
    url = "/" + (url || "");
  }

  let template;

  if (!prod) {
    // 개발환경 -> index.html을 읽고 vite가 변환해줌
    template = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");
    template = await vite.transformIndexHtml(url, template);
  } else {
    // production : 빌드된 html 사용
    template = fs.readFileSync(path.resolve(__dirname, "dist/vanilla/index.html"), "utf-8");
  }
  const { html, head, initialData } = await render(url, req.query);

  const initialDataScript = `
  <script>
    window.__INITIAL_DATA__ = ${JSON.stringify(initialData).replace(/</g, "\\u003c")};
  </script>
  `;
  // Template 치환
  const finalHtml = template
    .replace("<!--app-head-->", head)
    .replace("<!--app-html-->", html)
    .replace("</head>", `${initialDataScript}</head>`);

  res.status(200).set({ "Content-Type": "text/html" }).end(finalHtml);
});

// Start http server
app.listen(port, () => {
  console.log(`React Server started at http://localhost:${port}`);
});
