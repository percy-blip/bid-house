import { cp, mkdir } from "node:fs/promises";
await mkdir("dist/client", { recursive: true });
await Promise.all([
  cp("src/client/index.html", "dist/client/index.html"),
  cp("src/client/styles.css", "dist/client/styles.css")
]);
