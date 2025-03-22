package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/models"
	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/services"
	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/types"
	"github.com/gofiber/fiber/v2"
)

type mockProductService struct {
	products map[types.ID]*models.Product
}

func newMockProductService() *mockProductService {
	return &mockProductService{
		products: make(map[types.ID]*models.Product),
	}
}

func (s *mockProductService) CreateProduct(ctx context.Context, name string, price int) (*models.Product, error) {
	product := &models.Product{
		ID:    types.ID("test-id-" + name), // 名前をIDに含めて一意性を確保
		Name:  name,
		Price: price,
	}
	s.products[product.ID] = product
	return product, nil
}

func (s *mockProductService) GetProduct(ctx context.Context, id types.ID) (*models.Product, error) {
	if product, exists := s.products[id]; exists {
		return product, nil
	}
	return nil, &services.ServiceError{Message: "Product not found"}
}

func (s *mockProductService) GetAllProducts(ctx context.Context) ([]models.Product, error) {
	var products []models.Product
	for _, p := range s.products {
		products = append(products, *p)
	}
	return products, nil
}

func (s *mockProductService) UpdateProduct(ctx context.Context, id types.ID, name string, price int) (*models.Product, error) {
	if product, exists := s.products[id]; exists {
		product.Name = name
		product.Price = price
		return product, nil
	}
	return nil, &services.ServiceError{Message: "Product not found"}
}

func (s *mockProductService) DeleteProduct(ctx context.Context, id types.ID) error {
	if _, exists := s.products[id]; !exists {
		return &services.ServiceError{Message: "Product not found"}
	}
	delete(s.products, id)
	return nil
}

func TestProductHandler_Create(t *testing.T) {
	app := fiber.New()
	mockService := newMockProductService()
	handler := NewProductHandler(mockService)

	app.Post("/products", handler.Create)

	// Test valid request
	reqBody := CreateProductRequest{
		Name:  "Test Product",
		Price: 1000,
	}
	body, _ := json.Marshal(reqBody)

	req := httptest.NewRequest("POST", "/products", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)

	if err != nil {
		t.Fatalf("Failed to test request: %v", err)
	}

	if resp.StatusCode != fiber.StatusCreated {
		t.Errorf("Expected status code %d, got %d", fiber.StatusCreated, resp.StatusCode)
	}

	var response ProductResponse
	json.NewDecoder(resp.Body).Decode(&response)

	if response.Name != reqBody.Name {
		t.Errorf("Expected product name %s, got %s", reqBody.Name, response.Name)
	}

	if response.Price != reqBody.Price {
		t.Errorf("Expected product price %d, got %d", reqBody.Price, response.Price)
	}
}

func TestProductHandler_GetAll(t *testing.T) {
	app := fiber.New()
	mockService := newMockProductService()
	handler := NewProductHandler(mockService)

	// Add test data
	ctx := context.Background()
	mockService.CreateProduct(ctx, "Product 1", 1000)
	mockService.CreateProduct(ctx, "Product 2", 2000)

	app.Get("/products", handler.GetAll)

	req := httptest.NewRequest("GET", "/products", nil)
	resp, err := app.Test(req)

	if err != nil {
		t.Fatalf("Failed to test request: %v", err)
	}

	if resp.StatusCode != fiber.StatusOK {
		t.Errorf("Expected status code %d, got %d", fiber.StatusOK, resp.StatusCode)
	}

	var response []ProductResponse
	json.NewDecoder(resp.Body).Decode(&response)

	if len(response) != 2 {
		t.Errorf("Expected 2 products, got %d", len(response))
	}
}

func TestProductHandler_GetByID(t *testing.T) {
	app := fiber.New()
	mockService := newMockProductService()
	handler := NewProductHandler(mockService)

	ctx := context.Background()
	product, _ := mockService.CreateProduct(ctx, "Test Product", 1000)

	app.Get("/products/:id", handler.GetByID)

	req := httptest.NewRequest("GET", "/products/"+url.PathEscape(string(product.ID)), nil)
	resp, err := app.Test(req)

	if err != nil {
		t.Fatalf("Failed to test request: %v", err)
	}

	if resp.StatusCode != fiber.StatusOK {
		t.Errorf("Expected status code %d, got %d", fiber.StatusOK, resp.StatusCode)
	}

	var response ProductResponse
	json.NewDecoder(resp.Body).Decode(&response)

	if response.ID != string(product.ID) {
		t.Errorf("Expected product ID %s, got %s", string(product.ID), response.ID)
	}
}

func TestProductHandler_Update(t *testing.T) {
	app := fiber.New()
	mockService := newMockProductService()
	handler := NewProductHandler(mockService)

	// Add test data
	ctx := context.Background()
	product, _ := mockService.CreateProduct(ctx, "Test Product", 1000)

	app.Put("/products/:id", handler.Update)

	reqBody := UpdateProductRequest{
		Name:  "Updated Product",
		Price: 2000,
	}
	body, _ := json.Marshal(reqBody)

	req := httptest.NewRequest("PUT", "/products/"+url.PathEscape(string(product.ID)), bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)

	if err != nil {
		t.Fatalf("Failed to test request: %v", err)
	}

	if resp.StatusCode != fiber.StatusOK {
		t.Errorf("Expected status code %d, got %d", fiber.StatusOK, resp.StatusCode)
	}

	var response ProductResponse
	json.NewDecoder(resp.Body).Decode(&response)

	if response.Name != reqBody.Name {
		t.Errorf("Expected product name %s, got %s", reqBody.Name, response.Name)
	}

	if response.Price != reqBody.Price {
		t.Errorf("Expected product price %d, got %d", reqBody.Price, response.Price)
	}
}

func TestProductHandler_Delete(t *testing.T) {
	app := fiber.New()
	mockService := newMockProductService()
	handler := NewProductHandler(mockService)

	// Add test data
	ctx := context.Background()
	product, _ := mockService.CreateProduct(ctx, "Test Product", 1000)

	app.Delete("/products/:id", handler.Delete)

	req := httptest.NewRequest("DELETE", "/products/"+url.PathEscape(string(product.ID)), nil)
	resp, err := app.Test(req)

	if err != nil {
		t.Fatalf("Failed to test request: %v", err)
	}

	if resp.StatusCode != fiber.StatusNoContent {
		t.Errorf("Expected status code %d, got %d", fiber.StatusNoContent, resp.StatusCode)
	}
}
