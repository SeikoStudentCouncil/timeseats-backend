package repositories

import (
	"context"
	"time"

	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/models"
	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/repositories"
	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/types"
	"gorm.io/gorm"
)

type salesSlotRepository struct {
	db *gorm.DB
}

func NewSalesSlotRepository(db *gorm.DB) repositories.SalesSlotRepository {
	return &salesSlotRepository{db: db}
}

func (r *salesSlotRepository) Create(ctx context.Context, slot *models.SalesSlot) error {
	if err := r.db.WithContext(ctx).Create(slot).Error; err != nil {
		return &repositories.RepositoryError{
			Operation: "Create",
			Err:       err,
		}
	}
	return nil
}

func (r *salesSlotRepository) FindByID(ctx context.Context, id types.ID) (*models.SalesSlot, error) {
	var slot models.SalesSlot
	if err := r.db.WithContext(ctx).First(&slot, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, repositories.NewErrNotFound("SalesSlot", id)
		}
		return nil, &repositories.RepositoryError{
			Operation: "FindByID",
			Err:       err,
		}
	}
	return &slot, nil
}

func (r *salesSlotRepository) FindAll(ctx context.Context) ([]models.SalesSlot, error) {
	var slots []models.SalesSlot
	if err := r.db.WithContext(ctx).Find(&slots).Error; err != nil {
		return nil, &repositories.RepositoryError{
			Operation: "FindAll",
			Err:       err,
		}
	}
	return slots, nil
}

func (r *salesSlotRepository) Update(ctx context.Context, slot *models.SalesSlot) error {
	if err := r.db.WithContext(ctx).Save(slot).Error; err != nil {
		return &repositories.RepositoryError{
			Operation: "Update",
			Err:       err,
		}
	}
	return nil
}

func (r *salesSlotRepository) Delete(ctx context.Context, id types.ID) error {
	result := r.db.WithContext(ctx).Delete(&models.SalesSlot{}, "id = ?", id)
	if result.Error != nil {
		return &repositories.RepositoryError{
			Operation: "Delete",
			Err:       result.Error,
		}
	}
	if result.RowsAffected == 0 {
		return repositories.NewErrNotFound("SalesSlot", id)
	}
	return nil
}

func (r *salesSlotRepository) FindActive(ctx context.Context) ([]models.SalesSlot, error) {
	var slots []models.SalesSlot
	if err := r.db.WithContext(ctx).Where("is_active = ?", true).Find(&slots).Error; err != nil {
		return nil, &repositories.RepositoryError{
			Operation: "FindActive",
			Err:       err,
		}
	}
	return slots, nil
}

func (r *salesSlotRepository) FindByTimeRange(ctx context.Context, start, end time.Time) ([]models.SalesSlot, error) {
	var slots []models.SalesSlot
	if err := r.db.WithContext(ctx).
		Where("start_time >= ? AND end_time <= ?", start, end).
		Find(&slots).Error; err != nil {
		return nil, &repositories.RepositoryError{
			Operation: "FindByTimeRange",
			Err:       err,
		}
	}
	return slots, nil
}

func (r *salesSlotRepository) ActivateSlot(ctx context.Context, id types.ID) error {
	result := r.db.WithContext(ctx).Model(&models.SalesSlot{}).
		Where("id = ?", id).
		Update("is_active", true)

	if result.Error != nil {
		return &repositories.RepositoryError{
			Operation: "ActivateSlot",
			Err:       result.Error,
		}
	}
	if result.RowsAffected == 0 {
		return repositories.NewErrNotFound("SalesSlot", id)
	}
	return nil
}

func (r *salesSlotRepository) DeactivateSlot(ctx context.Context, id types.ID) error {
	result := r.db.WithContext(ctx).Model(&models.SalesSlot{}).
		Where("id = ?", id).
		Update("is_active", false)

	if result.Error != nil {
		return &repositories.RepositoryError{
			Operation: "DeactivateSlot",
			Err:       result.Error,
		}
	}
	if result.RowsAffected == 0 {
		return repositories.NewErrNotFound("SalesSlot", id)
	}
	return nil
}
