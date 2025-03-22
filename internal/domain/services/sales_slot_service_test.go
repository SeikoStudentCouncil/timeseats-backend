package services

import (
	"context"
	"testing"
	"time"

	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/models"
	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/repositories"
	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/types"
)

type mockSalesSlotRepository struct {
	slots map[types.ID]*models.SalesSlot
}

func newMockSalesSlotRepository() *mockSalesSlotRepository {
	return &mockSalesSlotRepository{
		slots: make(map[types.ID]*models.SalesSlot),
	}
}

func (r *mockSalesSlotRepository) Create(ctx context.Context, slot *models.SalesSlot) error {
	r.slots[slot.ID] = slot
	return nil
}

func (r *mockSalesSlotRepository) FindByID(ctx context.Context, id types.ID) (*models.SalesSlot, error) {
	if slot, exists := r.slots[id]; exists {
		return slot, nil
	}
	return nil, repositories.NewErrNotFound("SalesSlot", id)
}

func (r *mockSalesSlotRepository) FindAll(ctx context.Context) ([]models.SalesSlot, error) {
	var slots []models.SalesSlot
	for _, s := range r.slots {
		slots = append(slots, *s)
	}
	return slots, nil
}

func (r *mockSalesSlotRepository) FindActive(ctx context.Context) ([]models.SalesSlot, error) {
	var slots []models.SalesSlot
	for _, s := range r.slots {
		if s.IsActive {
			slots = append(slots, *s)
		}
	}
	return slots, nil
}

func (r *mockSalesSlotRepository) FindByTimeRange(ctx context.Context, start, end time.Time) ([]models.SalesSlot, error) {
	var slots []models.SalesSlot
	for _, s := range r.slots {
		// スロットが指定された期間と重なる場合:
		// 1. スロットの開始時間が期間の終了時間よりも前 AND
		// 2. スロットの終了時間が期間の開始時間よりも後
		if s.StartTime.Before(end) && s.EndTime.After(start) {
			slots = append(slots, *s)
		}
	}
	return slots, nil
}

func (r *mockSalesSlotRepository) Update(ctx context.Context, slot *models.SalesSlot) error {
	if _, exists := r.slots[slot.ID]; !exists {
		return repositories.NewErrNotFound("SalesSlot", slot.ID)
	}
	r.slots[slot.ID] = slot
	return nil
}

func (r *mockSalesSlotRepository) Delete(ctx context.Context, id types.ID) error {
	if _, exists := r.slots[id]; !exists {
		return repositories.NewErrNotFound("SalesSlot", id)
	}
	delete(r.slots, id)
	return nil
}

func (r *mockSalesSlotRepository) ActivateSlot(ctx context.Context, id types.ID) error {
	slot, exists := r.slots[id]
	if !exists {
		return repositories.NewErrNotFound("SalesSlot", id)
	}
	slot.IsActive = true
	return nil
}

func (r *mockSalesSlotRepository) DeactivateSlot(ctx context.Context, id types.ID) error {
	slot, exists := r.slots[id]
	if !exists {
		return repositories.NewErrNotFound("SalesSlot", id)
	}
	slot.IsActive = false
	return nil
}

type mockInventoryRepository struct {
	inventories map[types.ID]*models.ProductInventory
}

func newMockInventoryRepository() *mockInventoryRepository {
	return &mockInventoryRepository{
		inventories: make(map[types.ID]*models.ProductInventory),
	}
}

func (r *mockInventoryRepository) Create(ctx context.Context, inventory *models.ProductInventory) error {
	r.inventories[inventory.ID] = inventory
	return nil
}

func (r *mockInventoryRepository) FindByID(ctx context.Context, id types.ID) (*models.ProductInventory, error) {
	if inv, exists := r.inventories[id]; exists {
		return inv, nil
	}
	return nil, repositories.NewErrNotFound("ProductInventory", id)
}

func (r *mockInventoryRepository) FindAll(ctx context.Context) ([]models.ProductInventory, error) {
	var invs []models.ProductInventory
	for _, inv := range r.inventories {
		invs = append(invs, *inv)
	}
	return invs, nil
}

func (r *mockInventoryRepository) Update(ctx context.Context, inventory *models.ProductInventory) error {
	if _, exists := r.inventories[inventory.ID]; !exists {
		return repositories.NewErrNotFound("ProductInventory", inventory.ID)
	}
	r.inventories[inventory.ID] = inventory
	return nil
}

func (r *mockInventoryRepository) Delete(ctx context.Context, id types.ID) error {
	if _, exists := r.inventories[id]; !exists {
		return repositories.NewErrNotFound("ProductInventory", id)
	}
	delete(r.inventories, id)
	return nil
}

func (r *mockInventoryRepository) FindBySalesSlotID(ctx context.Context, salesSlotID types.ID) ([]models.ProductInventory, error) {
	var result []models.ProductInventory
	for _, inv := range r.inventories {
		if inv.SalesSlotID == salesSlotID {
			result = append(result, *inv)
		}
	}
	return result, nil
}

