package models

import (
	"time"

	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/types"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ProductInventory struct {
	ID               types.ID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	SalesSlotID      types.ID `gorm:"type:uuid"`
	ProductID        types.ID `gorm:"type:uuid"`
	InitialQuantity  int
	ReservedQuantity int `gorm:"default:0"`
	SoldQuantity     int `gorm:"default:0"`
	CreatedAt        time.Time
	UpdatedAt        time.Time
	DeletedAt        gorm.DeletedAt `gorm:"index"`

	SalesSlot *SalesSlot `gorm:"foreignKey:SalesSlotID"`
	Product   *Product   `gorm:"foreignKey:ProductID"`
}

func (pi *ProductInventory) BeforeCreate(tx *gorm.DB) error {
	if pi.ID == "" {
		pi.ID = types.ID(uuid.New().String())
	}
	return nil
}

func (pi *ProductInventory) GetAvailableQuantity() int {
	return pi.InitialQuantity - pi.ReservedQuantity - pi.SoldQuantity
}
