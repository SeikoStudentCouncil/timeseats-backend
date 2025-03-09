import type { PrismaClient } from "@prisma/client";
import { ProductServiceImpl } from "./product-service-impl.js";
import { SalesSlotServiceImpl } from "./sales-slot-service-impl.js";
import { OrderServiceImpl } from "./order-service-impl.js";
import { OrderTicketServiceImpl } from "./order-ticket-service-impl.js";
import type { ProductService } from "./product-service.js";
import type { SalesSlotService } from "./sales-slot-service.js";
import type { OrderService } from "./order-service.js";
import type { OrderTicketService } from "./order-ticket-service.js";

// Import repository implementations
import { ProductRepositoryImpl } from "../../infrastructure/repositories/product-repository-impl.js";
import { SalesSlotRepositoryImpl } from "../../infrastructure/repositories/sales-slot-repository-impl.js";
import { OrderRepositoryImpl } from "../../infrastructure/repositories/order-repository-impl.js";
import { OrderTicketRepositoryImpl } from "../../infrastructure/repositories/order-ticket-repository-impl.js";

/**
 * サービスファクトリー - 各ドメインサービスのインスタンスを提供します
 */
export class ServiceFactory {
    private readonly productRepository: ProductRepositoryImpl;
    private readonly salesSlotRepository: SalesSlotRepositoryImpl;
    private readonly orderRepository: OrderRepositoryImpl;
    private readonly orderTicketRepository: OrderTicketRepositoryImpl;

    private productService: ProductService | null = null;
    private salesSlotService: SalesSlotService | null = null;
    private orderService: OrderService | null = null;
    private orderTicketService: OrderTicketService | null = null;

    constructor(private readonly prisma: PrismaClient) {
        // リポジトリの初期化
        this.productRepository = new ProductRepositoryImpl(prisma);
        this.salesSlotRepository = new SalesSlotRepositoryImpl(prisma);
        this.orderRepository = new OrderRepositoryImpl(prisma);
        this.orderTicketRepository = new OrderTicketRepositoryImpl(prisma);
    }

    /**
     * 商品サービスのインスタンスを取得します
     */
    getProductService(): ProductService {
        if (!this.productService) {
            this.productService = new ProductServiceImpl(
                this.productRepository
            );
        }
        return this.productService;
    }

    /**
     * 販売枠サービスのインスタンスを取得します
     */
    getSalesSlotService(): SalesSlotService {
        if (!this.salesSlotService) {
            this.salesSlotService = new SalesSlotServiceImpl(
                this.salesSlotRepository,
                this.productRepository
            );
        }
        return this.salesSlotService;
    }

    /**
     * 注文サービスのインスタンスを取得します
     */
    getOrderService(): OrderService {
        if (!this.orderService) {
            this.orderService = new OrderServiceImpl(
                this.orderRepository,
                this.orderTicketRepository,
                this.productRepository
            );
        }
        return this.orderService;
    }

    /**
     * 伝票サービスのインスタンスを取得します
     */
    getOrderTicketService(): OrderTicketService {
        if (!this.orderTicketService) {
            this.orderTicketService = new OrderTicketServiceImpl(
                this.orderTicketRepository,
                this.orderRepository
            );
        }
        return this.orderTicketService;
    }

    /**
     * 全てのサービスインスタンスをリセットします
     * 主にテスト目的で使用します
     */
    resetServices(): void {
        this.productService = null;
        this.salesSlotService = null;
        this.orderService = null;
        this.orderTicketService = null;
    }
}
