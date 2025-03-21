package services

type ServiceError struct {
	Message string
}

func (e *ServiceError) Error() string {
	return e.Message
}

var (
	ErrInsufficientInventory = &ServiceError{Message: "商品の在庫が不足しています"}
	ErrInvalidOrderStatus    = &ServiceError{Message: "注文のステータスが無効です"}
	ErrPaymentRequired       = &ServiceError{Message: "支払いが必要です"}
	ErrDeliveryNotAllowed    = &ServiceError{Message: "商品の受け渡しができません"}
	ErrDuplicateInventory    = &ServiceError{Message: "指定された販売枠に既に商品が登録されています"}
	ErrInvalidTimeRange      = &ServiceError{Message: "無効な時間範囲です"}
)
