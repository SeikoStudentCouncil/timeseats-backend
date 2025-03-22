package types

type OrderStatus int

const (
	_ OrderStatus = iota
	RESERVED
	CONFIRMED
	CANCELLED
)

func (s OrderStatus) String() string {
	switch s {
	case RESERVED:
		return "RESERVED"
	case CONFIRMED:
		return "CONFIRMED"
	case CANCELLED:
		return "CANCELLED"
	default:
		return "RESERVED"
	}
}
