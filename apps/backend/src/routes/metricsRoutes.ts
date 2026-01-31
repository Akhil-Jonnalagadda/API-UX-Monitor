import { Router } from "express";
import {
  getLatestChecks,
  getTimeseries,
  getUptime,
  getDashboardMetrics,
} from "../controllers/metricsController";

const router = Router();

router.get("/latest", getLatestChecks);
router.get("/timeseries", getTimeseries);
router.get("/uptime", getUptime);
router.get("/dashboard", getDashboardMetrics);

export default router;
