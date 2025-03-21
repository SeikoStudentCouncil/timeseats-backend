package repositories

import (
	"context"

	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/models"
	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/repositories"
	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/types"
	"gorm.io/gorm"
)

type productInventoryRepository struct {
	db *gorm.DB
}

func NewProductInventoryRepository(db *gorm.DB) repositories.ProductInventoryRepository {
	return &productInventoryRepository{db: db}
}

func (r *productInventoryRepository) Create(ctx context.Context, inventory *models.ProductInventory) error {
	if err := r.db.WithContext(ctx).Create(inventory).Error; err != nil {
		return &repositories.RepositoryError{
			Operation: "Create",
			Err:       err,
		}
	}
	return nil
}

func (r *productInventoryRepository) FindByID(ctx context.Context, id types.ID) (*models.ProductInventory, error) {
	var inventory models.ProductInventory
	if err := r.db.WithContext(ctx).
		Preload("Product").
		Preload("SalesSlot").
		First(&inventory, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, repositories.NewErrNotFound("ProductInventory", id)
		}
		return nil, &repositories.RepositoryError{
			Operation: "FindByID",
			Err:       err,
		}
	}
	return &inventory, nil
}

func (r *productInventoryRepository) FindAll(ctx context.Context) ([]models.ProductInventory, error) {
	var inventories []models.ProductInventory
	if err := r.db.WithContext(ctx).
		Preload("Product").
		Preload("SalesSlot").
		Find(&inventories).Error; err != nil {
		return nil, &repositories.RepositoryError{
			Operation: "FindAll",
			Err:       err,
		}
	}
	return inventories, nil
}

func (r *productInventoryRepository) Update(ctx context.Context, inventory *models.ProductInventory) error {
	if err := r.db.WithContext(ctx).Save(inventory).Error; err != nil {
		return &repositories.RepositoryError{
			Operation: "Update",
			Err:       err,
		}
	}
	return nil
}

func (r *productInventoryRepository) Delete(ctx context.Context, id types.ID) error {
	result := r.db.WithContext(ctx).Delete(&models.ProductInventory{}, "id = ?", id)
	if result.Error != nil {
		return &repositories.RepositoryError{
			Operation: "Delete",
			Err:       result.Error,
		}
	}
	if result.RowsAffected == 0 {
		return repositories.NewErrNotFound("ProductInventory", id)
	}
	return nil
}

func (r *productInventoryRepository) FindBySalesSlotID(ctx context.Context, salesSlotID types.ID) ([]models.ProductInventory, error) {
	var inventories []models.ProductInventory
	if err := r.db.WithContext(ctx).
		Preload("Product").
		Preload("SalesSlot").
		Where("sales_slot_id = ?", salesSlotID).
		Find(&inventories).Error; err != nil {
		return nil, &repositories.RepositoryError{
			Operation: "FindBySalesSlotID",
			Err:       err,
		}
	}
	return inventories, nil
}

func (r *productInventoryRepository) FindByProductID(ctx context.Context, productID types.ID) ([]models.ProductInventory, error) {
	var inventories []models.ProductInventory
	if err := r.db.WithContext(ctx).
		Preload("Product").
		Preload("SalesSlot").
		Where("product_id = ?", productID).
		Find(&inventories).Error; err != nil {
		return nil, &repositories.RepositoryError{
			Operation: "FindByProductID",
			Err:       err,
		}
	}
	return inventories, nil
}

func (r *productInventoryRepository) FindBySalesSlotAndProduct(ctx context.Context, salesSlotID, productID types.ID) (*models.ProductInventory, error) {
	var inventory models.ProductInventory
	if err := r.db.WithContext(ctx).
		Preload("Product").
		Preload("SalesSlot").
		Where("sales_slot_id = ? AND product_id = ?", salesSlotID, productID).
		First(&inventory).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, repositories.NewErrNotFound("ProductInventory", "")
		}
		return nil, &repositories.RepositoryError{
			Operation: "FindBySalesSlotAndProduct",
			Err:       err,
		}
	}
	return &inventory, nil
}

func (r *productInventoryRepository) UpdateQuantities(ctx context.Context, id types.ID, reserved, sold int) error {
	result := r.db.WithContext(ctx).Model(&models.ProductInventory{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"reserved_quantity": reserved,
			"sold_quantity":     sold,
		})

	if result.Error != nil {
		return &repositories.RepositoryError{
			Operation: "UpdateQuantities",
			Err:       result.Error,
		}
	}
	if result.RowsAffected == 0 {
		return repositories.NewErrNotFound("ProductInventory", id)
	}
	return nil
}
