import express from "express";
import multer from "multer";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { storagePut } from "../storage";
import { createContext } from "./context";
import { registerOAuthRoutes } from "./oauth";

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
      cognito: Boolean(
        process.env.VITE_COGNITO_USER_POOL_ID &&
          process.env.VITE_COGNITO_CLIENT_ID,
      ),
      objectStorage: Boolean(
        process.env.AWS_ACCESS_KEY_ID &&
          process.env.AWS_SECRET_ACCESS_KEY &&
          process.env.AWS_S3_BUCKET,
      ),
    };

    res.json({
      status: "ok",
      configured: requiredConfiguration,
    });
  });

  registerOAuthRoutes(app);

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
        req.file.mimetype,
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
    }),
  );

  return app;
}
