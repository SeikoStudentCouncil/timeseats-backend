package services

import (
	"context"
	"testing"

	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/models"
	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/repositories"
	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/types"
	"github.com/google/uuid"
)

type mockProductRepository struct {
	products map[types.ID]*models.Product
}

func newMockProductRepository() *mockProductRepository {
	return &mockProductRepository{
		products: make(map[types.ID]*models.Product),
	}
}

func (r *mockProductRepository) Create(ctx context.Context, product *models.Product) error {
	if product.ID == "" {
		product.ID = types.ID(uuid.New().String())
	}
	r.products[product.ID] = product
	return nil
}

func (r *mockProductRepository) FindByID(ctx context.Context, id types.ID) (*models.Product, error) {
	if product, exists := r.products[id]; exists {
		return product, nil
	}
	return nil, repositories.NewErrNotFound("Product", id)
}

func (r *mockProductRepository) FindAll(ctx context.Context) ([]models.Product, error) {
	var products []models.Product
	for _, p := range r.products {
		products = append(products, *p)
	}
	return products, nil
}

func (r *mockProductRepository) Update(ctx context.Context, product *models.Product) error {
	if _, exists := r.products[product.ID]; !exists {
		return repositories.NewErrNotFound("Product", product.ID)
	}
	r.products[product.ID] = product
	return nil
}

func (r *mockProductRepository) Delete(ctx context.Context, id types.ID) error {
	if _, exists := r.products[id]; !exists {
		return repositories.NewErrNotFound("Product", id)
	}
	delete(r.products, id)
	return nil
}

func (r *mockProductRepository) FindByName(ctx context.Context, name string) (*models.Product, error) {
	for _, product := range r.products {
		if product.Name == name {
			return product, nil
		}
	}
	return nil, &repositories.RepositoryError{
		Operation: "FindByName",
		Err:       nil,
	}
}

func TestProductService_CreateProduct(t *testing.T) {
	repo := newMockProductRepository()
	service := NewProductService(repo)
	ctx := context.Background()

	product, err := service.CreateProduct(ctx, "Test Product", 1000)
	if err != nil {
		t.Errorf("CreateProduct failed: %v", err)
	}

	if product.Name != "Test Product" {
		t.Errorf("Expected product name %s, got %s", "Test Product", product.Name)
	}

	if product.Price != 1000 {
		t.Errorf("Expected product price %d, got %d", 1000, product.Price)
	}

	// UUIDの形式を確認
	if _, err := uuid.Parse(string(product.ID)); err != nil {
		t.Errorf("Expected product ID to be a valid UUID, got %s", product.ID)
	}
}

func TestProductService_GetProduct(t *testing.T) {
	repo := newMockProductRepository()
	service := NewProductService(repo)
	ctx := context.Background()

	created, _ := service.CreateProduct(ctx, "Test Product", 1000)

	product, err := service.GetProduct(ctx, created.ID)
	if err != nil {
		t.Errorf("GetProduct failed: %v", err)
	}

	if product.Name != created.Name {
		t.Errorf("Expected product name %s, got %s", created.Name, product.Name)
	}

	if product.Price != created.Price {
		t.Errorf("Expected product price %d, got %d", created.Price, product.Price)
	}
}

func TestProductService_GetAllProducts(t *testing.T) {
	repo := newMockProductRepository()
	service := NewProductService(repo)
	ctx := context.Background()

	p1, _ := service.CreateProduct(ctx, "Product 1", 1000)
	p2, _ := service.CreateProduct(ctx, "Product 2", 2000)

	products, err := service.GetAllProducts(ctx)
	if err != nil {
		t.Errorf("GetAllProducts failed: %v", err)
	}

	if len(products) != 2 {
		t.Errorf("Expected 2 products, got %d", len(products))
	}

	// 製品の存在確認
	found := make(map[types.ID]bool)
	for _, p := range products {
		found[p.ID] = true
	}

	if !found[p1.ID] || !found[p2.ID] {
		t.Error("Not all created products were returned")
	}
}

func TestProductService_UpdateProduct(t *testing.T) {
	repo := newMockProductRepository()
	service := NewProductService(repo)
	ctx := context.Background()

	created, _ := service.CreateProduct(ctx, "Test Product", 1000)

	updated, err := service.UpdateProduct(ctx, created.ID, "Updated Product", 2000)
	if err != nil {
		t.Errorf("UpdateProduct failed: %v", err)
	}

	if updated.Name != "Updated Product" {
		t.Errorf("Expected product name %s, got %s", "Updated Product", updated.Name)
	}

	if updated.Price != 2000 {
		t.Errorf("Expected product price %d, got %d", 2000, updated.Price)
	}
}

func TestProductService_DeleteProduct(t *testing.T) {
	repo := newMockProductRepository()
	service := NewProductService(repo)
	ctx := context.Background()

	created, _ := service.CreateProduct(ctx, "Test Product", 1000)

	err := service.DeleteProduct(ctx, created.ID)
	if err != nil {
		t.Errorf("DeleteProduct failed: %v", err)
	}

	_, err = service.GetProduct(ctx, created.ID)
	if err == nil {
		t.Error("Expected error when getting deleted product")
	}
}
