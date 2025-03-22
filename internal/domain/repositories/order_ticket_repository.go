package repositories

import (
	"context"

	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/models"
	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/types"
)

type OrderTicketRepository interface {
	Repository[models.OrderTicket]
	FindByTicketNumber(ctx context.Context, ticketNumber string) (*models.OrderTicket, error)
	FindByOrderID(ctx context.Context, orderID types.ID) (*models.OrderTicket, error)
	UpdatePaymentStatus(ctx context.Context, id types.ID, isPaid bool, transactionID *string) error
	UpdateDeliveryStatus(ctx context.Context, id types.ID, isDelivered bool) error
}