func (r *mockInventoryRepository) FindByProductID(ctx context.Context, productID types.ID) ([]models.ProductInventory, error) {
	var result []models.ProductInventory
	for _, inv := range r.inventories {
		if inv.ProductID == productID {
			result = append(result, *inv)
		}
	}
	return result, nil
}

func (r *mockInventoryRepository) FindBySalesSlotAndProduct(ctx context.Context, salesSlotID, productID types.ID) (*models.ProductInventory, error) {
	for _, inv := range r.inventories {
		if inv.SalesSlotID == salesSlotID && inv.ProductID == productID {
			return inv, nil
		}
	}
	return nil, repositories.NewErrNotFound("ProductInventory", "")
}

func (r *mockInventoryRepository) UpdateQuantities(ctx context.Context, id types.ID, reserved, sold int) error {
	inv, exists := r.inventories[id]
	if !exists {
		return repositories.NewErrNotFound("ProductInventory", id)
	}
	inv.ReservedQuantity = reserved
	inv.SoldQuantity = sold
	return nil
}

func TestSalesSlotService_CreateSalesSlot(t *testing.T) {
	slotRepo := newMockSalesSlotRepository()
	invRepo := newMockInventoryRepository()
	productRepo := newMockProductRepository()
	service := NewSalesSlotService(slotRepo, invRepo, productRepo)
	ctx := context.Background()

	start := time.Now()
	end := start.Add(2 * time.Hour)

	slot, err := service.CreateSalesSlot(ctx, start, end)
	if err != nil {
		t.Errorf("CreateSalesSlot failed: %v", err)
	}

	if !slot.StartTime.Equal(start) {
		t.Errorf("Expected start time %v, got %v", start, slot.StartTime)
	}

	if !slot.EndTime.Equal(end) {
		t.Errorf("Expected end time %v, got %v", end, slot.EndTime)
	}

	if slot.IsActive {
		t.Error("Expected new slot to be inactive")
	}
}

func TestSalesSlotService_ActivateDeactivate(t *testing.T) {
	slotRepo := newMockSalesSlotRepository()
	invRepo := newMockInventoryRepository()
	productRepo := newMockProductRepository()
	service := NewSalesSlotService(slotRepo, invRepo, productRepo)
	ctx := context.Background()

	slot, _ := service.CreateSalesSlot(ctx, time.Now(), time.Now().Add(2*time.Hour))

	err := service.ActivateSalesSlot(ctx, slot.ID)
	if err != nil {
		t.Errorf("ActivateSlot failed: %v", err)
	}

	slot, _ = service.GetSalesSlot(ctx, slot.ID)
	if !slot.IsActive {
		t.Error("Expected slot to be active")
	}

	err = service.DeactivateSalesSlot(ctx, slot.ID)
	if err != nil {
		t.Errorf("DeactivateSlot failed: %v", err)
	}

	slot, _ = service.GetSalesSlot(ctx, slot.ID)
	if slot.IsActive {
		t.Error("Expected slot to be inactive")
	}
}

func TestSalesSlotService_AddProductToSlot(t *testing.T) {
	slotRepo := newMockSalesSlotRepository()
	invRepo := newMockInventoryRepository()
	productRepo := newMockProductRepository()
	service := NewSalesSlotService(slotRepo, invRepo, productRepo)
	ctx := context.Background()

	slot, _ := service.CreateSalesSlot(ctx, time.Now(), time.Now().Add(2*time.Hour))

	product := &models.Product{
		Name:  "Test Product",
		Price: 1000,
	}
	err := productRepo.Create(ctx, product)
	if err != nil {
		t.Errorf("Failed to create product: %v", err)
	}

	inventory, err := service.AddProductToSlot(ctx, slot.ID, product.ID, 100)
	if err != nil {
		t.Errorf("AddProductToSlot failed: %v", err)
	}

	if inventory.InitialQuantity != 100 {
		t.Errorf("Expected initial quantity 100, got %d", inventory.InitialQuantity)
	}

	if inventory.SalesSlotID != slot.ID {
		t.Error("Expected inventory to be associated with sales slot")
	}

	if inventory.ProductID != product.ID {
		t.Error("Expected inventory to be associated with product")
	}
}

func TestSalesSlotService_FindByTimeRange(t *testing.T) {
	slotRepo := newMockSalesSlotRepository()
	invRepo := newMockInventoryRepository()
	productRepo := newMockProductRepository()
	service := NewSalesSlotService(slotRepo, invRepo, productRepo)
	ctx := context.Background()

	start := time.Now()
	mid := start.Add(1 * time.Hour)
	end := start.Add(2 * time.Hour)

	service.CreateSalesSlot(ctx, start, mid)
	service.CreateSalesSlot(ctx, mid, end)

	slots, err := service.FindByTimeRange(ctx, start, end)
	if err != nil {
		t.Errorf("FindByTimeRange failed: %v", err)
	}

	if len(slots) != 2 {
		t.Errorf("Expected 2 slots, got %d", len(slots))
	}
}
