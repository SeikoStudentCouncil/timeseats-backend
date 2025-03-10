import prisma from "@/infrastructure/database/index.js";

export async function setupDatabase() {
	await prisma.orderItem.deleteMany()
	await prisma.orderTicket.deleteMany();
	await prisma.order.deleteMany();
	await prisma.productInventory.deleteMany();
	await prisma.salesSlot.deleteMany();
	await prisma.product.deleteMany();
}