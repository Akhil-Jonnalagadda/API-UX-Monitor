import { Router } from "express";
import {
  getAllEndpoints,
  getEndpoint,
  createEndpoint,
  updateEndpoint,
  deleteEndpoint,
} from "../controllers/endpointController";

const router = Router();

router.get("/", getAllEndpoints);
router.get("/:id", getEndpoint);
router.post("/", createEndpoint);
router.put("/:id", updateEndpoint);
router.delete("/:id", deleteEndpoint);

export default router;
