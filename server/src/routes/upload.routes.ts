import { Router } from "express";

import {
  deleteUpload,
  handleUpload,
  listUploads,
} from "../controllers/upload.controller";
import { uploadFiles } from "../middleware/upload.middleware";

const router = Router();

router.get("/", listUploads);
router.post("/", uploadFiles, handleUpload);
router.delete("/:filename", deleteUpload);

export default router;
