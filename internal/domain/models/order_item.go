package models

import (
	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/types"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type OrderItem struct {
	ID        types.ID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	OrderID   types.ID `gorm:"type:uuid"`
	ProductID types.ID `gorm:"type:uuid"`
	Quantity  int
	Price     int

	Order   *Order   `gorm:"foreignKey:OrderID"`
	Product *Product `gorm:"foreignKey:ProductID"`
}

func (oi *OrderItem) BeforeCreate(tx *gorm.DB) error {
	if oi.ID == "" {
		oi.ID = types.ID(uuid.New().String())
	}
	return nil
}

func (oi *OrderItem) GetSubtotal() int {
	return oi.Price * oi.Quantity
}
