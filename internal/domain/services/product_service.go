package services

import (
	"context"

	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/models"
	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/repositories"
	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/types"
	"github.com/google/uuid"
)

type ProductService interface {
	CreateProduct(ctx context.Context, name string, price int) (*models.Product, error)
	GetProduct(ctx context.Context, id types.ID) (*models.Product, error)
	GetAllProducts(ctx context.Context) ([]models.Product, error)
	UpdateProduct(ctx context.Context, id types.ID, name string, price int) (*models.Product, error)
	DeleteProduct(ctx context.Context, id types.ID) error
}

type productService struct {
	repo repositories.ProductRepository
}

func NewProductService(repo repositories.ProductRepository) ProductService {
	return &productService{repo: repo}
}

func (s *productService) CreateProduct(ctx context.Context, name string, price int) (*models.Product, error) {
	product := &models.Product{
		ID:    types.ID(uuid.New().String()),
		Name:  name,
		Price: price,
	}

	if err := s.repo.Create(ctx, product); err != nil {
		return nil, err
	}

	return product, nil
}

func (s *productService) GetProduct(ctx context.Context, id types.ID) (*models.Product, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *productService) GetAllProducts(ctx context.Context) ([]models.Product, error) {
	return s.repo.FindAll(ctx)
}

func (s *productService) UpdateProduct(ctx context.Context, id types.ID, name string, price int) (*models.Product, error) {
	product, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	product.Name = name
	product.Price = price

	if err := s.repo.Update(ctx, product); err != nil {
		return nil, err
	}

	return product, nil
}

func (s *productService) DeleteProduct(ctx context.Context, id types.ID) error {
	return s.repo.Delete(ctx, id)
}
