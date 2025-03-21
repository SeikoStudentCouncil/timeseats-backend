package services

import (
	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/repositories"
)

// ServiceFactory manages all service instances
type ServiceFactory interface {
	ProductService() ProductService
	SalesSlotService() SalesSlotService
	OrderService() OrderService
	OrderTicketService() OrderTicketService
}

type serviceFactory struct {
	productService     ProductService
	salesSlotService   SalesSlotService
	orderService       OrderService
	orderTicketService OrderTicketService
}

// NewServiceFactory creates a new service factory instance
func NewServiceFactory(
	productRepo repositories.ProductRepository,
	salesSlotRepo repositories.SalesSlotRepository,
	productInventoryRepo repositories.ProductInventoryRepository,
	orderRepo repositories.OrderRepository,
	orderTicketRepo repositories.OrderTicketRepository,
) ServiceFactory {
	productSvc := NewProductService(productRepo)
	salesSlotSvc := NewSalesSlotService(salesSlotRepo, productInventoryRepo, productRepo)
	orderSvc := NewOrderService(orderRepo, salesSlotRepo, productInventoryRepo, productRepo)
	orderTicketSvc := NewOrderTicketService(orderTicketRepo, orderRepo)

	return &serviceFactory{
		productService:     productSvc,
		salesSlotService:   salesSlotSvc,
		orderService:       orderSvc,
		orderTicketService: orderTicketSvc,
	}
}

func (f *serviceFactory) ProductService() ProductService {
	return f.productService
}

func (f *serviceFactory) SalesSlotService() SalesSlotService {
	return f.salesSlotService
}

func (f *serviceFactory) OrderService() OrderService {
	return f.orderService
}

func (f *serviceFactory) OrderTicketService() OrderTicketService {
	return f.orderTicketService
}
