package services

import (
	"context"
	"testing"

	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/models"
	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/repositories"
	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/types"
)

type mockOrderTicketRepository struct {
	tickets map[types.ID]*models.OrderTicket
}

func newMockOrderTicketRepository() *mockOrderTicketRepository {
	return &mockOrderTicketRepository{
		tickets: make(map[types.ID]*models.OrderTicket),
	}
}

func (r *mockOrderTicketRepository) Create(ctx context.Context, ticket *models.OrderTicket) error {
	r.tickets[ticket.ID] = ticket
	return nil
}

func (r *mockOrderTicketRepository) FindByID(ctx context.Context, id types.ID) (*models.OrderTicket, error) {
	if ticket, exists := r.tickets[id]; exists {
		return ticket, nil
	}
	return nil, repositories.NewErrNotFound("OrderTicket", id)
}

func (r *mockOrderTicketRepository) FindAll(ctx context.Context) ([]models.OrderTicket, error) {
	var tickets []models.OrderTicket
	for _, t := range r.tickets {
		tickets = append(tickets, *t)
	}
	return tickets, nil
}

func (r *mockOrderTicketRepository) Update(ctx context.Context, ticket *models.OrderTicket) error {
	if _, exists := r.tickets[ticket.ID]; !exists {
		return repositories.NewErrNotFound("OrderTicket", ticket.ID)
	}
	r.tickets[ticket.ID] = ticket
	return nil
}

func (r *mockOrderTicketRepository) Delete(ctx context.Context, id types.ID) error {
	if _, exists := r.tickets[id]; !exists {
		return repositories.NewErrNotFound("OrderTicket", id)
	}
	delete(r.tickets, id)
	return nil
}

func (r *mockOrderTicketRepository) FindByTicketNumber(ctx context.Context, ticketNumber string) (*models.OrderTicket, error) {
	for _, ticket := range r.tickets {
		if ticket.TicketNumber == ticketNumber {
			return ticket, nil
		}
	}
	return nil, repositories.NewErrNotFound("OrderTicket", "")
}

func (r *mockOrderTicketRepository) FindByOrderID(ctx context.Context, orderID types.ID) (*models.OrderTicket, error) {
	for _, ticket := range r.tickets {
		if ticket.OrderID == orderID {
			return ticket, nil
		}
	}
	return nil, repositories.NewErrNotFound("OrderTicket", "")
}

func (r *mockOrderTicketRepository) UpdatePaymentStatus(ctx context.Context, id types.ID, isPaid bool, transactionID *string) error {
	ticket, exists := r.tickets[id]
	if !exists {
		return repositories.NewErrNotFound("OrderTicket", id)
	}
	ticket.IsPaid = isPaid
	ticket.TransactionID = transactionID
	return nil
}

func (r *mockOrderTicketRepository) UpdateDeliveryStatus(ctx context.Context, id types.ID, isDelivered bool) error {
	ticket, exists := r.tickets[id]
	if !exists {
		return repositories.NewErrNotFound("OrderTicket", id)
	}
	ticket.IsDelivered = isDelivered
	return nil
}

func TestOrderTicketService_CreateTicket(t *testing.T) {
	ticketRepo := newMockOrderTicketRepository()
	orderRepo := newMockOrderRepository()
	service := NewOrderTicketService(ticketRepo, orderRepo)
	ctx := context.Background()

	// Create test data
	order := &models.Order{
		ID:     types.ID("order1"),
		Status: types.CONFIRMED,
	}
	orderRepo.Create(ctx, order)

	// Test ticket creation
	ticket, err := service.CreateTicket(ctx, order.ID, "TICKET123", types.CASH)
	if err != nil {
		t.Errorf("CreateTicket failed: %v", err)
	}

	if ticket.OrderID != order.ID {
		t.Errorf("Expected order ID %v, got %v", order.ID, ticket.OrderID)
	}

	if ticket.TicketNumber != "TICKET123" {
		t.Errorf("Expected ticket number TICKET123, got %v", ticket.TicketNumber)
	}

	if ticket.PaymentMethod != types.CASH {
		t.Errorf("Expected payment method CASH, got %v", ticket.PaymentMethod)
	}
}

func TestOrderTicketService_PaymentAndDelivery(t *testing.T) {
	ticketRepo := newMockOrderTicketRepository()
	orderRepo := newMockOrderRepository()
	service := NewOrderTicketService(ticketRepo, orderRepo)
	ctx := context.Background()

	// Create test data
	order := &models.Order{
		ID:     types.ID("order1"),
		Status: types.CONFIRMED,
	}
	orderRepo.Create(ctx, order)

	ticket, _ := service.CreateTicket(ctx, order.ID, "TICKET123", types.CASH)

	// Test payment status update
	transactionID := "TRX123"
	err := service.UpdatePaymentStatus(ctx, ticket.ID, true, &transactionID)
	if err != nil {
		t.Errorf("UpdatePaymentStatus failed: %v", err)
	}

	ticket, _ = service.GetTicket(ctx, ticket.ID)
	if !ticket.IsPaid {
		t.Error("Expected ticket to be paid")
	}

	if *ticket.TransactionID != transactionID {
		t.Errorf("Expected transaction ID %v, got %v", transactionID, *ticket.TransactionID)
	}

	// Test delivery status update
	err = service.UpdateDeliveryStatus(ctx, ticket.ID, true)
	if err != nil {
		t.Errorf("UpdateDeliveryStatus failed: %v", err)
	}

	ticket, _ = service.GetTicket(ctx, ticket.ID)
	if !ticket.IsDelivered {
		t.Error("Expected ticket to be delivered")
	}
}

func TestOrderTicketService_GetByNumber(t *testing.T) {
	ticketRepo := newMockOrderTicketRepository()
	orderRepo := newMockOrderRepository()
	service := NewOrderTicketService(ticketRepo, orderRepo)
	ctx := context.Background()

	order := &models.Order{
		ID:     types.ID("order1"),
		Status: types.CONFIRMED,
	}
	orderRepo.Create(ctx, order)

	created, _ := service.CreateTicket(ctx, order.ID, "TICKET123", types.CASH)

	ticket, err := service.GetTicketByNumber(ctx, "TICKET123")
	if err != nil {
		t.Errorf("GetTicketByNumber failed: %v", err)
	}

	if ticket.ID != created.ID {
		t.Errorf("Expected ticket ID %v, got %v", created.ID, ticket.ID)
	}
}
