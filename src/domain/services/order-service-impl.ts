import type { ID } from "../types/id.js";
import type { Order } from "../models/order.js";
import { OrderStatus } from "../types/order-status.js";
import type { OrderTicket } from "../models/order-ticket.js";
import type { PaymentMethod } from "../types/payment-method.js";
import type { OrderService } from "./order-service.js";
import type { OrderRepository } from "../repositories/order-repository.js";
import type { OrderTicketRepository } from "../repositories/order-ticket-repository.js";
import type { ProductRepository } from "../repositories/product-repository.js";

/**
 * OrderServiceImpl - 注文サービスの実装クラス
 */
export class OrderServiceImpl implements OrderService {
    constructor(
        private readonly orderRepository: OrderRepository,
        private readonly orderTicketRepository: OrderTicketRepository,
        private readonly productRepository: ProductRepository
    ) {}

    async getAllOrders(): Promise<Order[]> {
        return this.orderRepository.findAll();
    }

    async getOrderById(id: ID): Promise<Order | null> {
        return this.orderRepository.findById(id);
    }

    async getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
        return this.orderRepository.findByStatus(status);
    }

    async getOrdersBySalesSlot(salesSlotId: ID): Promise<Order[]> {
        return this.orderRepository.findBySalesSlotId(salesSlotId);
    }

    async createReservation(
        salesSlotId: ID,
        items: Array<{ productId: ID; quantity: number }>
    ): Promise<Order> {
        // 空の注文チェック
        if (items.length === 0) {
            throw new Error("Order must contain at least one item");
        }

        // 各商品の在庫を確認し、仮予約数を増やす
        const inventoryUpdates = [];
        const orderItems = [];
        let totalAmount = 0;

        for (const item of items) {
            // 商品情報を取得
            const product = await this.productRepository.findById(
                item.productId
            );
            if (!product) {
                throw new Error(`Product with ID ${item.productId} not found`);
            }

            // 販売枠の在庫情報を取得
            const inventory =
                await this.productRepository.findInventoryByProductAndSalesSlot(
                    item.productId,
                    salesSlotId
                );
            if (!inventory) {
                throw new Error(
                    `Inventory not found for product ${item.productId} in sales slot ${salesSlotId}`
                );
            }

            // 在庫数チェック
            const availableQuantity =
                inventory.initialQuantity -
                inventory.reservedQuantity -
                inventory.soldQuantity;
            if (availableQuantity < item.quantity) {
                throw new Error(
                    `Not enough inventory for product ${product.name}. Available: ${availableQuantity}, Requested: ${item.quantity}`
                );
            }

            // 在庫の仮予約数を増やす
            inventoryUpdates.push({
                id: inventory.id,
                reservedQuantity: inventory.reservedQuantity + item.quantity,
            });

            // 注文商品情報を作成
            orderItems.push({
                productId: item.productId,
                quantity: item.quantity,
                price: product.price,
            });

            // 合計金額を計算
            totalAmount += product.price * item.quantity;
        }

        try {
            // 在庫の仮予約数を更新
            for (const update of inventoryUpdates) {
                await this.productRepository.updateInventory(update.id, {
                    reservedQuantity: update.reservedQuantity,
                });
            }

            // 注文を作成
            const order = await this.orderRepository.createOrder({
                salesSlotId,
                status: OrderStatus.RESERVED,
                items: orderItems,
                totalAmount,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            return order;
        } catch (error) {
            // エラー発生時は在庫の仮予約をロールバック
            for (const update of inventoryUpdates) {
                try {
                    const inventory =
                        await this.productRepository.findInventoryByProductAndSalesSlot(
                            update.id,
                            salesSlotId
                        );
                    if (inventory) {
                        await this.productRepository.updateInventory(
                            update.id,
                            {
                                reservedQuantity: inventory.reservedQuantity,
                            }
                        );
                    }
                } catch (rollbackError) {
                    console.error("Rollback failed:", rollbackError);
                }
            }
            throw error;
        }
    }

    async confirmOrder(
        orderId: ID,
        paymentMethod: PaymentMethod,
        transactionId?: string
    ): Promise<OrderTicket> {
        // 注文情報を取得
        const order = await this.orderRepository.findById(orderId);
        if (!order) {
            throw new Error(`Order with ID ${orderId} not found`);
        }

        // 注文ステータスのチェック
        if (order.status !== OrderStatus.RESERVED) {
            throw new Error(
                `Order with ID ${orderId} is not in RESERVED status`
            );
        }

        // 既存のチケットがある場合はエラー
        const existingTicket = await this.orderTicketRepository.findByOrderId(
            orderId
        );
        if (existingTicket) {
            throw new Error(`Ticket already exists for order ${orderId}`);
        }

        try {
            // 注文ステータスを更新
            await this.orderRepository.updateStatus(
                orderId,
                OrderStatus.CONFIRMED
            );

            // 在庫数を調整（仮予約数を減らし、販売済み数を増やす）
            for (const item of order.items) {
                const inventory =
                    await this.productRepository.findInventoryByProductAndSalesSlot(
                        item.productId,
                        order.salesSlotId
                    );

                if (inventory) {
                    await this.productRepository.updateInventory(inventory.id, {
                        reservedQuantity:
                            inventory.reservedQuantity - item.quantity,
                        soldQuantity: inventory.soldQuantity + item.quantity,
                    });
                }
            }

            // チケットを作成
            await this.orderTicketRepository.create({
                ticketNumber: this.generateTicketNumber(),
                orderId,
                paymentMethod,
                transactionId,
                isPaid: true,
                isDelivered: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const ticket = await this.orderTicketRepository.findByOrderId(
                orderId
            );
            if (!ticket) {
                throw new Error("Failed to create ticket");
            }

            return ticket;
        } catch (error) {
            // エラー時は注文ステータスを元に戻す
            await this.orderRepository.updateStatus(
                orderId,
                OrderStatus.RESERVED
            );
            throw error;
        }
    }

    async cancelReservation(orderId: ID): Promise<boolean> {
        // 注文情報を取得
        const order = await this.orderRepository.findById(orderId);
        if (!order) {
            throw new Error(`Order with ID ${orderId} not found`);
        }

        // 注文ステータスのチェック
        if (order.status !== OrderStatus.RESERVED) {
            throw new Error(
                `Order with ID ${orderId} is not in RESERVED status`
            );
        }

        try {
            // 注文ステータスを更新
            await this.orderRepository.updateStatus(
                orderId,
                OrderStatus.CANCELED
            );

            // 在庫の仮予約数を戻す
            for (const item of order.items) {
                const inventory =
                    await this.productRepository.findInventoryByProductAndSalesSlot(
                        item.productId,
                        order.salesSlotId
                    );

                if (inventory) {
                    await this.productRepository.updateInventory(inventory.id, {
                        reservedQuantity:
                            inventory.reservedQuantity - item.quantity,
                    });
                }
            }

            return true;
        } catch (error) {
            // エラー時は注文ステータスを元に戻す
            await this.orderRepository.updateStatus(
                orderId,
                OrderStatus.RESERVED
            );
            throw error;
        }
    }

    async getOrderByTicketNumber(ticketNumber: string): Promise<Order | null> {
        const ticket = await this.orderTicketRepository.findByTicketNumber(
            ticketNumber
        );
        if (!ticket) {
            return null;
        }

        return this.orderRepository.findById(ticket.orderId);
    }

    async markOrderAsDelivered(ticketId: ID): Promise<OrderTicket> {
        const ticket = await this.orderTicketRepository.findById(ticketId);
        if (!ticket) {
            throw new Error(`Ticket with ID ${ticketId} not found`);
        }

        // 支払い確認
        if (!ticket.isPaid) {
            throw new Error(`Order is not paid yet for ticket ${ticketId}`);
        }

        // チケット更新
        await this.orderTicketRepository.update(ticketId, {
            isDelivered: true,
            updatedAt: new Date(),
        });

        const updatedTicket = await this.orderTicketRepository.findById(
            ticketId
        );
        if (!updatedTicket) {
            throw new Error("Failed to update ticket");
        }

        return updatedTicket;
    }

    /**
     * チケット番号を生成する補助メソッド
     */
    private generateTicketNumber(): string {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000)
            .toString()
            .padStart(3, "0");
        return `T${timestamp}${random}`;
    }
}
