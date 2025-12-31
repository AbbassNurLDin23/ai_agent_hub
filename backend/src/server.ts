import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { app } from "./app";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Load .env from project root
// dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

console.log("[ENV] PROVIDERS_FILE =", process.env.PROVIDERS_FILE);

const port = Number(process.env.PORT || 4000);
const host = "0.0.0.0";

console.log("[BOOT] ENV PORT =", process.env.PORT);
console.log("[BOOT] ENV CLIENT_ORIGIN =", process.env.CLIENT_ORIGIN);

const server = app.listen(port, host, () => {
  console.log(`[BOOT] API listening on http://127.0.0.1:${port}`);
});

server.on("error", (err: any) => {
  console.error("[BOOT] Server failed to start:", err);
});
