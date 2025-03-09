import { createApiRouter } from "./api/routes/index.js";
import { ProductController } from "./application/controllers/product-controller.js";
import { OrderController } from "./application/controllers/order-controller.js";
import { OrderTicketController } from "./application/controllers/order-ticket-controller.js";
import { SalesSlotController } from "./application/controllers/sales-slot-controller.js";
import { ServiceFactory } from "./domain/services/service-factory.js";
import prisma from "./infrastructure/database/index.js";

const serviceFactory = new ServiceFactory(prisma);
const productService = serviceFactory.getProductService();
const orderService = serviceFactory.getOrderService();
const orderTicketService = serviceFactory.getOrderTicketService();
const salesSlotService = serviceFactory.getSalesSlotService();

const productController = new ProductController(productService);
const orderController = new OrderController(orderService);
const orderTicketController = new OrderTicketController(orderTicketService);
const salesSlotController = new SalesSlotController(salesSlotService);

const api = createApiRouter({
    productController,
    orderController,
    orderTicketController,
    salesSlotController,
});

export default api;
