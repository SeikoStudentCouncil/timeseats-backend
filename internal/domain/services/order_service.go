package services

import (
	"context"

	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/models"
	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/repositories"
	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/types"
)

type OrderService interface {
	CreateOrder(ctx context.Context, salesSlotID types.ID, items []OrderItemInput) (*models.Order, error)
	GetOrder(ctx context.Context, id types.ID) (*models.Order, error)
	GetAllOrders(ctx context.Context) ([]models.Order, error)
	GetOrdersByStatus(ctx context.Context, status types.OrderStatus) ([]models.Order, error)
	UpdateOrderStatus(ctx context.Context, id types.ID, status types.OrderStatus) error
	CancelOrder(ctx context.Context, id types.ID) error
	AddOrderItems(ctx context.Context, orderID types.ID, items []OrderItemInput) error
}

type OrderItemInput struct {
	ProductID types.ID
	Quantity  int
}

type orderService struct {
	orderRepo   repositories.OrderRepository
	slotRepo    repositories.SalesSlotRepository
	invRepo     repositories.ProductInventoryRepository
	productRepo repositories.ProductRepository
}

func NewOrderService(
	orderRepo repositories.OrderRepository,
	slotRepo repositories.SalesSlotRepository,
	invRepo repositories.ProductInventoryRepository,
	productRepo repositories.ProductRepository,
) OrderService {
	return &orderService{
		orderRepo:   orderRepo,
		slotRepo:    slotRepo,
		invRepo:     invRepo,
		productRepo: productRepo,
	}
}

func (s *orderService) CreateOrder(ctx context.Context, salesSlotID types.ID, items []OrderItemInput) (*models.Order, error) {
	slot, err := s.slotRepo.FindByID(ctx, salesSlotID)
	if err != nil {
		return nil, err
	}
	if !slot.IsActive {
		return nil, &ServiceError{Message: "販売枠がアクティブではありません"}
	}

	var orderItems []models.OrderItem
	totalAmount := 0

	for _, item := range items {
		product, err := s.productRepo.FindByID(ctx, item.ProductID)
		if err != nil {
			return nil, err
		}

		inventory, err := s.invRepo.FindBySalesSlotAndProduct(ctx, salesSlotID, item.ProductID)
		if err != nil {
			return nil, err
		}

		if inventory.GetAvailableQuantity() < item.Quantity {
			return nil, ErrInsufficientInventory
		}

		orderItems = append(orderItems, models.OrderItem{
			ProductID: item.ProductID,
			Quantity:  item.Quantity,
			Price:     product.Price,
		})

		totalAmount += product.Price * item.Quantity
	}

	order := &models.Order{
		SalesSlotID: salesSlotID,
		Status:      types.RESERVED,
		TotalAmount: totalAmount,
	}

	err = s.orderRepo.CreateWithItems(ctx, order, orderItems)
	if err != nil {
		return nil, err
	}

	for _, item := range orderItems {
		inventory, _ := s.invRepo.FindBySalesSlotAndProduct(ctx, salesSlotID, item.ProductID)
		err = s.invRepo.UpdateQuantities(ctx, inventory.ID, inventory.ReservedQuantity+item.Quantity, inventory.SoldQuantity)
		if err != nil {
			return nil, err
		}
	}

	return order, nil
}

func (s *orderService) GetOrder(ctx context.Context, id types.ID) (*models.Order, error) {
	return s.orderRepo.FindByID(ctx, id)
}

func (s *orderService) GetAllOrders(ctx context.Context) ([]models.Order, error) {
	return s.orderRepo.FindAll(ctx)
}

func (s *orderService) GetOrdersByStatus(ctx context.Context, status types.OrderStatus) ([]models.Order, error) {
	return s.orderRepo.FindByStatus(ctx, status)
}

func (s *orderService) UpdateOrderStatus(ctx context.Context, id types.ID, status types.OrderStatus) error {
	order, err := s.orderRepo.FindByID(ctx, id)
	if err != nil {
		return err
	}

	switch status {
	case types.CONFIRMED:
		if order.Status != types.RESERVED {
			return ErrInvalidOrderStatus
		}
	case types.CANCELLED:
		if order.Status != types.RESERVED {
			return ErrInvalidOrderStatus
		}
	default:
		return ErrInvalidOrderStatus
	}

	if status == types.CONFIRMED {
		for _, item := range order.Items {
			inventory, _ := s.invRepo.FindBySalesSlotAndProduct(ctx, order.SalesSlotID, item.ProductID)
			err = s.invRepo.UpdateQuantities(ctx, inventory.ID,
				inventory.ReservedQuantity-item.Quantity,
				inventory.SoldQuantity+item.Quantity)
			if err != nil {
				return err
			}
		}
	} else if status == types.CANCELLED {
		for _, item := range order.Items {
			inventory, _ := s.invRepo.FindBySalesSlotAndProduct(ctx, order.SalesSlotID, item.ProductID)
			err = s.invRepo.UpdateQuantities(ctx, inventory.ID,
				inventory.ReservedQuantity-item.Quantity,
				inventory.SoldQuantity)
			if err != nil {
				return err
			}
		}
	}

	return s.orderRepo.UpdateStatus(ctx, id, status)
}

func (s *orderService) CancelOrder(ctx context.Context, id types.ID) error {
	return s.UpdateOrderStatus(ctx, id, types.CANCELLED)
}

func (s *orderService) AddOrderItems(ctx context.Context, orderID types.ID, items []OrderItemInput) error {
	order, err := s.orderRepo.FindByID(ctx, orderID)
	if err != nil {
		return err
	}

	if order.Status != types.RESERVED {
		return ErrInvalidOrderStatus
	}

	var orderItems []models.OrderItem
	additionalAmount := 0

	for _, item := range items {
		product, err := s.productRepo.FindByID(ctx, item.ProductID)
		if err != nil {
			return err
		}

		inventory, err := s.invRepo.FindBySalesSlotAndProduct(ctx, order.SalesSlotID, item.ProductID)
		if err != nil {
			return err
		}

		if inventory.GetAvailableQuantity() < item.Quantity {
			return ErrInsufficientInventory
		}

		orderItems = append(orderItems, models.OrderItem{
			OrderID:   orderID,
			ProductID: item.ProductID,
			Quantity:  item.Quantity,
			Price:     product.Price,
		})

		additionalAmount += product.Price * item.Quantity
	}

	err = s.orderRepo.AddItems(ctx, orderID, orderItems)
	if err != nil {
		return err
	}

	for _, item := range orderItems {
		inventory, _ := s.invRepo.FindBySalesSlotAndProduct(ctx, order.SalesSlotID, item.ProductID)
		err = s.invRepo.UpdateQuantities(ctx, inventory.ID,
			inventory.ReservedQuantity+item.Quantity,
			inventory.SoldQuantity)
		if err != nil {
			return err
		}
	}

	order.TotalAmount += additionalAmount
	return s.orderRepo.Update(ctx, order)
}
