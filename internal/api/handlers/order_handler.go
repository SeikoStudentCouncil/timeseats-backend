package handlers

import (
	"net/url"

	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/services"
	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/types"
	"github.com/gofiber/fiber/v2"
)

type OrderHandler struct {
	orderService services.OrderService
}

func NewOrderHandler(orderService services.OrderService) *OrderHandler {
	return &OrderHandler{orderService: orderService}
}

// @Summary Create a new order
// @Tags orders
// @Accept json
// @Produce json
// @Param order body CreateOrderRequest true "Order information"
// @Success 201 {object} OrderResponse
// @Failure 400 {object} ErrorResponse
// @Router /orders [post]
func (h *OrderHandler) Create(c *fiber.Ctx) error {
	var req CreateOrderRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid request body")
	}

	var items []services.OrderItemInput
	for _, item := range req.Items {
		items = append(items, services.OrderItemInput{
			ProductID: types.ID(item.ProductID),
			Quantity:  item.Quantity,
		})
	}

	order, err := h.orderService.CreateOrder(c.Context(), types.ID(req.SalesSlotID), items)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	return c.Status(fiber.StatusCreated).JSON(NewOrderResponse(order))
}

// @Summary Get all orders
// @Tags orders
// @Produce json
// @Success 200 {array} OrderResponse
// @Router /orders [get]
func (h *OrderHandler) GetAll(c *fiber.Ctx) error {
	orders, err := h.orderService.GetAllOrders(c.Context())
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	return c.JSON(NewOrderResponseList(orders))
}

// @Summary Get an order by ID
// @Tags orders
// @Produce json
// @Param id path string true "Order ID"
// @Success 200 {object} OrderResponse
// @Failure 404 {object} ErrorResponse
// @Router /orders/{id} [get]
func (h *OrderHandler) GetByID(c *fiber.Ctx) error {
	id, err := url.PathUnescape(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid ID format")
	}
	order, err := h.orderService.GetOrder(c.Context(), types.ID(id))
	if err != nil {
		return fiber.NewError(fiber.StatusNotFound, "Order not found")
	}

	return c.JSON(NewOrderResponse(order))
}

// @Summary Get orders by status
// @Tags orders
// @Produce json
// @Param status query string true "Order Status" Enums(RESERVED, CONFIRMED, CANCELLED)
// @Success 200 {array} OrderResponse
// @Failure 400 {object} ErrorResponse
// @Router /orders/status/{status} [get]
func (h *OrderHandler) GetByStatus(c *fiber.Ctx) error {
	status := c.Params("status")
	var orderStatus types.OrderStatus
	switch status {
	case "RESERVED":
		orderStatus = types.RESERVED
	case "CONFIRMED":
		orderStatus = types.CONFIRMED
	case "CANCELLED":
		orderStatus = types.CANCELLED
	default:
		return fiber.NewError(fiber.StatusBadRequest, "Invalid order status")
	}

	orders, err := h.orderService.GetOrdersByStatus(c.Context(), orderStatus)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	return c.JSON(NewOrderResponseList(orders))
}

// @Summary Cancel an order
// @Tags orders
// @Produce json
// @Param id path string true "Order ID"
// @Success 200 {object} OrderResponse
// @Failure 404 {object} ErrorResponse
// @Router /orders/{id}/cancel [put]
func (h *OrderHandler) Cancel(c *fiber.Ctx) error {
	id, err := url.PathUnescape(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid ID format")
	}
	if err := h.orderService.CancelOrder(c.Context(), types.ID(id)); err != nil {
		return fiber.NewError(fiber.StatusNotFound, "Order not found")
	}

	order, _ := h.orderService.GetOrder(c.Context(), types.ID(id))
	return c.JSON(NewOrderResponse(order))
}

// @Summary Add items to an order
// @Tags orders
// @Accept json
// @Produce json
// @Param id path string true "Order ID"
// @Param items body []OrderItemCreateInput true "Order items"
// @Success 200 {object} OrderResponse
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Router /orders/{id}/items [post]
func (h *OrderHandler) AddItems(c *fiber.Ctx) error {
	id, err := url.PathUnescape(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid ID format")
	}
	var items []OrderItemCreateInput
	if err := c.BodyParser(&items); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid request body")
	}

	var orderItems []services.OrderItemInput
	for _, item := range items {
		orderItems = append(orderItems, services.OrderItemInput{
			ProductID: types.ID(item.ProductID),
			Quantity:  item.Quantity,
		})
	}

	if err := h.orderService.AddOrderItems(c.Context(), types.ID(id), orderItems); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	order, _ := h.orderService.GetOrder(c.Context(), types.ID(id))
	return c.JSON(NewOrderResponse(order))
}
