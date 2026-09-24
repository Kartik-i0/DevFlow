import { Router } from "express";
import { createUser, getUsers, loginUser } from "../controllers/user.controller";
import { validateBody } from "../middleware/validate.middleware";
import { validateRegister, validateLogin } from "../validators/auth.validator";

const userRouter = Router();

// User auth & profile routes
userRouter.post('/create', validateBody(validateRegister), createUser);
userRouter.post('/register', validateBody(validateRegister), createUser);
userRouter.post('/login', validateBody(validateLogin), loginUser);
userRouter.get('/all', getUsers);

export default userRouter;