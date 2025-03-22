package repositories

import (
	"context"

	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/models"
	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/repositories"
	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/types"
	"gorm.io/gorm"
)

type productRepository struct {
	db *gorm.DB
}

func NewProductRepository(db *gorm.DB) repositories.ProductRepository {
	return &productRepository{db: db}
}

func (r *productRepository) Create(ctx context.Context, product *models.Product) error {
	if err := r.db.WithContext(ctx).Create(product).Error; err != nil {
		return &repositories.RepositoryError{
			Operation: "Create",
			Err:       err,
		}
	}
	return nil
}

func (r *productRepository) FindByID(ctx context.Context, id types.ID) (*models.Product, error) {
	var product models.Product
	if err := r.db.WithContext(ctx).First(&product, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, repositories.NewErrNotFound("Product", id)
		}
		return nil, &repositories.RepositoryError{
			Operation: "FindByID",
			Err:       err,
		}
	}
	return &product, nil
}

func (r *productRepository) FindAll(ctx context.Context) ([]models.Product, error) {
	var products []models.Product
	if err := r.db.WithContext(ctx).Find(&products).Error; err != nil {
		return nil, &repositories.RepositoryError{
			Operation: "FindAll",
			Err:       err,
		}
	}
	return products, nil
}

func (r *productRepository) Update(ctx context.Context, product *models.Product) error {
	if err := r.db.WithContext(ctx).Save(product).Error; err != nil {
		return &repositories.RepositoryError{
			Operation: "Update",
			Err:       err,
		}
	}
	return nil
}

func (r *productRepository) Delete(ctx context.Context, id types.ID) error {
	result := r.db.WithContext(ctx).Delete(&models.Product{}, "id = ?", id)
	if result.Error != nil {
		return &repositories.RepositoryError{
			Operation: "Delete",
			Err:       result.Error,
		}
	}
	if result.RowsAffected == 0 {
		return repositories.NewErrNotFound("Product", id)
	}
	return nil
}

func (r *productRepository) FindByName(ctx context.Context, name string) (*models.Product, error) {
	var product models.Product
	if err := r.db.WithContext(ctx).Where("name = ?", name).First(&product).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, &repositories.RepositoryError{
				Operation: "FindByName",
				Err:       err,
			}
		}
		return nil, &repositories.RepositoryError{
			Operation: "FindByName",
			Err:       err,
		}
	}
	return &product, nil
}
