package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http/httptest"
	"net/url"
	"testing"
	"time"

	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/models"
	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/services"
	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/types"
	"github.com/gofiber/fiber/v2"
)

type mockSalesSlotService struct {
	slots       map[types.ID]*models.SalesSlot
	inventories map[types.ID]*models.ProductInventory
}

func newMockSalesSlotService() *mockSalesSlotService {
	return &mockSalesSlotService{
		slots:       make(map[types.ID]*models.SalesSlot),
		inventories: make(map[types.ID]*models.ProductInventory),
	}
}

func (s *mockSalesSlotService) CreateSalesSlot(ctx context.Context, startTime, endTime time.Time) (*models.SalesSlot, error) {
	slot := &models.SalesSlot{
		ID:        types.ID("test-id"),
		StartTime: startTime,
		EndTime:   endTime,
		IsActive:  false,
	}
	s.slots[slot.ID] = slot
	return slot, nil
}

func (s *mockSalesSlotService) GetSalesSlot(ctx context.Context, id types.ID) (*models.SalesSlot, error) {
	if slot, exists := s.slots[id]; exists {
		return slot, nil
	}
	return nil, &services.ServiceError{Message: "Sales slot not found"}
}

func (s *mockSalesSlotService) GetAllSalesSlots(ctx context.Context) ([]models.SalesSlot, error) {
	var slots []models.SalesSlot
	for _, slot := range s.slots {
		slots = append(slots, *slot)
	}
	return slots, nil
}

func (s *mockSalesSlotService) FindByTimeRange(ctx context.Context, startTime, endTime time.Time) ([]models.SalesSlot, error) {
	var slots []models.SalesSlot
	for _, slot := range s.slots {
		if (slot.StartTime.Equal(startTime) || slot.StartTime.After(startTime)) &&
			(slot.EndTime.Equal(endTime) || slot.EndTime.Before(endTime)) {
			slots = append(slots, *slot)
		}
	}
	return slots, nil
}

func (s *mockSalesSlotService) ActivateSalesSlot(ctx context.Context, id types.ID) error {
	if slot, exists := s.slots[id]; exists {
		slot.IsActive = true
		return nil
	}
	return &services.ServiceError{Message: "Sales slot not found"}
}

func (s *mockSalesSlotService) DeactivateSalesSlot(ctx context.Context, id types.ID) error {
	if slot, exists := s.slots[id]; exists {
		slot.IsActive = false
		return nil
	}
	return &services.ServiceError{Message: "Sales slot not found"}
}

func (s *mockSalesSlotService) AddProductToSlot(ctx context.Context, slotID, productID types.ID, initialQuantity int) (*models.ProductInventory, error) {
	inventory := &models.ProductInventory{
		ID:              types.ID("inv-test-id"),
		SalesSlotID:     slotID,
		ProductID:       productID,
		InitialQuantity: initialQuantity,
	}
	s.inventories[inventory.ID] = inventory
	return inventory, nil
}

func (s *mockSalesSlotService) UpdateInventory(ctx context.Context, slotID, productID types.ID, reserved, sold int) error {
	return nil
}

func (s *mockSalesSlotService) GetSlotInventories(ctx context.Context, slotID types.ID) ([]models.ProductInventory, error) {
	var inventories []models.ProductInventory
	for _, inv := range s.inventories {
		if inv.SalesSlotID == slotID {
			inventories = append(inventories, *inv)
		}
	}
	return inventories, nil
}

func TestSalesSlotHandler_Create(t *testing.T) {
	app := fiber.New()
	mockService := newMockSalesSlotService()
	handler := NewSalesSlotHandler(mockService)

	app.Post("/sales-slots", handler.Create)

	startTime := time.Now()
	endTime := startTime.Add(2 * time.Hour)

	reqBody := CreateSalesSlotRequest{
		StartTime: startTime.Format(time.RFC3339),
		EndTime:   endTime.Format(time.RFC3339),
	}
	body, _ := json.Marshal(reqBody)

	req := httptest.NewRequest("POST", "/sales-slots", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)

	if err != nil {
		t.Fatalf("Failed to test request: %v", err)
	}

	if resp.StatusCode != fiber.StatusCreated {
		t.Errorf("Expected status code %d, got %d", fiber.StatusCreated, resp.StatusCode)
	}

	var response SalesSlotResponse
	json.NewDecoder(resp.Body).Decode(&response)

	if response.IsActive {
		t.Error("Expected new sales slot to be inactive")
	}
}

func TestSalesSlotHandler_Activate(t *testing.T) {
	app := fiber.New()
	mockService := newMockSalesSlotService()
	handler := NewSalesSlotHandler(mockService)

	ctx := context.Background()
	slot, _ := mockService.CreateSalesSlot(ctx, time.Now(), time.Now().Add(2*time.Hour))

	app.Put("/sales-slots/:id/activate", handler.Activate)

	req := httptest.NewRequest("PUT", "/sales-slots/"+url.PathEscape(string(slot.ID))+"/activate", nil)
	resp, err := app.Test(req)

	if err != nil {
		t.Fatalf("Failed to test request: %v", err)
	}

	if resp.StatusCode != fiber.StatusOK {
		t.Errorf("Expected status code %d, got %d", fiber.StatusOK, resp.StatusCode)
	}

	var response SalesSlotResponse
	json.NewDecoder(resp.Body).Decode(&response)

	if !response.IsActive {
		t.Error("Expected sales slot to be active")
	}
}

func TestSalesSlotHandler_AddProduct(t *testing.T) {
	app := fiber.New()
	mockService := newMockSalesSlotService()
	handler := NewSalesSlotHandler(mockService)

	ctx := context.Background()
	slot, _ := mockService.CreateSalesSlot(ctx, time.Now(), time.Now().Add(2*time.Hour))

	app.Post("/sales-slots/:id/products", handler.AddProduct)

	reqBody := AddProductToSlotRequest{
		ProductID:       "test-product-id",
		InitialQuantity: 100,
	}
	body, _ := json.Marshal(reqBody)

	req := httptest.NewRequest("POST", "/sales-slots/"+url.PathEscape(string(slot.ID))+"/products", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)

	if err != nil {
		t.Fatalf("Failed to test request: %v", err)
	}

	if resp.StatusCode != fiber.StatusCreated {
		t.Errorf("Expected status code %d, got %d", fiber.StatusCreated, resp.StatusCode)
	}

	var response ProductInventoryResponse
	json.NewDecoder(resp.Body).Decode(&response)

	if response.InitialQuantity != 100 {
		t.Errorf("Expected initial quantity 100, got %d", response.InitialQuantity)
	}
}
