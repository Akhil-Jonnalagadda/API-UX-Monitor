import { Router } from "express";
import {
  getAllIncidents,
  getIncident,
  getIncidentReplay,
  resolveIncident,
  getIncidentStats,
} from "../controllers/incidentController";

const router = Router();

router.get("/", getAllIncidents);
router.get("/stats", getIncidentStats);
router.get("/:id", getIncident);
router.get("/:id/replay", getIncidentReplay);
router.put("/:id/resolve", resolveIncident);

export default router;
