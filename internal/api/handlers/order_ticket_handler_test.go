package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http/httptest"
	"testing"

	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/models"
	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/services"
	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/types"
	"github.com/gofiber/fiber/v2"
)

type mockOrderTicketService struct {
	tickets map[types.ID]*models.OrderTicket
}

func newMockOrderTicketService() *mockOrderTicketService {
	return &mockOrderTicketService{
		tickets: make(map[types.ID]*models.OrderTicket),
	}
}

func (s *mockOrderTicketService) CreateTicket(ctx context.Context, orderID types.ID, ticketNumber string, paymentMethod types.PaymentMethod) (*models.OrderTicket, error) {
	ticket := &models.OrderTicket{
		ID:            types.ID("test-id"),
		TicketNumber:  ticketNumber,
		OrderID:       orderID,
		PaymentMethod: paymentMethod,
		IsPaid:        false,
		IsDelivered:   false,
	}
	s.tickets[ticket.ID] = ticket
	return ticket, nil
}

func (s *mockOrderTicketService) GetTicket(ctx context.Context, id types.ID) (*models.OrderTicket, error) {
	if ticket, exists := s.tickets[id]; exists {
		return ticket, nil
	}
	return nil, &services.ServiceError{Message: "Ticket not found"}
}

func (s *mockOrderTicketService) GetTicketByNumber(ctx context.Context, ticketNumber string) (*models.OrderTicket, error) {
	for _, ticket := range s.tickets {
		if ticket.TicketNumber == ticketNumber {
			return ticket, nil
		}
	}
	return nil, &services.ServiceError{Message: "Ticket not found"}
}

func (s *mockOrderTicketService) GetAllTickets(ctx context.Context) ([]models.OrderTicket, error) {
	var tickets []models.OrderTicket
	for _, ticket := range s.tickets {
		tickets = append(tickets, *ticket)
	}
	return tickets, nil
}

func (s *mockOrderTicketService) UpdatePaymentStatus(ctx context.Context, id types.ID, isPaid bool, transactionID *string) error {
	if ticket, exists := s.tickets[id]; exists {
		ticket.IsPaid = isPaid
		ticket.TransactionID = transactionID
		return nil
	}
	return &services.ServiceError{Message: "Ticket not found"}
}

func (s *mockOrderTicketService) UpdateDeliveryStatus(ctx context.Context, id types.ID, isDelivered bool) error {
	if ticket, exists := s.tickets[id]; exists {
		ticket.IsDelivered = isDelivered
		return nil
	}
	return &services.ServiceError{Message: "Ticket not found"}
}

func TestOrderTicketHandler_Create(t *testing.T) {
	app := fiber.New()
	mockService := newMockOrderTicketService()
	handler := NewOrderTicketHandler(mockService)

	app.Post("/order-tickets", handler.Create)

	reqBody := CreateOrderTicketRequest{
		OrderID:       "test-order-id",
		TicketNumber:  "TICKET123",
		PaymentMethod: types.CASH,
	}
	body, _ := json.Marshal(reqBody)

	req := httptest.NewRequest("POST", "/order-tickets", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)

	if err != nil {
		t.Fatalf("Failed to test request: %v", err)
	}

	if resp.StatusCode != fiber.StatusCreated {
		t.Errorf("Expected status code %d, got %d", fiber.StatusCreated, resp.StatusCode)
	}

	var response OrderTicketResponse
	json.NewDecoder(resp.Body).Decode(&response)

	if response.TicketNumber != reqBody.TicketNumber {
		t.Errorf("Expected ticket number %s, got %s", reqBody.TicketNumber, response.TicketNumber)
	}
}

func TestOrderTicketHandler_UpdatePayment(t *testing.T) {
	app := fiber.New()
	mockService := newMockOrderTicketService()
	handler := NewOrderTicketHandler(mockService)

	ctx := context.Background()
	ticket, _ := mockService.CreateTicket(ctx, types.ID("test-order-id"), "TICKET123", types.CASH)

	app.Put("/order-tickets/:id/payment", handler.UpdatePayment)

	transactionID := "TRX123"
	reqBody := UpdatePaymentStatusRequest{
		IsPaid:        true,
		TransactionID: &transactionID,
	}
	body, _ := json.Marshal(reqBody)

	req := httptest.NewRequest("PUT", "/order-tickets/"+string(ticket.ID)+"/payment", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)

	if err != nil {
		t.Fatalf("Failed to test request: %v", err)
	}

	if resp.StatusCode != fiber.StatusOK {
		t.Errorf("Expected status code %d, got %d", fiber.StatusOK, resp.StatusCode)
	}

	var response OrderTicketResponse
	json.NewDecoder(resp.Body).Decode(&response)

	if !response.IsPaid {
		t.Error("Expected ticket to be marked as paid")
	}

	if *response.TransactionID != transactionID {
		t.Errorf("Expected transaction ID %s, got %s", transactionID, *response.TransactionID)
	}
}

func TestOrderTicketHandler_UpdateDelivery(t *testing.T) {
	app := fiber.New()
	mockService := newMockOrderTicketService()
	handler := NewOrderTicketHandler(mockService)

	ctx := context.Background()
	ticket, _ := mockService.CreateTicket(ctx, types.ID("test-order-id"), "TICKET123", types.CASH)
	mockService.UpdatePaymentStatus(ctx, ticket.ID, true, nil)

	app.Put("/order-tickets/:id/deliver", handler.UpdateDelivery)

	req := httptest.NewRequest("PUT", "/order-tickets/"+string(ticket.ID)+"/deliver", nil)
	resp, err := app.Test(req)

	if err != nil {
		t.Fatalf("Failed to test request: %v", err)
	}

	if resp.StatusCode != fiber.StatusOK {
		t.Errorf("Expected status code %d, got %d", fiber.StatusOK, resp.StatusCode)
	}

	var response OrderTicketResponse
	json.NewDecoder(resp.Body).Decode(&response)

	if !response.IsDelivered {
		t.Error("Expected ticket to be marked as delivered")
	}
}
