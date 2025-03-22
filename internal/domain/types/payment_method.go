package types

type PaymentMethod int

const (
	_ PaymentMethod = iota
	CASH
	PAYPAY
	SQUARE
)

func (s PaymentMethod) String() string {
	switch s {
	case CASH:
		return "CASH"
	case PAYPAY:
		return "PAYPAY"
	case SQUARE:
		return "SQUARE"
	default:
		return "CASH"
	}
}
