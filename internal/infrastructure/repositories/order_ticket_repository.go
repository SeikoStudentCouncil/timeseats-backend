package repositories

import (
	"context"

	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/models"
	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/repositories"
	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/types"
	"gorm.io/gorm"
)

type orderTicketRepository struct {
	db *gorm.DB
}

func NewOrderTicketRepository(db *gorm.DB) repositories.OrderTicketRepository {
	return &orderTicketRepository{db: db}
}

func (r *orderTicketRepository) Create(ctx context.Context, ticket *models.OrderTicket) error {
	if err := r.db.WithContext(ctx).Create(ticket).Error; err != nil {
		return &repositories.RepositoryError{
			Operation: "Create",
			Err:       err,
		}
	}
	return nil
}

func (r *orderTicketRepository) FindByID(ctx context.Context, id types.ID) (*models.OrderTicket, error) {
	var ticket models.OrderTicket
	if err := r.db.WithContext(ctx).
		Preload("Order").
		Preload("Order.Items").
		Preload("Order.SalesSlot").
		First(&ticket, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, repositories.NewErrNotFound("OrderTicket", id)
		}
		return nil, &repositories.RepositoryError{
			Operation: "FindByID",
			Err:       err,
		}
	}
	return &ticket, nil
}

func (r *orderTicketRepository) FindAll(ctx context.Context) ([]models.OrderTicket, error) {
	var tickets []models.OrderTicket
	if err := r.db.WithContext(ctx).
		Preload("Order").
		Preload("Order.Items").
		Preload("Order.SalesSlot").
		Find(&tickets).Error; err != nil {
		return nil, &repositories.RepositoryError{
			Operation: "FindAll",
			Err:       err,
		}
	}
	return tickets, nil
}

func (r *orderTicketRepository) Update(ctx context.Context, ticket *models.OrderTicket) error {
	if err := r.db.WithContext(ctx).Save(ticket).Error; err != nil {
		return &repositories.RepositoryError{
			Operation: "Update",
			Err:       err,
		}
	}
	return nil
}

func (r *orderTicketRepository) Delete(ctx context.Context, id types.ID) error {
	result := r.db.WithContext(ctx).Delete(&models.OrderTicket{}, "id = ?", id)
	if result.Error != nil {
		return &repositories.RepositoryError{
			Operation: "Delete",
			Err:       result.Error,
		}
	}
	if result.RowsAffected == 0 {
		return repositories.NewErrNotFound("OrderTicket", id)
	}
	return nil
}

func (r *orderTicketRepository) FindByTicketNumber(ctx context.Context, ticketNumber string) (*models.OrderTicket, error) {
	var ticket models.OrderTicket
	if err := r.db.WithContext(ctx).
		Preload("Order").
		Preload("Order.Items").
		Preload("Order.SalesSlot").
		Where("ticket_number = ?", ticketNumber).
		First(&ticket).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, &repositories.RepositoryError{
				Operation: "FindByTicketNumber",
				Err:       err,
			}
		}
		return nil, &repositories.RepositoryError{
			Operation: "FindByTicketNumber",
			Err:       err,
		}
	}
	return &ticket, nil
}

func (r *orderTicketRepository) FindByOrderID(ctx context.Context, orderID types.ID) (*models.OrderTicket, error) {
	var ticket models.OrderTicket
	if err := r.db.WithContext(ctx).
		Preload("Order").
		Preload("Order.Items").
		Preload("Order.SalesSlot").
		Where("order_id = ?", orderID).
		First(&ticket).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, repositories.NewErrNotFound("OrderTicket", "")
		}
		return nil, &repositories.RepositoryError{
			Operation: "FindByOrderID",
			Err:       err,
		}
	}
	return &ticket, nil
}

func (r *orderTicketRepository) UpdatePaymentStatus(ctx context.Context, id types.ID, isPaid bool, transactionID *string) error {
	updates := map[string]interface{}{
		"is_paid": isPaid,
	}
	if transactionID != nil {
		updates["transaction_id"] = transactionID
	}

	result := r.db.WithContext(ctx).Model(&models.OrderTicket{}).
		Where("id = ?", id).
		Updates(updates)

	if result.Error != nil {
		return &repositories.RepositoryError{
			Operation: "UpdatePaymentStatus",
			Err:       result.Error,
		}
	}
	if result.RowsAffected == 0 {
		return repositories.NewErrNotFound("OrderTicket", id)
	}
	return nil
}

func (r *orderTicketRepository) UpdateDeliveryStatus(ctx context.Context, id types.ID, isDelivered bool) error {
	result := r.db.WithContext(ctx).Model(&models.OrderTicket{}).
		Where("id = ?", id).
		Update("is_delivered", isDelivered)

	if result.Error != nil {
		return &repositories.RepositoryError{
			Operation: "UpdateDeliveryStatus",
			Err:       result.Error,
		}
	}
	if result.RowsAffected == 0 {
		return repositories.NewErrNotFound("OrderTicket", id)
	}
	return nil
}
