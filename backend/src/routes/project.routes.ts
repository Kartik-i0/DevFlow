import { Router } from "express";
import { createProject, getProjects, getProjectById } from "../controllers/project.controller";


const projectRouter = Router();

projectRouter.post('/create', createProject);
projectRouter.get('/all', getProjects);
projectRouter.get('/:id', getProjectById);

export default projectRouter;

