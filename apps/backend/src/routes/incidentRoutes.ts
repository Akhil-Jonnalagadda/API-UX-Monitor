import { Router } from "express";
import {
  getAllIncidents,
  getIncident,
  getIncidentReplay,
  resolveIncident,
  getIncidentStats,
} from "../controllers/incidentController";

const router = Router();

router.get("/stats", getIncidentStats);
router.get("/", getAllIncidents);
router.get("/:id/replay", getIncidentReplay);
router.put("/:id/resolve", resolveIncident);
router.get("/:id", getIncident);

export default router;
