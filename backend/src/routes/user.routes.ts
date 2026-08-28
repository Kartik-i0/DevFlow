import { Router } from "express";
import { createUser, getUsers , loginUser } from "../controllers/user.controller";

const userRouter = Router();


// User routes
userRouter.post('/create', createUser);
userRouter.post('/login', loginUser);
userRouter.get('/all', getUsers);

export default userRouter;