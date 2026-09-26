import express from "express";
import cors from "cors";
import "dotenv/config";

import healthRouter from "./routes/health";
import uploadRouter from "./routes/upload.routes";
import documentRouter from "./routes/document.routes";
import chatRouter from "./routes/chat.routes";
import { notFound } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";
import { PUBLIC_DIR } from "./middleware/upload.middleware";
import { PUBLIC_ROUTE } from "./models/upload.model";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(PUBLIC_ROUTE, express.static(PUBLIC_DIR));

app.use("/api/health", healthRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/documents", documentRouter);
app.use("/api/chat", chatRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
