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

type MaintenanceHandler struct {
	DB *pgxpool.Pool
}

func (h *MaintenanceHandler) List(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query(r.Context(), `
		SELECT id, name, date, notes, next_due_date, created_at, updated_at
		FROM maintenance
		ORDER BY next_due_date ASC NULLS LAST, date DESC
	`)
	if err != nil {
		jsonError(w, err, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	items := []models.Maintenance{}
	for rows.Next() {
		var m models.Maintenance
		if err := rows.Scan(&m.ID, &m.Name, &m.Date, &m.Notes, &m.NextDueDate, &m.CreatedAt, &m.UpdatedAt); err != nil {
			jsonError(w, err, http.StatusInternalServerError)
			return
		}
		items = append(items, m)
	}
	jsonOK(w, items)
}

type maintenanceInput struct {
	Name        string  `json:"name"`
	Date        string  `json:"date"`
	Notes       string  `json:"notes"`
	NextDueDate *string `json:"next_due_date"`
}

func (h *MaintenanceHandler) Create(w http.ResponseWriter, r *http.Request) {
	var in maintenanceInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		jsonError(w, err, http.StatusBadRequest)
		return
	}
	date, err := time.Parse("2006-01-02", in.Date)
	if err != nil {
		jsonError(w, err, http.StatusBadRequest)
		return
	}
	var nextDue *time.Time
	if in.NextDueDate != nil && *in.NextDueDate != "" {
		t, err := time.Parse("2006-01-02", *in.NextDueDate)
		if err != nil {
			jsonError(w, err, http.StatusBadRequest)
			return
		}
		nextDue = &t
	}

	var m models.Maintenance
	err = h.DB.QueryRow(r.Context(), `
		INSERT INTO maintenance (name, date, notes, next_due_date)
		VALUES ($1, $2, $3, $4)
		RETURNING id, name, date, notes, next_due_date, created_at, updated_at
	`, in.Name, date, in.Notes, nextDue).
		Scan(&m.ID, &m.Name, &m.Date, &m.Notes, &m.NextDueDate, &m.CreatedAt, &m.UpdatedAt)
	if err != nil {
		jsonError(w, err, http.StatusInternalServerError)
		return
	}
	jsonOK(w, m)
}

func (h *MaintenanceHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	var m models.Maintenance
	err := h.DB.QueryRow(r.Context(), `
		SELECT id, name, date, notes, next_due_date, created_at, updated_at
		FROM maintenance WHERE id = $1
	`, id).Scan(&m.ID, &m.Name, &m.Date, &m.Notes, &m.NextDueDate, &m.CreatedAt, &m.UpdatedAt)
	if err == pgx.ErrNoRows {
		jsonError(w, err, http.StatusNotFound)
		return
	}
	if err != nil {
		jsonError(w, err, http.StatusInternalServerError)
		return
	}
	jsonOK(w, m)
}

func (h *MaintenanceHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	var in maintenanceInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		jsonError(w, err, http.StatusBadRequest)
		return
	}
	date, err := time.Parse("2006-01-02", in.Date)
	if err != nil {
		jsonError(w, err, http.StatusBadRequest)
		return
	}
	var nextDue *time.Time
	if in.NextDueDate != nil && *in.NextDueDate != "" {
		t, err := time.Parse("2006-01-02", *in.NextDueDate)
		if err != nil {
			jsonError(w, err, http.StatusBadRequest)
			return
		}
		nextDue = &t
	}

	var m models.Maintenance
	err = h.DB.QueryRow(r.Context(), `
		UPDATE maintenance SET name=$1, date=$2, notes=$3, next_due_date=$4, updated_at=NOW()
		WHERE id=$5
		RETURNING id, name, date, notes, next_due_date, created_at, updated_at
	`, in.Name, date, in.Notes, nextDue, id).
		Scan(&m.ID, &m.Name, &m.Date, &m.Notes, &m.NextDueDate, &m.CreatedAt, &m.UpdatedAt)
	if err == pgx.ErrNoRows {
		jsonError(w, err, http.StatusNotFound)
		return
	}
	if err != nil {
		jsonError(w, err, http.StatusInternalServerError)
		return
	}
	jsonOK(w, m)
}

func (h *MaintenanceHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	ct, err := h.DB.Exec(r.Context(), `DELETE FROM maintenance WHERE id=$1`, id)
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
