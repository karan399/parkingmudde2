import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Simulated Geo-Rules Engine
  app.post("/api/geo-check", (req, res) => {
    const { lat, lng } = req.body;
    // In a real app, this would query a spatial DB for proximity to junctions, hospitals, etc.
    // For this demo, we'll return some mock proximity data based on coordinates
    const isNearJunction = Math.random() > 0.7;
    const isNearHospital = Math.random() > 0.8;
    
    res.json({
      near_junction: isNearJunction,
      near_hospital: isNearHospital,
      geo_score_boost: (isNearJunction ? 25 : 0) + (isNearHospital ? 25 : 0)
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
