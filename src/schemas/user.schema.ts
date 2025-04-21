import { z } from 'zod';

export const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  address: z.array(z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string(),
  })).optional(),
});

export const loginSchema = z.object({
  emailOrPhone: z.string().min(3),
  password: z.string(),
});