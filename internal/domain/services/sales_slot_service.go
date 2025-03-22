package services

import (
	"context"
	"time"

	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/models"
	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/repositories"
	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/types"
	"github.com/google/uuid"
)

type SalesSlotService interface {
	CreateSalesSlot(ctx context.Context, startTime, endTime time.Time) (*models.SalesSlot, error)
	GetSalesSlot(ctx context.Context, id types.ID) (*models.SalesSlot, error)
	GetAllSalesSlots(ctx context.Context) ([]models.SalesSlot, error)
	FindByTimeRange(ctx context.Context, startTime, endTime time.Time) ([]models.SalesSlot, error)
	ActivateSalesSlot(ctx context.Context, id types.ID) error
	DeactivateSalesSlot(ctx context.Context, id types.ID) error
	AddProductToSlot(ctx context.Context, slotID types.ID, productID types.ID, initialQuantity int) (*models.ProductInventory, error)
	UpdateInventory(ctx context.Context, slotID types.ID, productID types.ID, reserved, sold int) error
	GetSlotInventories(ctx context.Context, slotID types.ID) ([]models.ProductInventory, error)
}

type salesSlotService struct {
	slotRepo repositories.SalesSlotRepository
	invRepo  repositories.ProductInventoryRepository
	prodRepo repositories.ProductRepository
}

func NewSalesSlotService(
	slotRepo repositories.SalesSlotRepository,
	invRepo repositories.ProductInventoryRepository,
	prodRepo repositories.ProductRepository,
) SalesSlotService {
	return &salesSlotService{
		slotRepo: slotRepo,
		invRepo:  invRepo,
		prodRepo: prodRepo,
	}
}

func (s *salesSlotService) CreateSalesSlot(ctx context.Context, startTime, endTime time.Time) (*models.SalesSlot, error) {
	if endTime.Before(startTime) {
		return nil, ErrInvalidTimeRange
	}

	slot := &models.SalesSlot{
		ID:        types.ID(uuid.New().String()),
		StartTime: startTime,
		EndTime:   endTime,
		IsActive:  false,
	}

	if err := s.slotRepo.Create(ctx, slot); err != nil {
		return nil, err
	}

	return slot, nil
}

func (s *salesSlotService) GetSalesSlot(ctx context.Context, id types.ID) (*models.SalesSlot, error) {
	return s.slotRepo.FindByID(ctx, id)
}

func (s *salesSlotService) GetAllSalesSlots(ctx context.Context) ([]models.SalesSlot, error) {
	return s.slotRepo.FindAll(ctx)
}

func (s *salesSlotService) FindByTimeRange(ctx context.Context, startTime, endTime time.Time) ([]models.SalesSlot, error) {
	return s.slotRepo.FindByTimeRange(ctx, startTime, endTime)
}

func (s *salesSlotService) ActivateSalesSlot(ctx context.Context, id types.ID) error {
	return s.slotRepo.ActivateSlot(ctx, id)
}

func (s *salesSlotService) DeactivateSalesSlot(ctx context.Context, id types.ID) error {
	return s.slotRepo.DeactivateSlot(ctx, id)
}

func (s *salesSlotService) AddProductToSlot(ctx context.Context, slotID types.ID, productID types.ID, initialQuantity int) (*models.ProductInventory, error) {
	_, err := s.slotRepo.FindByID(ctx, slotID)
	if err != nil {
		return nil, err
	}

	_, err = s.prodRepo.FindByID(ctx, productID)
	if err != nil {
		return nil, err
	}

	existing, err := s.invRepo.FindBySalesSlotAndProduct(ctx, slotID, productID)
	if err == nil && existing != nil {
		return nil, ErrDuplicateInventory
	}

	inventory := &models.ProductInventory{
		SalesSlotID:     slotID,
		ProductID:       productID,
		InitialQuantity: initialQuantity,
	}

	if err := s.invRepo.Create(ctx, inventory); err != nil {
		return nil, err
	}

	return inventory, nil
}

func (s *salesSlotService) UpdateInventory(ctx context.Context, slotID types.ID, productID types.ID, reserved, sold int) error {
	inventory, err := s.invRepo.FindBySalesSlotAndProduct(ctx, slotID, productID)
	if err != nil {
		return err
	}

	if reserved+sold > inventory.InitialQuantity {
		return ErrInsufficientInventory
	}

	return s.invRepo.UpdateQuantities(ctx, inventory.ID, reserved, sold)
}

func (s *salesSlotService) GetSlotInventories(ctx context.Context, slotID types.ID) ([]models.ProductInventory, error) {
	return s.invRepo.FindBySalesSlotID(ctx, slotID)
}
