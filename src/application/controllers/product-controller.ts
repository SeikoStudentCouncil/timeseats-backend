import type { Context } from "hono";
import type { ProductService } from "../../domain/services/product-service.js";

export class ProductController {
    constructor(private readonly productService: ProductService) {}

    async getAllProducts(c: Context) {
        try {
            const products = await this.productService.getAllProducts();
            return c.json(products);
        } catch (error) {
            return c.json(
                {
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    }

    async getProductById(c: Context) {
        try {
            const id = c.req.param("id");
            const product = await this.productService.getProductById(id);
            if (!product) {
                return c.json({ error: "Product not found" }, 404);
            }
            return c.json(product);
        } catch (error) {
            return c.json(
                {
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    }

    async createProduct(c: Context) {
        try {
            const data = await c.req.json();
            const product = await this.productService.createProduct(data);
            return c.json(product, 201);
        } catch (error) {
            return c.json(
                {
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    }

    async updateProduct(c: Context) {
        try {
            const id = c.req.param("id");
            const data = await c.req.json();
            const product = await this.productService.updateProduct(id, data);
            if (!product) {
                return c.json({ error: "Product not found" }, 404);
            }
            return c.json(product);
        } catch (error) {
            return c.json(
                {
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    }

    async deleteProduct(c: Context) {
        try {
            const id = c.req.param("id");
            await this.productService.deleteProduct(id);
            return c.body(null, 204);
        } catch (error) {
            return c.json(
                {
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    }

    async setProductInventory(c: Context) {
        try {
            const productId = c.req.param("id");
            const { salesSlotId, initialQuantity } = await c.req.json();
            const inventory = await this.productService.setProductInventory(
                salesSlotId,
                productId,
                initialQuantity
            );
            return c.json(inventory);
        } catch (error) {
            return c.json(
                {
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    }

    async getProductInventory(c: Context) {
        try {
            const productId = c.req.param("id");
            const salesSlotId = c.req.param("salesSlotId");
            const inventory = await this.productService.getProductInventory(
                productId,
                salesSlotId
            );
            if (!inventory) {
                return c.json({ error: "Inventory not found" }, 404);
            }
            return c.json(inventory);
        } catch (error) {
            return c.json(
                {
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    }

    async getInventoryForProduct(c: Context) {
        try {
            const productId = c.req.param("id");
            const inventories =
                await this.productService.getInventoryForProduct(productId);
            return c.json(inventories);
        } catch (error) {
            return c.json(
                {
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    }
}
