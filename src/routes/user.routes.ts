import { Router } from 'express';
import { register, login, logout, getProfile } from '../controllers/user.controller';
import { auth } from '../middleware/auth.middleware';

export const userRouter = Router();

userRouter.post('/register', register);
userRouter.post('/login', login);
userRouter.post('/logout', logout);
userRouter.get('/profile/:id', auth, getProfile);