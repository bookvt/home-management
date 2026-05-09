package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"home-management/internal/models"
)

type ExpenseHandler struct {
	DB *pgxpool.Pool
}

func (h *ExpenseHandler) List(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	monthFilter := q.Get("month")
	typeFilter := q.Get("type")

	query := `
		SELECT id, type, amount, month, is_one_off, date, notes, created_at, updated_at
		FROM expenses WHERE 1=1
	`
	args := []any{}
	argN := 1
	if monthFilter != "" {
		query += " AND month = $" + strconv.Itoa(argN)
		args = append(args, monthFilter)
		argN++
	}
	if typeFilter != "" {
		query += " AND type = $" + strconv.Itoa(argN)
		args = append(args, typeFilter)
		argN++
	}
	query += " ORDER BY created_at DESC"

	rows, err := h.DB.Query(r.Context(), query, args...)
	if err != nil {
		jsonError(w, err, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	items := []models.Expense{}
	for rows.Next() {
		var e models.Expense
		if err := rows.Scan(&e.ID, &e.Type, &e.Amount, &e.Month, &e.IsOneOff, &e.Date, &e.Notes, &e.CreatedAt, &e.UpdatedAt); err != nil {
			jsonError(w, err, http.StatusInternalServerError)
			return
		}
		items = append(items, e)
	}
	jsonOK(w, items)
}

func (h *ExpenseHandler) Trends(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query(r.Context(), `
		SELECT month, type, SUM(amount) as total
		FROM expenses
		WHERE is_one_off = false AND month != ''
		GROUP BY month, type
		ORDER BY month DESC
		LIMIT 120
	`)
	if err != nil {
		jsonError(w, err, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	items := []models.MonthlyTrend{}
	for rows.Next() {
		var t models.MonthlyTrend
		if err := rows.Scan(&t.Month, &t.Type, &t.Total); err != nil {
			jsonError(w, err, http.StatusInternalServerError)
			return
		}
		items = append(items, t)
	}
	jsonOK(w, items)
}

type expenseInput struct {
	Type     string   `json:"type"`
	Amount   float64  `json:"amount"`
	Month    string   `json:"month"`
	IsOneOff bool     `json:"is_one_off"`
	Date     *string  `json:"date"`
	Notes    string   `json:"notes"`
}

func (h *ExpenseHandler) Create(w http.ResponseWriter, r *http.Request) {
	var in expenseInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		jsonError(w, err, http.StatusBadRequest)
		return
	}
	var date *time.Time
	if in.Date != nil && *in.Date != "" {
		t, err := time.Parse("2006-01-02", *in.Date)
		if err != nil {
			jsonError(w, err, http.StatusBadRequest)
			return
		}
		date = &t
	}

	var e models.Expense
	err := h.DB.QueryRow(r.Context(), `
		INSERT INTO expenses (type, amount, month, is_one_off, date, notes)
		VALUES ($1,$2,$3,$4,$5,$6)
		RETURNING id, type, amount, month, is_one_off, date, notes, created_at, updated_at
	`, in.Type, in.Amount, in.Month, in.IsOneOff, date, in.Notes).
		Scan(&e.ID, &e.Type, &e.Amount, &e.Month, &e.IsOneOff, &e.Date, &e.Notes, &e.CreatedAt, &e.UpdatedAt)
	if err != nil {
		jsonError(w, err, http.StatusInternalServerError)
		return
	}
	jsonOK(w, e)
}

func (h *ExpenseHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	var e models.Expense
	err := h.DB.QueryRow(r.Context(), `
		SELECT id, type, amount, month, is_one_off, date, notes, created_at, updated_at
		FROM expenses WHERE id=$1
	`, id).Scan(&e.ID, &e.Type, &e.Amount, &e.Month, &e.IsOneOff, &e.Date, &e.Notes, &e.CreatedAt, &e.UpdatedAt)
	if err == pgx.ErrNoRows {
		jsonError(w, err, http.StatusNotFound)
		return
	}
	if err != nil {
		jsonError(w, err, http.StatusInternalServerError)
		return
	}
	jsonOK(w, e)
}

func (h *ExpenseHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	var in expenseInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		jsonError(w, err, http.StatusBadRequest)
		return
	}
	var date *time.Time
	if in.Date != nil && *in.Date != "" {
		t, err := time.Parse("2006-01-02", *in.Date)
		if err != nil {
			jsonError(w, err, http.StatusBadRequest)
			return
		}
		date = &t
	}

	var e models.Expense
	err := h.DB.QueryRow(r.Context(), `
		UPDATE expenses SET type=$1, amount=$2, month=$3, is_one_off=$4, date=$5, notes=$6, updated_at=NOW()
		WHERE id=$7
		RETURNING id, type, amount, month, is_one_off, date, notes, created_at, updated_at
	`, in.Type, in.Amount, in.Month, in.IsOneOff, date, in.Notes, id).
		Scan(&e.ID, &e.Type, &e.Amount, &e.Month, &e.IsOneOff, &e.Date, &e.Notes, &e.CreatedAt, &e.UpdatedAt)
	if err == pgx.ErrNoRows {
		jsonError(w, err, http.StatusNotFound)
		return
	}
	if err != nil {
		jsonError(w, err, http.StatusInternalServerError)
		return
	}
	jsonOK(w, e)
}

func (h *ExpenseHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	ct, err := h.DB.Exec(r.Context(), `DELETE FROM expenses WHERE id=$1`, id)
	if err != nil {
		jsonError(w, err, http.StatusInternalServerError)
		return
	}
	if ct.RowsAffected() == 0 {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
