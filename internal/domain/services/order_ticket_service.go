package services

import (
	"context"

	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/models"
	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/repositories"
	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/types"
)

type OrderTicketService interface {
	CreateTicket(ctx context.Context, orderID types.ID, ticketNumber string, paymentMethod types.PaymentMethod) (*models.OrderTicket, error)
	GetTicket(ctx context.Context, id types.ID) (*models.OrderTicket, error)
	GetTicketByNumber(ctx context.Context, ticketNumber string) (*models.OrderTicket, error)
	GetAllTickets(ctx context.Context) ([]models.OrderTicket, error)
	UpdatePaymentStatus(ctx context.Context, id types.ID, isPaid bool, transactionID *string) error
	UpdateDeliveryStatus(ctx context.Context, id types.ID, isDelivered bool) error
}

type orderTicketService struct {
	ticketRepo repositories.OrderTicketRepository
	orderRepo  repositories.OrderRepository
}

func NewOrderTicketService(
	ticketRepo repositories.OrderTicketRepository,
	orderRepo repositories.OrderRepository,
) OrderTicketService {
	return &orderTicketService{
		ticketRepo: ticketRepo,
		orderRepo:  orderRepo,
	}
}

func (s *orderTicketService) CreateTicket(ctx context.Context, orderID types.ID, ticketNumber string, paymentMethod types.PaymentMethod) (*models.OrderTicket, error) {
	order, err := s.orderRepo.FindByID(ctx, orderID)
	if err != nil {
		return nil, err
	}

	if order.Status != types.CONFIRMED {
		return nil, ErrInvalidOrderStatus
	}

	existing, err := s.ticketRepo.FindByOrderID(ctx, orderID)
	if err == nil && existing != nil {
		return nil, &ServiceError{Message: "チケットは既に発行されています"}
	}

	existing, err = s.ticketRepo.FindByTicketNumber(ctx, ticketNumber)
	if err == nil && existing != nil {
		return nil, &ServiceError{Message: "指定されたチケット番号は既に使用されています"}
	}

	ticket := &models.OrderTicket{
		TicketNumber:  ticketNumber,
		OrderID:       orderID,
		PaymentMethod: paymentMethod,
		IsPaid:        false,
		IsDelivered:   false,
	}

	if err := s.ticketRepo.Create(ctx, ticket); err != nil {
		return nil, err
	}

	return ticket, nil
}

func (s *orderTicketService) GetTicket(ctx context.Context, id types.ID) (*models.OrderTicket, error) {
	return s.ticketRepo.FindByID(ctx, id)
}

func (s *orderTicketService) GetTicketByNumber(ctx context.Context, ticketNumber string) (*models.OrderTicket, error) {
	return s.ticketRepo.FindByTicketNumber(ctx, ticketNumber)
}

func (s *orderTicketService) GetAllTickets(ctx context.Context) ([]models.OrderTicket, error) {
	return s.ticketRepo.FindAll(ctx)
}

func (s *orderTicketService) UpdatePaymentStatus(ctx context.Context, id types.ID, isPaid bool, transactionID *string) error {
	ticket, err := s.ticketRepo.FindByID(ctx, id)
	if err != nil {
		return err
	}

	if isPaid && ticket.IsPaid {
		return &ServiceError{Message: "既に支払い済みです"}
	}

	return s.ticketRepo.UpdatePaymentStatus(ctx, id, isPaid, transactionID)
}

func (s *orderTicketService) UpdateDeliveryStatus(ctx context.Context, id types.ID, isDelivered bool) error {
	ticket, err := s.ticketRepo.FindByID(ctx, id)
	if err != nil {
		return err
	}

	if isDelivered && !ticket.IsPaid {
		return ErrPaymentRequired
	}

	if isDelivered && ticket.IsDelivered {
		return &ServiceError{Message: "既に引き渡し済みです"}
	}

	return s.ticketRepo.UpdateDeliveryStatus(ctx, id, isDelivered)
}
