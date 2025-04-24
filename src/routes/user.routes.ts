import { Router } from 'express';
import { register, login, logout, getProfile, addAddress, deleteAddress, updateAddress, forgotPassword, resetPassword, completeProfile, oAuthLogin } from '../controllers/user.controller';
import { auth } from '../middleware/auth.middleware';

export const userRouter = Router();

userRouter.post('/register', register);
userRouter.post('/login', login);
userRouter.post('/logout', logout);
userRouter.post('/oauth-login', oAuthLogin);
userRouter.patch('/complete-profile/:id', auth, completeProfile);
userRouter.get('/profile/:id', auth, getProfile);
userRouter.put('/:id/address', auth, addAddress)
userRouter.put('/:userId/:addressId', auth, updateAddress);
userRouter.delete('/:userId/:addressId', auth, deleteAddress);
userRouter.post('/forgot-password', forgotPassword);
userRouter.post('/reset-password/:token', resetPassword);