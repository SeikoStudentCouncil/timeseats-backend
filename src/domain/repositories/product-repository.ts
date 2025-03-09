import type { Repository } from "./repository.js";
import type { Product } from "../models/product.js";

export interface ProductRepository extends Repository<Product> {}
