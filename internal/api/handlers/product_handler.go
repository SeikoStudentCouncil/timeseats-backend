package handlers

import (
	"net/url"

	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/services"
	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/types"
	"github.com/gofiber/fiber/v2"
)

type ProductHandler struct {
	productService services.ProductService
}

func NewProductHandler(productService services.ProductService) *ProductHandler {
	return &ProductHandler{productService: productService}
}

// @Summary Create a new product
// @Tags products
// @Accept json
// @Produce json
// @Param product body CreateProductRequest true "Product information"
// @Success 201 {object} ProductResponse
// @Failure 400 {object} ErrorResponse
// @Router /products [post]
func (h *ProductHandler) Create(c *fiber.Ctx) error {
	var req CreateProductRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid request body")
	}

	product, err := h.productService.CreateProduct(c.Context(), req.Name, req.Price)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	return c.Status(fiber.StatusCreated).JSON(NewProductResponse(product))
}

// @Summary Get all products
// @Tags products
// @Produce json
// @Success 200 {array} ProductResponse
// @Router /products [get]
func (h *ProductHandler) GetAll(c *fiber.Ctx) error {
	products, err := h.productService.GetAllProducts(c.Context())
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	return c.JSON(NewProductResponseList(products))
}

// @Summary Get a product by ID
// @Tags products
// @Produce json
// @Param id path string true "Product ID"
// @Success 200 {object} ProductResponse
// @Failure 404 {object} ErrorResponse
// @Router /products/{id} [get]
func (h *ProductHandler) GetByID(c *fiber.Ctx) error {
	id, err := url.PathUnescape(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	product, err := h.productService.GetProduct(c.Context(), types.ID(id))
	if err != nil {
		return fiber.NewError(fiber.StatusNotFound, "Product not found")
	}

	return c.JSON(NewProductResponse(product))
}

// @Summary Update a product
// @Tags products
// @Accept json
// @Produce json
// @Param id path string true "Product ID"
// @Param product body UpdateProductRequest true "Product information"
// @Success 200 {object} ProductResponse
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Router /products/{id} [put]
func (h *ProductHandler) Update(c *fiber.Ctx) error {
	id, err := url.PathUnescape(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid ID format")
	}
	var req UpdateProductRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid request body")
	}

	product, err := h.productService.UpdateProduct(c.Context(), types.ID(id), req.Name, req.Price)
	if err != nil {
		return fiber.NewError(fiber.StatusNotFound, "Product not found")
	}

	return c.JSON(NewProductResponse(product))
}

// @Summary Delete a product
// @Tags products
// @Param id path string true "Product ID"
// @Success 204 "No Content"
// @Failure 404 {object} ErrorResponse
// @Router /products/{id} [delete]
func (h *ProductHandler) Delete(c *fiber.Ctx) error {
	id, err := url.PathUnescape(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid ID format")
	}
	if err := h.productService.DeleteProduct(c.Context(), types.ID(id)); err != nil {
		return fiber.NewError(fiber.StatusNotFound, "Product not found")
	}

	return c.SendStatus(fiber.StatusNoContent)
}
