import { Router } from "express";
import {
  getAllAlertRules,
  getAlertRule,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
} from "../controllers/alertController";

const router = Router();

router.get("/", getAllAlertRules);
router.get("/:id", getAlertRule);
router.post("/", createAlertRule);
router.put("/:id", updateAlertRule);
router.delete("/:id", deleteAlertRule);

export default router;
