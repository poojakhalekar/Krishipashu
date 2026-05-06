import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import animalsRouter from "./animals";
import milkRouter from "./milk";
import vaccinationsRouter from "./vaccinations";
import analyticsRouter from "./analytics";
import notificationsRouter from "./notifications";
import publicRouter from "./public";
import recommendationsRouter from "./recommendations";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(animalsRouter);
router.use(milkRouter);
router.use(vaccinationsRouter);
router.use(analyticsRouter);
router.use(notificationsRouter);
router.use(publicRouter);
router.use(recommendationsRouter);

export default router;
