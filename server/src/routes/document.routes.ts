import { Router } from "express";

import {
  embedDocument,
  extractDocument,
  getDocument,
  saveDocument,
} from "../controllers/document.controller";

const router = Router();

router.post("/:filename/extract", extractDocument);
router.post("/:filename/embed", embedDocument);
router.post("/:filename/save", saveDocument);
router.get("/:filename", getDocument);

export default router;
