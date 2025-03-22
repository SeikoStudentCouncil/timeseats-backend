package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http/httptest"
	"testing"

	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/models"
	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/services"
	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/types"
	"github.com/gofiber/fiber/v2"
)

type mockOrderService struct {
	orders map[types.ID]*models.Order
}

func newMockOrderService() *mockOrderService {
	return &mockOrderService{
		orders: make(map[types.ID]*models.Order),
	}
}

func (s *mockOrderService) CreateOrder(ctx context.Context, salesSlotID types.ID, items []services.OrderItemInput) (*models.Order, error) {
	order := &models.Order{
		ID:          types.ID("test-id"),
		SalesSlotID: salesSlotID,
		Status:      types.RESERVED,
		TotalAmount: 0,
		Items:       []models.OrderItem{},
	}

	for _, item := range items {
		orderItem := models.OrderItem{
			ProductID: item.ProductID,
			Quantity:  item.Quantity,
			Price:     1000, // Mock price
		}
		order.Items = append(order.Items, orderItem)
		order.TotalAmount += orderItem.Price * orderItem.Quantity
	}

	s.orders[order.ID] = order
	return order, nil
}

func (s *mockOrderService) GetOrder(ctx context.Context, id types.ID) (*models.Order, error) {
	if order, exists := s.orders[id]; exists {
		return order, nil
	}
	return nil, &services.ServiceError{Message: "Order not found"}
}

func (s *mockOrderService) GetAllOrders(ctx context.Context) ([]models.Order, error) {
	var orders []models.Order
	for _, order := range s.orders {
		orders = append(orders, *order)
	}
	return orders, nil
}

func (s *mockOrderService) GetOrdersByStatus(ctx context.Context, status types.OrderStatus) ([]models.Order, error) {
	var orders []models.Order
	for _, order := range s.orders {
		if order.Status == status {
			orders = append(orders, *order)
		}
	}
	return orders, nil
}

func (s *mockOrderService) UpdateOrderStatus(ctx context.Context, id types.ID, status types.OrderStatus) error {
	if order, exists := s.orders[id]; exists {
		order.Status = status
		return nil
	}
	return &services.ServiceError{Message: "Order not found"}
}

func (s *mockOrderService) CancelOrder(ctx context.Context, id types.ID) error {
	return s.UpdateOrderStatus(ctx, id, types.CANCELLED)
}

func (s *mockOrderService) AddOrderItems(ctx context.Context, orderID types.ID, items []services.OrderItemInput) error {
	order, exists := s.orders[orderID]
	if !exists {
		return &services.ServiceError{Message: "Order not found"}
	}

	for _, item := range items {
		orderItem := models.OrderItem{
			ProductID: item.ProductID,
			Quantity:  item.Quantity,
			Price:     1000, // Mock price
		}
		order.Items = append(order.Items, orderItem)
		order.TotalAmount += orderItem.Price * orderItem.Quantity
	}
	return nil
}

func TestOrderHandler_Create(t *testing.T) {
	app := fiber.New()
	mockService := newMockOrderService()
	handler := NewOrderHandler(mockService)

	app.Post("/orders", handler.Create)

	reqBody := CreateOrderRequest{
		SalesSlotID: "test-slot-id",
		Items: []OrderItemCreateInput{
			{
				ProductID: "test-product-id",
				Quantity:  2,
			},
		},
	}
	body, _ := json.Marshal(reqBody)

	req := httptest.NewRequest("POST", "/orders", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)

	if err != nil {
		t.Fatalf("Failed to test request: %v", err)
	}

	if resp.StatusCode != fiber.StatusCreated {
		t.Errorf("Expected status code %d, got %d", fiber.StatusCreated, resp.StatusCode)
	}

	var response OrderResponse
	json.NewDecoder(resp.Body).Decode(&response)

	if response.Status != types.RESERVED.String() {
		t.Errorf("Expected order status %s, got %s", types.RESERVED, response.Status)
	}
}

func TestOrderHandler_Cancel(t *testing.T) {
	app := fiber.New()
	mockService := newMockOrderService()
	handler := NewOrderHandler(mockService)

	ctx := context.Background()
	items := []services.OrderItemInput{
		{
			ProductID: types.ID("test-product-id"),
			Quantity:  2,
		},
	}
	order, _ := mockService.CreateOrder(ctx, types.ID("test-slot-id"), items)

	app.Put("/orders/:id/cancel", handler.Cancel)

	req := httptest.NewRequest("PUT", "/orders/"+string(order.ID)+"/cancel", nil)
	resp, err := app.Test(req)

	if err != nil {
		t.Fatalf("Failed to test request: %v", err)
	}

	if resp.StatusCode != fiber.StatusOK {
		t.Errorf("Expected status code %d, got %d", fiber.StatusOK, resp.StatusCode)
	}

	var response OrderResponse
	json.NewDecoder(resp.Body).Decode(&response)

	if response.Status != types.CANCELLED.String() {
		t.Errorf("Expected order status %s, got %s", types.CANCELLED, response.Status)
	}
}

func TestOrderHandler_AddItems(t *testing.T) {
	app := fiber.New()
	mockService := newMockOrderService()
	handler := NewOrderHandler(mockService)

	ctx := context.Background()
	items := []services.OrderItemInput{
		{
			ProductID: types.ID("test-product-id"),
			Quantity:  2,
		},
	}
	order, _ := mockService.CreateOrder(ctx, types.ID("test-slot-id"), items)

	app.Post("/orders/:id/items", handler.AddItems)

	reqBody := []OrderItemCreateInput{
		{
			ProductID: "test-product-id-2",
			Quantity:  3,
		},
	}
	body, _ := json.Marshal(reqBody)

	req := httptest.NewRequest("POST", "/orders/"+string(order.ID)+"/items", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)

	if err != nil {
		t.Fatalf("Failed to test request: %v", err)
	}

	if resp.StatusCode != fiber.StatusOK {
		t.Errorf("Expected status code %d, got %d", fiber.StatusOK, resp.StatusCode)
	}

	var response OrderResponse
	json.NewDecoder(resp.Body).Decode(&response)

	if len(response.Items) != 2 {
		t.Errorf("Expected 2 items, got %d", len(response.Items))
	}
}
