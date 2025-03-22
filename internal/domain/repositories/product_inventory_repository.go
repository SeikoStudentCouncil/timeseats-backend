package repositories

import (
	"context"

	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/models"
	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/types"
)

type ProductInventoryRepository interface {
	Repository[models.ProductInventory]
	FindBySalesSlotID(ctx context.Context, salesSlotID types.ID) ([]models.ProductInventory, error)
	FindByProductID(ctx context.Context, productID types.ID) ([]models.ProductInventory, error)
	FindBySalesSlotAndProduct(ctx context.Context, salesSlotID, productID types.ID) (*models.ProductInventory, error)
	UpdateQuantities(ctx context.Context, id types.ID, reserved, sold int) error
}
