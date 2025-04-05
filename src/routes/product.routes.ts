import { Router } from 'express';
import { 
  getProducts, 
  getProduct, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} from '../controllers/product.controller';

export const productRouter = Router();

// ✅ Get all products
productRouter.get('/', getProducts);

// ✅ Get a single product by ID
productRouter.get('/:id', getProduct);

// ✅ Create a new product
productRouter.post('/', createProduct);

// ✅ Update a product by ID
productRouter.put('/:id', updateProduct);

// ✅ Delete a product by ID
productRouter.delete('/:id', deleteProduct);
