package models

import (
	"time"

	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/types"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Product struct {
	ID        types.ID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	Name      string
	Price     int
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`
}

func (p *Product) BeforeCreate(tx *gorm.DB) error {
	if p.ID == "" {
		p.ID = types.ID(uuid.New().String())
	}
	return nil
}
