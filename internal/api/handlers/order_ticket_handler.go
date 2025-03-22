package handlers

import (
	"net/url"

	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/services"
	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/types"
	"github.com/gofiber/fiber/v2"
)

type OrderTicketHandler struct {
	ticketService services.OrderTicketService
}

func NewOrderTicketHandler(ticketService services.OrderTicketService) *OrderTicketHandler {
	return &OrderTicketHandler{ticketService: ticketService}
}

// @Summary Create a new order ticket
// @Tags order-tickets
// @Accept json
// @Produce json
// @Param ticket body CreateOrderTicketRequest true "Ticket information"
// @Success 201 {object} OrderTicketResponse
// @Failure 400 {object} ErrorResponse
// @Router /order-tickets [post]
func (h *OrderTicketHandler) Create(c *fiber.Ctx) error {
	var req CreateOrderTicketRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid request body")
	}

	ticket, err := h.ticketService.CreateTicket(
		c.Context(),
		types.ID(req.OrderID),
		req.TicketNumber,
		types.PaymentMethod(req.PaymentMethod),
	)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	return c.Status(fiber.StatusCreated).JSON(ticket)
}

// @Summary Get all order tickets
// @Tags order-tickets
// @Produce json
// @Success 200 {array} OrderTicketResponse
// @Router /order-tickets [get]
func (h *OrderTicketHandler) GetAll(c *fiber.Ctx) error {
	tickets, err := h.ticketService.GetAllTickets(c.Context())
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	return c.JSON(tickets)
}

// @Summary Get an order ticket by ID
// @Tags order-tickets
// @Produce json
// @Param id path string true "Ticket ID"
// @Success 200 {object} OrderTicketResponse
// @Failure 404 {object} ErrorResponse
// @Router /order-tickets/{id} [get]
func (h *OrderTicketHandler) GetByID(c *fiber.Ctx) error {
	id, err := url.PathUnescape(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid ID format")
	}
	ticket, err := h.ticketService.GetTicket(c.Context(), types.ID(id))
	if err != nil {
		return fiber.NewError(fiber.StatusNotFound, "Ticket not found")
	}

	return c.JSON(ticket)
}

// @Summary Get an order ticket by ticket number
// @Tags order-tickets
// @Produce json
// @Param ticketNumber path string true "Ticket Number"
// @Success 200 {object} OrderTicketResponse
// @Failure 404 {object} ErrorResponse
// @Router /order-tickets/number/{ticketNumber} [get]
func (h *OrderTicketHandler) GetByNumber(c *fiber.Ctx) error {
	number := c.Params("ticketNumber")
	ticket, err := h.ticketService.GetTicketByNumber(c.Context(), number)
	if err != nil {
		return fiber.NewError(fiber.StatusNotFound, "Ticket not found")
	}

	return c.JSON(ticket)
}

// @Summary Update payment status
// @Tags order-tickets
// @Accept json
// @Produce json
// @Param id path string true "Ticket ID"
// @Param status body UpdatePaymentStatusRequest true "Payment Status"
// @Success 200 {object} OrderTicketResponse
// @Failure 404 {object} ErrorResponse
// @Router /order-tickets/{id}/payment [put]
func (h *OrderTicketHandler) UpdatePayment(c *fiber.Ctx) error {
	id, err := url.PathUnescape(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid ID format")
	}
	var req UpdatePaymentStatusRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid request body")
	}

	err = h.ticketService.UpdatePaymentStatus(c.Context(), types.ID(id), req.IsPaid, req.TransactionID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	ticket, _ := h.ticketService.GetTicket(c.Context(), types.ID(id))
	return c.JSON(ticket)
}

// @Summary Update delivery status
// @Tags order-tickets
// @Accept json
// @Produce json
// @Param id path string true "Ticket ID"
// @Success 200 {object} OrderTicketResponse
// @Failure 404 {object} ErrorResponse
// @Router /order-tickets/{id}/deliver [put]
func (h *OrderTicketHandler) UpdateDelivery(c *fiber.Ctx) error {
	id, err := url.PathUnescape(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid ID format")
	}
	err = h.ticketService.UpdateDeliveryStatus(c.Context(), types.ID(id), true)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	ticket, _ := h.ticketService.GetTicket(c.Context(), types.ID(id))
	return c.JSON(ticket)
}
