import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import { userSchema, loginSchema } from '../schemas/user.schema';

export const register = async (req: Request, res: Response) => {
  try {
    const isValid = userSchema.safeParse(req.body);
    console.log(req.body)

    if(!isValid.success) {
      res.status(400).json({ message: 'Invalid email and password', errors: isValid.error.errors });
      return;
    }

    const existingUser = await User.findOne({email: req.body.email})
    if(existingUser){
      res.json({message: "Account already registered with this email.", error: true})
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
      domain: 'grabgardenn.com'
    });

    res.status(201).json({ user: { ...user.toObject(), password: undefined }, token });
  } catch (error) {
    res.json({message: error})
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const user = await User.findOne({ email: validatedData.email });

    if (!user) {
      return res.json({ error: true, message: 'Email not registered' });
    }

    const isValidPassword = await bcrypt.compare(validatedData.password, user.password);
    if (!isValidPassword) {
      return res.json({ error: true, message: 'Incorrect email and password' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'secret',
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
       sameSite: 'lax',
      domain: 'grabgardenn.com'
    });

    res.json({ user: { ...user.toObject(), password: undefined }, token });
  } catch (error) {
    return res.status(500).json({ message: 'Some server error occured' });
  }
};

export const logout = (req: Request, res: Response) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
     sameSite: 'lax',
      domain: 'grabgardenn.com'
  });
  res.json({ message: 'Logged out successfully' });
};

export const getProfile = async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id).select('-password');
  res.json({ user });
};

export const addAddress = async (req: Request, res: Response) => {
  try{
    const { name, phone, street, streetOptional, city, state, zipCode, country } = req.body;

    if (!street || !city || !state || !zipCode || !country) {
      return res.status(400).json({ message: "Missing required address fields" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const newAddress = {
      street,
      streetOptional,
      city,
      state,
      zipCode,
      country,
      name,
      phone
    };

    user.address.push(newAddress);
    await user.save();

    res.status(200).json({ message: "Address added successfully", addresses: user.address });
  } catch (error) {
    res.status(500).json({ message: "Server error", error })
  }
};

export const deleteAddress = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const addressId = req.params.addressId;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.address.pull({_id: addressId});
    await user.save();

    res.status(200).json({ message: "Address deleted successfully", addresses: user.address });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const updateAddress = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const addressId = req.params.addressId;
    const { street, streetOptional, city, state, zipCode, country, name, phone } = req.body;

    if (!street || !city || !state || !zipCode || !country) {
      return res.status(400).json({ message: "Missing required address fields" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const address = user.address.id(addressId);
    if (!address) return res.status(404).json({ message: "Address not found" });

    address.street = street;
    address.streetOptional = streetOptional;
    address.city = city;
    address.state = state;
    address.zipCode = zipCode;
    address.country = country;
    address.name = name;
    address.phone = phone;

    await user.save();

    res.status(200).json({ message: "Address updated successfully", addresses: user.address });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

import crypto from 'crypto';
import nodemailer from 'nodemailer';

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "Email not registered" });

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.resetPasswordToken = resetTokenHash;
  user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); 

  await user.save();

  const resetURL = `https://grabgardenn.com/reset-password/${resetToken}`;

  // send mail using nodemailer (free SMTP config)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_EMAIL, // your Gmail
      pass: process.env.SMTP_PASS   // app password
    }
  });

  await transporter.sendMail({
    from: `"Grab Gardenn" <${process.env.SMTP_EMAIL}>`,
    to: user.email,
    subject: 'Password Reset Request',
    html: `<p>Click the link to reset your password:</p><a href="${resetURL}">${resetURL}</a><p>This link is valid for 15 minutes.</p>`
  });

  res.status(200).json({ message: "Reset email sent successfully" });
};


export const resetPassword = async (req: Request, res: Response) => {
  const { token } = req.params;
  const { password } = req.body;

  const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: resetTokenHash,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) return res.status(400).json({ message: "Invalid or expired token" });

  const hashedPassword = await bcrypt.hash(password, 10);
  user.password = hashedPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  res.status(200).json({ message: "Password reset successfully" });
};

