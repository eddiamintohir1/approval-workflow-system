import express from "express";
import multer from "multer";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { storagePut } from "../storage";
import { createContext } from "./context";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
});

export function createApiApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "4mb" }));
  app.use(express.urlencoded({ limit: "4mb", extended: true }));

  app.get("/api/health", (_req, res) => {
    const requiredConfiguration = {
      database: Boolean(process.env.DATABASE_URL),
      microsoftEntra: Boolean(
        (process.env.ENTRA_TENANT_ID || process.env.VITE_ENTRA_TENANT_ID) &&
          (process.env.ENTRA_CLIENT_ID || process.env.VITE_ENTRA_CLIENT_ID)
      ),
      azureBlobStorage: Boolean(process.env.AZURE_STORAGE_CONNECTION_STRING),
      microsoftGraphEmail: Boolean(
        process.env.GRAPH_TENANT_ID &&
          process.env.GRAPH_CLIENT_ID &&
          process.env.GRAPH_CLIENT_SECRET &&
          process.env.GRAPH_SENDER_MAILBOX
      ),
    };

    res.json({
      status: "ok",
      platform: "microsoft-365",
      configured: requiredConfiguration,
    });
  });

  app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "-");
      const fileKey = `esignature-uploads/${Date.now()}-${safeName}`;
      const { url } = await storagePut(
        fileKey,
        req.file.buffer,
        req.file.mimetype
      );

      return res.json({ url });
    } catch (error) {
      console.error("File upload error:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to upload file",
      });
    }
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  return app;
}
