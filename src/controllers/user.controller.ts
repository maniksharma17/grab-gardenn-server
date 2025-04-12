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
      domain: 'grabgardenn.com'
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
