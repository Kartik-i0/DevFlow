import { Router } from "express";
import { createTask, getTasksByProject, updateTaskStatus, deleteTask } from "./task.controller";

const taskRouter = Router();

taskRouter.post('/create', createTask);
taskRouter.get('/project/:projectId', getTasksByProject);
taskRouter.patch('/:id/status', updateTaskStatus);
taskRouter.delete('/:id', deleteTask);

export default taskRouter;


