import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import { userSchema, loginSchema } from '../schemas/user.schema';

export const register = async (req: Request, res: Response) => {
  try {
    const isValid = userSchema.safeParse(req.body);

    if(!isValid.success) {
      res.status(400).json({ message: 'Invalid email and password', errors: isValid.error.errors });
      return;
    }

    const user = await User.create(req.body);
    
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'secret',
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      domain: 'grab-gardenn.vercel.app'
    });

    res.status(201).json({ user: { ...user.toObject(), password: undefined }, token });
  } catch (error) {
    throw error;
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const user = await User.findOne({ email: validatedData.email });

    if (!user) {
      return res.status(401).json({ message: 'Incorrect email and password' });
    }

    const isValidPassword = await bcrypt.compare(validatedData.password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Incorrect email and password' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'secret',
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      domain: 'grab-gardenn.vercel.app'
    });

    res.json({ user: { ...user.toObject(), password: undefined }, token });
  } catch (error) {
    throw error;
  }
};

export const logout = (req: Request, res: Response) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
    sameSite: 'lax',
    domain: 'grab-gardenn.vercel.app'
  });
  res.json({ message: 'Logged out successfully' });
};

export const getProfile = async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id).select('-password');
  res.json({ user });
};