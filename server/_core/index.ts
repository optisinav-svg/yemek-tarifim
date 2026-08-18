import "dotenv/config";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Enable CORS for all routes - reflect the request origin to support credentials
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
    res.header("Access-Control-Allow-Credentials", "true");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerStorageProxy(app);
  registerOAuthRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  // Render runs this process as the public web service. Serve the Expo web
  // export from the same origin so the browser can load GET / and API calls
  // can remain relative to https://gastronotlar.com.
  const primaryDist = path.resolve(process.cwd(), "dist", "web");
  const secondaryDist = path.resolve(__dirname, "../../dist", "web");
  const fallbackDist = path.resolve(process.cwd(), "dist");
  
  const resolvedDist = fs.existsSync(primaryDist)
    ? primaryDist
    : (fs.existsSync(secondaryDist) ? secondaryDist : fallbackDist);

  console.log(`[Static] Using web distribution path: ${resolvedDist} (cwd: ${process.cwd()}, __dirname: ${__dirname})`);

  if (fs.existsSync(resolvedDist)) {
    app.use(express.static(resolvedDist));
  } else {
    console.log(`[Static] Warning: dist/web path not found at startup, static files may fail.`);
  }

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
      next();
      return;
    }

    const currentDist = fs.existsSync(primaryDist)
      ? primaryDist
      : (fs.existsSync(secondaryDist) ? secondaryDist : fallbackDist);

    const indexPath = path.join(currentDist, "index.html");

    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(200).send(`<html><body><h1>Gastronotlar Web</h1><p>Uygulama inşa ediliyor veya index.html bulunamadı (Aranan yol: ${indexPath}). Lütfen Render build komutunu kontrol edin.</p></body></html>`);
    }
  });

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`[api] server listening on port ${port}`);
  });
}

startServer().catch(console.error);
