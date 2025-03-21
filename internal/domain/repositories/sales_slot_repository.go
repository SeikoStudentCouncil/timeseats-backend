package repositories

import (
	"context"
	"time"

	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/models"
	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/types"
)

type SalesSlotRepository interface {
	Repository[models.SalesSlot]
	FindActive(ctx context.Context) ([]models.SalesSlot, error)
	FindByTimeRange(ctx context.Context, start, end time.Time) ([]models.SalesSlot, error)
	ActivateSlot(ctx context.Context, id types.ID) error
	DeactivateSlot(ctx context.Context, id types.ID) error
}
