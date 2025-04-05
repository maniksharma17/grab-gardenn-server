import { Request, Response } from 'express';
import { Category } from '../models/category.model';
import { categorySchema } from '../schemas/category.schema';

export const getCategories = async (req: Request, res: Response) => {
  const categories = await Category.find();
  res.status(200).json(categories)
};

export const getCategory = async (req: Request, res: Response) => {
  const category = await Category.findById(req.params.id).populate('products');
  if (!category) {
    return res.status(404).json({ message: 'Category not found' });
  }
  res.json({ category });
};

export const getCategoryByName = async (req: Request, res: Response) => {
  const category = await Category.find({name: req.params.name}).populate('products');
  if (!category) {
    return res.status(404).json({ message: 'Category not found' });
  }
  res.json({ category });
};



export const createCategory = async (req: Request, res: Response) => {
  try {
    const categoryData = req.body;
    const isValid = categorySchema.safeParse(categoryData);
    if(!isValid.success) {
      res.json({ message: "Invalid data" });
      return;
    }

    const newCategory = await Category.create(categoryData);
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(400).json({ message: "Server error"});
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const categoryData = req.body;
    const isValid = categorySchema.safeParse(categoryData);
    if(!isValid.success) {
      res.json({ message: "Invalid data" });
      return;
    }
    const {id} = req.params;
    const updatedCategory = await Category.findByIdAndUpdate(
      id, 
      categoryData,
      { new: true, runValidators: true }
    );
    res.status(201).json(updatedCategory);
  } catch (error) {
    res.status(400).json({ message: "Server Error" });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const deletedCategory = await Category.findByIdAndDelete(req.params.id);
    if (!deleteCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};