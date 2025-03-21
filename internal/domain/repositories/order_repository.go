package repositories

import (
	"context"

	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/models"
	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/types"
)

type OrderRepository interface {
	Repository[models.Order]
	FindBySalesSlotID(ctx context.Context, salesSlotID types.ID) ([]models.Order, error)
	FindByStatus(ctx context.Context, status types.OrderStatus) ([]models.Order, error)
	UpdateStatus(ctx context.Context, id types.ID, status types.OrderStatus) error
	AddItems(ctx context.Context, orderID types.ID, items []models.OrderItem) error
	CreateWithItems(ctx context.Context, order *models.Order, items []models.OrderItem) error
}
