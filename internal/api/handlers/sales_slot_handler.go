package handlers

import (
	"net/url"
	"time"

	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/services"
	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/types"
	"github.com/gofiber/fiber/v2"
)

type SalesSlotHandler struct {
	salesSlotService services.SalesSlotService
}

func NewSalesSlotHandler(salesSlotService services.SalesSlotService) *SalesSlotHandler {
	return &SalesSlotHandler{salesSlotService: salesSlotService}
}

// @Summary Create a new sales slot
// @Tags sales-slots
// @Accept json
// @Produce json
// @Param slot body CreateSalesSlotRequest true "Sales slot information"
// @Success 201 {object} SalesSlotResponse
// @Failure 400 {object} ErrorResponse
// @Router /sales-slots [post]
func (h *SalesSlotHandler) Create(c *fiber.Ctx) error {
	var req CreateSalesSlotRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid request body")
	}

	startTime, err := time.Parse(time.RFC3339, req.StartTime)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid start time format")
	}

	endTime, err := time.Parse(time.RFC3339, req.EndTime)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid end time format")
	}

	slot, err := h.salesSlotService.CreateSalesSlot(c.Context(), startTime, endTime)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	return c.Status(fiber.StatusCreated).JSON(NewSalesSlotResponse(slot))
}

// @Summary Get all sales slots
// @Tags sales-slots
// @Produce json
// @Success 200 {array} SalesSlotResponse
// @Router /sales-slots [get]
func (h *SalesSlotHandler) GetAll(c *fiber.Ctx) error {
	slots, err := h.salesSlotService.GetAllSalesSlots(c.Context())
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	return c.JSON(NewSalesSlotResponseList(slots))
}

// @Summary Get a sales slot by ID
// @Tags sales-slots
// @Produce json
// @Param id path string true "Sales Slot ID"
// @Success 200 {object} SalesSlotResponse
// @Failure 404 {object} ErrorResponse
// @Router /sales-slots/{id} [get]
func (h *SalesSlotHandler) GetByID(c *fiber.Ctx) error {
	id, err := url.PathUnescape(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid ID format")
	}
	slot, err := h.salesSlotService.GetSalesSlot(c.Context(), types.ID(id))
	if err != nil {
		return fiber.NewError(fiber.StatusNotFound, "Sales slot not found")
	}

	return c.JSON(NewSalesSlotResponse(slot))
}

// @Summary Activate a sales slot
// @Tags sales-slots
// @Produce json
// @Param id path string true "Sales Slot ID"
// @Success 200 {object} SalesSlotResponse
// @Failure 404 {object} ErrorResponse
// @Router /sales-slots/{id}/activate [put]
func (h *SalesSlotHandler) Activate(c *fiber.Ctx) error {
	id, err := url.PathUnescape(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid ID format")
	}
	if err := h.salesSlotService.ActivateSalesSlot(c.Context(), types.ID(id)); err != nil {
		return fiber.NewError(fiber.StatusNotFound, "Sales slot not found")
	}

	slot, _ := h.salesSlotService.GetSalesSlot(c.Context(), types.ID(id)) // id is already unescaped
	return c.JSON(NewSalesSlotResponse(slot))
}

// @Summary Deactivate a sales slot
// @Tags sales-slots
// @Produce json
// @Param id path string true "Sales Slot ID"
// @Success 200 {object} SalesSlotResponse
// @Failure 404 {object} ErrorResponse
// @Router /sales-slots/{id}/deactivate [put]
func (h *SalesSlotHandler) Deactivate(c *fiber.Ctx) error {
	id, err := url.PathUnescape(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid ID format")
	}
	if err := h.salesSlotService.DeactivateSalesSlot(c.Context(), types.ID(id)); err != nil {
		return fiber.NewError(fiber.StatusNotFound, "Sales slot not found")
	}

	slot, _ := h.salesSlotService.GetSalesSlot(c.Context(), types.ID(id))
	return c.JSON(NewSalesSlotResponse(slot))
}

// @Summary Add a product to a sales slot
// @Tags sales-slots
// @Accept json
// @Produce json
// @Param id path string true "Sales Slot ID"
// @Param product body AddProductToSlotRequest true "Product information"
// @Success 201 {object} ProductInventoryResponse
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Router /sales-slots/{id}/products [post]
func (h *SalesSlotHandler) AddProduct(c *fiber.Ctx) error {
	id, err := url.PathUnescape(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid ID format")
	}
	var req AddProductToSlotRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid request body")
	}

	inventory, err := h.salesSlotService.AddProductToSlot(
		c.Context(),
		types.ID(id),
		types.ID(req.ProductID),
		req.InitialQuantity,
	)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	return c.Status(fiber.StatusCreated).JSON(inventory)
}

// @Summary Get all products in a sales slot
// @Tags sales-slots
// @Produce json
// @Param id path string true "Sales Slot ID"
// @Success 200 {array} ProductInventoryResponse
// @Failure 404 {object} ErrorResponse
// @Router /sales-slots/{id}/products [get]
func (h *SalesSlotHandler) GetProducts(c *fiber.Ctx) error {
	id, err := url.PathUnescape(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid ID format")
	}
	inventories, err := h.salesSlotService.GetSlotInventories(c.Context(), types.ID(id))
	if err != nil {
		return fiber.NewError(fiber.StatusNotFound, "Sales slot not found")
	}

	return c.JSON(inventories)
}
