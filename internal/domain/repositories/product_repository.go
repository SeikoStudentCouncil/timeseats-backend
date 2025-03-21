package repositories

import (
	"context"

	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/models"
)

type ProductRepository interface {
	Repository[models.Product]
	FindByName(ctx context.Context, name string) (*models.Product, error)
}
