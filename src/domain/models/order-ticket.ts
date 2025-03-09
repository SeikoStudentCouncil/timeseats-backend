import type { ID } from "../types/id.js";
import type { PaymentMethod } from "../types/payment-method.js";

export interface OrderTicket {
    id: ID;
    ticketNumber: string;
    orderId: ID;
    paymentMethod: PaymentMethod;
    transactionId?: string;
    isPaid: boolean;
    isDelivered: boolean;
    createdAt: Date;
    updatedAt: Date;
}
