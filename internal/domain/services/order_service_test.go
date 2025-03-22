package services

import (
	"context"
	"testing"

	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/models"
	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/repositories"
	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/types"
)

type mockOrderRepository struct {
	orders map[types.ID]*models.Order
}

func newMockOrderRepository() *mockOrderRepository {
	return &mockOrderRepository{
		orders: make(map[types.ID]*models.Order),
	}
}

func (r *mockOrderRepository) Create(ctx context.Context, order *models.Order) error {
	r.orders[order.ID] = order
	return nil
}

func (r *mockOrderRepository) FindByID(ctx context.Context, id types.ID) (*models.Order, error) {
	if order, exists := r.orders[id]; exists {
		return order, nil
	}
	return nil, repositories.NewErrNotFound("Order", id)
}

func (r *mockOrderRepository) FindAll(ctx context.Context) ([]models.Order, error) {
	var orders []models.Order
	for _, o := range r.orders {
		orders = append(orders, *o)
	}
	return orders, nil
}

func (r *mockOrderRepository) Update(ctx context.Context, order *models.Order) error {
	if _, exists := r.orders[order.ID]; !exists {
		return repositories.NewErrNotFound("Order", order.ID)
	}
	r.orders[order.ID] = order
	return nil
}

func (r *mockOrderRepository) Delete(ctx context.Context, id types.ID) error {
	if _, exists := r.orders[id]; !exists {
		return repositories.NewErrNotFound("Order", id)
	}
	delete(r.orders, id)
	return nil
}

func (r *mockOrderRepository) FindBySalesSlotID(ctx context.Context, salesSlotID types.ID) ([]models.Order, error) {
	var orders []models.Order
	for _, o := range r.orders {
		if o.SalesSlotID == salesSlotID {
			orders = append(orders, *o)
		}
	}
	return orders, nil
}

func (r *mockOrderRepository) FindByStatus(ctx context.Context, status types.OrderStatus) ([]models.Order, error) {
	var orders []models.Order
	for _, o := range r.orders {
		if o.Status == status {
			orders = append(orders, *o)
		}
	}
	return orders, nil
}

func (r *mockOrderRepository) UpdateStatus(ctx context.Context, id types.ID, status types.OrderStatus) error {
	order, exists := r.orders[id]
	if !exists {
		return repositories.NewErrNotFound("Order", id)
	}
	order.Status = status
	return nil
}

func (r *mockOrderRepository) AddItems(ctx context.Context, orderID types.ID, items []models.OrderItem) error {
	order, exists := r.orders[orderID]
	if !exists {
		return repositories.NewErrNotFound("Order", orderID)
	}
	order.Items = append(order.Items, items...)
	return nil
}

func (r *mockOrderRepository) CreateWithItems(ctx context.Context, order *models.Order, items []models.OrderItem) error {
	order.Items = items
	r.orders[order.ID] = order
	return nil
}

func TestOrderService_CreateOrder(t *testing.T) {
	orderRepo := newMockOrderRepository()
	slotRepo := newMockSalesSlotRepository()
	invRepo := newMockInventoryRepository()
	prodRepo := newMockProductRepository()
	service := NewOrderService(orderRepo, slotRepo, invRepo, prodRepo)
	ctx := context.Background()

	// Create test data
	slot := &models.SalesSlot{
		ID:       types.ID("slot1"),
		IsActive: true,
	}
	slotRepo.Create(ctx, slot)

	product := &models.Product{
		ID:    types.ID("prod1"),
		Name:  "Test Product",
		Price: 1000,
	}
	prodRepo.Create(ctx, product)

	inventory := &models.ProductInventory{
		ID:              types.ID("inv1"),
		SalesSlotID:     slot.ID,
		ProductID:       product.ID,
		InitialQuantity: 10,
	}
	invRepo.Create(ctx, inventory)

	// Test order creation
	items := []OrderItemInput{
		{
			ProductID: product.ID,
			Quantity:  2,
		},
	}

	order, err := service.CreateOrder(ctx, slot.ID, items)
	if err != nil {
		t.Errorf("CreateOrder failed: %v", err)
	}

	if order.Status != types.RESERVED {
		t.Errorf("Expected order status %v, got %v", types.RESERVED, order.Status)
	}

	if order.TotalAmount != 2000 {
		t.Errorf("Expected total amount 2000, got %d", order.TotalAmount)
	}

	if len(order.Items) != 1 {
		t.Errorf("Expected 1 item, got %d", len(order.Items))
	}
}

func TestOrderService_CancelOrder(t *testing.T) {
	orderRepo := newMockOrderRepository()
	slotRepo := newMockSalesSlotRepository()
	invRepo := newMockInventoryRepository()
	prodRepo := newMockProductRepository()
	service := NewOrderService(orderRepo, slotRepo, invRepo, prodRepo)
	ctx := context.Background()

	// Create test data
	slot := &models.SalesSlot{
		ID:       types.ID("slot1"),
		IsActive: true,
	}
	slotRepo.Create(ctx, slot)

	product := &models.Product{
		ID:    types.ID("prod1"),
		Name:  "Test Product",
		Price: 1000,
	}
	prodRepo.Create(ctx, product)

	inventory := &models.ProductInventory{
		ID:              types.ID("inv1"),
		SalesSlotID:     slot.ID,
		ProductID:       product.ID,
		InitialQuantity: 10,
	}
	invRepo.Create(ctx, inventory)

	items := []OrderItemInput{
		{
			ProductID: product.ID,
			Quantity:  2,
		},
	}

	order, _ := service.CreateOrder(ctx, slot.ID, items)

	// Test order cancellation
	err := service.CancelOrder(ctx, order.ID)
	if err != nil {
		t.Errorf("CancelOrder failed: %v", err)
	}

	order, _ = service.GetOrder(ctx, order.ID)
	if order.Status != types.CANCELLED {
		t.Errorf("Expected order status %v, got %v", types.CANCELLED, order.Status)
	}
}
