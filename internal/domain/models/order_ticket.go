package models

import (
	"time"

	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/types"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type OrderTicket struct {
	ID            types.ID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	TicketNumber  string   `gorm:"unique"`
	OrderID       types.ID `gorm:"type:uuid;unique"`
	PaymentMethod types.PaymentMethod
	TransactionID *string
	IsPaid        bool `gorm:"default:false"`
	IsDelivered   bool `gorm:"default:false"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
	DeletedAt     gorm.DeletedAt `gorm:"index"`

	Order *Order `gorm:"foreignKey:OrderID"`
}

func (ot *OrderTicket) BeforeCreate(tx *gorm.DB) error {
	if ot.ID == "" {
		ot.ID = types.ID(uuid.New().String())
	}
	if ot.PaymentMethod == 0 {
		ot.PaymentMethod = types.CASH
	}
	return nil
}
