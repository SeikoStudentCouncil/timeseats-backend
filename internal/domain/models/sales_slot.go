package models

import (
	"time"

	"github.com/SeikoStudentCouncil/timeseats-backend/internal/domain/types"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SalesSlot struct {
	ID        types.ID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	StartTime time.Time
	EndTime   time.Time
	IsActive  bool
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`
}

func (s *SalesSlot) BeforeCreate(tx *gorm.DB) error {
	if s.ID == "" {
		s.ID = types.ID(uuid.New().String())
	}
	return nil
}
