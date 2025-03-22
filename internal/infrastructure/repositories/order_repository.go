package repositories

import (
	"context"

	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/models"
	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/repositories"
	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/types"
	"gorm.io/gorm"
)

type orderRepository struct {
	db *gorm.DB
}

func NewOrderRepository(db *gorm.DB) repositories.OrderRepository {
	return &orderRepository{db: db}
}

func (r *orderRepository) Create(ctx context.Context, order *models.Order) error {
	if err := r.db.WithContext(ctx).Create(order).Error; err != nil {
		return &repositories.RepositoryError{
			Operation: "Create",
			Err:       err,
		}
	}
	return nil
}

func (r *orderRepository) FindByID(ctx context.Context, id types.ID) (*models.Order, error) {
	var order models.Order
	if err := r.db.WithContext(ctx).
		Preload("SalesSlot").
		Preload("Items").
		Preload("Items.Product").
		Preload("Ticket").
		First(&order, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, repositories.NewErrNotFound("Order", id)
		}
		return nil, &repositories.RepositoryError{
			Operation: "FindByID",
			Err:       err,
		}
	}
	return &order, nil
}

func (r *orderRepository) FindAll(ctx context.Context) ([]models.Order, error) {
	var orders []models.Order
	if err := r.db.WithContext(ctx).
		Preload("SalesSlot").
		Preload("Items").
		Preload("Items.Product").
		Preload("Ticket").
		Find(&orders).Error; err != nil {
		return nil, &repositories.RepositoryError{
			Operation: "FindAll",
			Err:       err,
		}
	}
	return orders, nil
}

func (r *orderRepository) Update(ctx context.Context, order *models.Order) error {
	if err := r.db.WithContext(ctx).Save(order).Error; err != nil {
		return &repositories.RepositoryError{
			Operation: "Update",
			Err:       err,
		}
	}
	return nil
}

func (r *orderRepository) Delete(ctx context.Context, id types.ID) error {
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Delete(&models.OrderItem{}, "order_id = ?", id).Error; err != nil {
			return err
		}
		if err := tx.Delete(&models.OrderTicket{}, "order_id = ?", id).Error; err != nil {
			return err
		}
		if err := tx.Delete(&models.Order{}, "id = ?", id).Error; err != nil {
			return err
		}
		return nil
	})

	if err != nil {
		return &repositories.RepositoryError{
			Operation: "Delete",
			Err:       err,
		}
	}
	return nil
}

func (r *orderRepository) FindBySalesSlotID(ctx context.Context, salesSlotID types.ID) ([]models.Order, error) {
	var orders []models.Order
	if err := r.db.WithContext(ctx).
		Preload("SalesSlot").
		Preload("Items").
		Preload("Items.Product").
		Preload("Ticket").
		Where("sales_slot_id = ?", salesSlotID).
		Find(&orders).Error; err != nil {
		return nil, &repositories.RepositoryError{
			Operation: "FindBySalesSlotID",
			Err:       err,
		}
	}
	return orders, nil
}

func (r *orderRepository) FindByStatus(ctx context.Context, status types.OrderStatus) ([]models.Order, error) {
	var orders []models.Order
	if err := r.db.WithContext(ctx).
		Preload("SalesSlot").
		Preload("Items").
		Preload("Items.Product").
		Preload("Ticket").
		Where("status = ?", status).
		Find(&orders).Error; err != nil {
		return nil, &repositories.RepositoryError{
			Operation: "FindByStatus",
			Err:       err,
		}
	}
	return orders, nil
}

func (r *orderRepository) UpdateStatus(ctx context.Context, id types.ID, status types.OrderStatus) error {
	result := r.db.WithContext(ctx).Model(&models.Order{}).
		Where("id = ?", id).
		Update("status", status)

	if result.Error != nil {
		return &repositories.RepositoryError{
			Operation: "UpdateStatus",
			Err:       result.Error,
		}
	}
	if result.RowsAffected == 0 {
		return repositories.NewErrNotFound("Order", id)
	}
	return nil
}

func (r *orderRepository) AddItems(ctx context.Context, orderID types.ID, items []models.OrderItem) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for i := range items {
			items[i].OrderID = orderID
			if err := tx.Create(&items[i]).Error; err != nil {
				return &repositories.RepositoryError{
					Operation: "AddItems",
					Err:       err,
				}
			}
		}
		return nil
	})
}

func (r *orderRepository) CreateWithItems(ctx context.Context, order *models.Order, items []models.OrderItem) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(order).Error; err != nil {
			return &repositories.RepositoryError{
				Operation: "CreateWithItems",
				Err:       err,
			}
		}

		for i := range items {
			items[i].OrderID = order.ID
			if err := tx.Create(&items[i]).Error; err != nil {
				return &repositories.RepositoryError{
					Operation: "CreateWithItems",
					Err:       err,
				}
			}
		}

		return nil
	})
}
