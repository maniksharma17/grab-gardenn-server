import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(2),
  hindiName: z.string().min(2).optional(),
  description: z.string().min(10),
  price: z.array(z.number().positive()),
  cutoffPrice: z.array(z.number().positive()),
  variants: z.array(z.object({
    display: z.string().min(1),
    value: z.number().positive().optional(),
  })),
  dimensions: z.array(z.object({
    length: z.number().positive(),
    breadth: z.number().positive(),
    height: z.number().positive(),
  })),
  images: z.array(z.string().url()).optional(),
  category: z.string(),
  benefits: z.array(z.string()),
  ingredients: z.array(z.string()),
  storage: z.string().min(5),
  instructions: z.array(z.string()),
  stock: z.number(),
});
