import { Request, Response } from 'express';
import { Product } from '../models/product.model';
import { productSchema } from '../schemas/product.schema';

export const getProducts = async (req: Request, res: Response) => {
  const { category, search, sort, page = 1, limit = 30 } = req.query;
  
  const query: any = {};
  if (category) query.category = category;
  if (search) query.name = { $regex: search, $options: 'i' };

  const products = await Product.find(query)
    .sort(sort ? { [sort as string]: -1 } : { createdAt: 1 })
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit));

  const total = await Product.countDocuments(query);

  res.json({
    products,
    total,
    pages: Math.ceil(total / Number(limit)),
    currentPage: Number(page),
  });
};

export const getProduct = async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  res.json({ product });
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const productData = req.body;
    const isValid = productSchema.safeParse(productData);
    if(!isValid.success) {
      res.json({ message: "Invalid data" });
      return;
    }

    const newProduct = await Product.create(productData);
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(400).json({ message: "Server error"});
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const productData = req.body;
    const isValid = productSchema.safeParse(productData);
    if(!isValid.success) {
      res.json({ message: "Invalid data" });
      return;
    }
    const {id} = req.params;
    const updatedProduct = await Product.findByIdAndUpdate(
      id, 
      productData,
      { new: true, runValidators: true }
    );
    res.status(201).json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: "Server Error" });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};