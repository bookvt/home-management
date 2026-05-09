package handlers

import (
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"home-management/internal/models"
)

type DashboardHandler struct {
	DB *pgxpool.Pool
}

func (h *DashboardHandler) Get(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	now := time.Now()
	thisMonth := now.Format("2006-01")
	in90 := now.AddDate(0, 0, 90)
	in60 := now.AddDate(0, 0, 60)

	data := models.DashboardData{}

	// upcoming maintenance (next 90 days, sorted by due date)
	rows, err := h.DB.Query(ctx, `
		SELECT id, name, date, notes, next_due_date, created_at, updated_at
		FROM maintenance
		WHERE next_due_date IS NOT NULL AND next_due_date <= $1
		ORDER BY next_due_date ASC
		LIMIT 10
	`, in90)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var m models.Maintenance
			if rows.Scan(&m.ID, &m.Name, &m.Date, &m.Notes, &m.NextDueDate, &m.CreatedAt, &m.UpdatedAt) == nil {
				data.UpcomingMaintenance = append(data.UpcomingMaintenance, m)
			}
		}
	}
	if data.UpcomingMaintenance == nil {
		data.UpcomingMaintenance = []models.Maintenance{}
	}

	// expiring warranties within 90 days
	rows2, err := h.DB.Query(ctx, `
		SELECT id, name, category, purchase_date, price, warranty_expiry, notes, image_url, created_at, updated_at
		FROM assets
		WHERE warranty_expiry IS NOT NULL AND warranty_expiry <= $1 AND warranty_expiry >= $2
		ORDER BY warranty_expiry ASC
		LIMIT 10
	`, in90, now)
	if err == nil {
		defer rows2.Close()
		for rows2.Next() {
			var a models.Asset
			if rows2.Scan(&a.ID, &a.Name, &a.Category, &a.PurchaseDate, &a.Price, &a.WarrantyExpiry, &a.Notes, &a.ImageURL, &a.CreatedAt, &a.UpdatedAt) == nil {
				data.ExpiringWarranties = append(data.ExpiringWarranties, a)
			}
		}
	}
	if data.ExpiringWarranties == nil {
		data.ExpiringWarranties = []models.Asset{}
	}

	// expiring documents within 60 days
	rows3, err := h.DB.Query(ctx, `
		SELECT id, title, category, file_url, expiry_date, notes, created_at, updated_at
		FROM documents
		WHERE expiry_date IS NOT NULL AND expiry_date <= $1 AND expiry_date >= $2
		ORDER BY expiry_date ASC
		LIMIT 10
	`, in60, now)
	if err == nil {
		defer rows3.Close()
		for rows3.Next() {
			var d models.Document
			if rows3.Scan(&d.ID, &d.Title, &d.Category, &d.FileURL, &d.ExpiryDate, &d.Notes, &d.CreatedAt, &d.UpdatedAt) == nil {
				data.ExpiringDocuments = append(data.ExpiringDocuments, d)
			}
		}
	}
	if data.ExpiringDocuments == nil {
		data.ExpiringDocuments = []models.Document{}
	}

	// recent expenses (last 5)
	rows4, err := h.DB.Query(ctx, `
		SELECT id, type, amount, month, is_one_off, date, notes, created_at, updated_at
		FROM expenses ORDER BY created_at DESC LIMIT 5
	`)
	if err == nil {
		defer rows4.Close()
		for rows4.Next() {
			var e models.Expense
			if rows4.Scan(&e.ID, &e.Type, &e.Amount, &e.Month, &e.IsOneOff, &e.Date, &e.Notes, &e.CreatedAt, &e.UpdatedAt) == nil {
				data.RecentExpenses = append(data.RecentExpenses, e)
			}
		}
	}
	if data.RecentExpenses == nil {
		data.RecentExpenses = []models.Expense{}
	}

	// total this month
	h.DB.QueryRow(ctx, `
		SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE month=$1
	`, thisMonth).Scan(&data.TotalThisMonth)

	jsonOK(w, data)
}
