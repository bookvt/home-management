package models

import "time"

type Maintenance struct {
	ID          int64      `json:"id"`
	Name        string     `json:"name"`
	Date        time.Time  `json:"date"`
	Notes       string     `json:"notes"`
	NextDueDate *time.Time `json:"next_due_date"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

type Asset struct {
	ID             int64      `json:"id"`
	Name           string     `json:"name"`
	Category       string     `json:"category"`
	PurchaseDate   *time.Time `json:"purchase_date"`
	Price          *float64   `json:"price"`
	WarrantyExpiry *time.Time `json:"warranty_expiry"`
	Notes          string     `json:"notes"`
	ImageURL       string     `json:"image_url"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

type Expense struct {
	ID        int64      `json:"id"`
	Type      string     `json:"type"`
	Amount    float64    `json:"amount"`
	Month     string     `json:"month"`
	IsOneOff  bool       `json:"is_one_off"`
	Date      *time.Time `json:"date"`
	Notes     string     `json:"notes"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

type Document struct {
	ID         int64      `json:"id"`
	Title      string     `json:"title"`
	Category   string     `json:"category"`
	FileURL    string     `json:"file_url"`
	ExpiryDate *time.Time `json:"expiry_date"`
	Notes      string     `json:"notes"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
}

type MonthlyTrend struct {
	Month  string  `json:"month"`
	Type   string  `json:"type"`
	Total  float64 `json:"total"`
}

type SearchResult struct {
	ID       int64  `json:"id"`
	Category string `json:"category"`
	Title    string `json:"title"`
	Subtitle string `json:"subtitle"`
}

type DashboardData struct {
	UpcomingMaintenance []Maintenance  `json:"upcoming_maintenance"`
	ExpiringWarranties  []Asset        `json:"expiring_warranties"`
	ExpiringDocuments   []Document     `json:"expiring_documents"`
	RecentExpenses      []Expense      `json:"recent_expenses"`
	TotalThisMonth      float64        `json:"total_this_month"`
}
