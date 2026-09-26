import express from "express";
import cors from "cors";
import "dotenv/config";

import healthRouter from "./routes/health";
import { notFound } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/api/health", healthRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
