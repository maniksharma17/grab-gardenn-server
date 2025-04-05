import { Router } from 'express';
import { 
  getCategories, 
  getCategory, 
  createCategory, 
  updateCategory, 
  deleteCategory, 
  getCategoryByName
} from '../controllers/category.controller';

export const categoryRouter = Router();

// ✅ Get all categories
categoryRouter.get('/', getCategories);

// ✅ Get a single category by ID
categoryRouter.get('/id/:id', getCategory);
categoryRouter.get('/:name', getCategoryByName);

// ✅ Create a new category
categoryRouter.post('/', createCategory);

// ✅ Update a category by ID
categoryRouter.put('/:id', updateCategory);

// ✅ Delete a category by ID
categoryRouter.delete('/:id', deleteCategory);
