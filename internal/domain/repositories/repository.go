package repositories

import (
	"context"

	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/types"
)

type Repository[T any] interface {
	Create(ctx context.Context, entity *T) error
	FindByID(ctx context.Context, id types.ID) (*T, error)
	FindAll(ctx context.Context) ([]T, error)
	Update(ctx context.Context, entity *T) error
	Delete(ctx context.Context, id types.ID) error
}

type RepositoryError struct {
	Operation string
	Err       error
}

func (e *RepositoryError) Error() string {
	return e.Operation + ": " + e.Err.Error()
}

type ErrNotFound struct {
	Entity string
	ID     types.ID
}

func (e *ErrNotFound) Error() string {
	return "entity " + e.Entity + " with ID " + string(e.ID) + " not found"
}

func NewErrNotFound(entity string, id types.ID) error {
	return &ErrNotFound{
		Entity: entity,
		ID:     id,
	}
}
