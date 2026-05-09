package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"home-management/internal/models"
)

type DocumentHandler struct {
	DB  *pgxpool.Pool
	Cld *cloudinary.Cloudinary
}

func (h *DocumentHandler) List(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query(r.Context(), `
		SELECT id, title, category, file_url, expiry_date, notes, created_at, updated_at
		FROM documents ORDER BY expiry_date ASC NULLS LAST, title ASC
	`)
	if err != nil {
		jsonError(w, err, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	items := []models.Document{}
	for rows.Next() {
		var d models.Document
		if err := rows.Scan(&d.ID, &d.Title, &d.Category, &d.FileURL, &d.ExpiryDate, &d.Notes, &d.CreatedAt, &d.UpdatedAt); err != nil {
			jsonError(w, err, http.StatusInternalServerError)
			return
		}
		items = append(items, d)
	}
	jsonOK(w, items)
}

func (h *DocumentHandler) Create(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		jsonError(w, err, http.StatusBadRequest)
		return
	}

	title := r.FormValue("title")
	category := r.FormValue("category")
	notes := r.FormValue("notes")

	var expiryDate *time.Time
	if s := r.FormValue("expiry_date"); s != "" {
		t, err := time.Parse("2006-01-02", s)
		if err != nil {
			jsonError(w, fmt.Errorf("invalid expiry_date"), http.StatusBadRequest)
			return
		}
		expiryDate = &t
	}

	file, _, err := r.FormFile("file")
	if err != nil {
		jsonError(w, fmt.Errorf("file is required"), http.StatusBadRequest)
		return
	}
	defer file.Close()

	res, err := h.Cld.Upload.Upload(context.Background(), file, uploader.UploadParams{
		Folder:       "home-management/documents",
		ResourceType: "auto",
	})
	if err != nil {
		jsonError(w, fmt.Errorf("cloudinary upload: %w", err), http.StatusInternalServerError)
		return
	}

	var d models.Document
	err = h.DB.QueryRow(r.Context(), `
		INSERT INTO documents (title, category, file_url, expiry_date, notes)
		VALUES ($1,$2,$3,$4,$5)
		RETURNING id, title, category, file_url, expiry_date, notes, created_at, updated_at
	`, title, category, res.SecureURL, expiryDate, notes).
		Scan(&d.ID, &d.Title, &d.Category, &d.FileURL, &d.ExpiryDate, &d.Notes, &d.CreatedAt, &d.UpdatedAt)
	if err != nil {
		jsonError(w, err, http.StatusInternalServerError)
		return
	}
	jsonOK(w, d)
}

func (h *DocumentHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	var d models.Document
	err := h.DB.QueryRow(r.Context(), `
		SELECT id, title, category, file_url, expiry_date, notes, created_at, updated_at
		FROM documents WHERE id=$1
	`, id).Scan(&d.ID, &d.Title, &d.Category, &d.FileURL, &d.ExpiryDate, &d.Notes, &d.CreatedAt, &d.UpdatedAt)
	if err == pgx.ErrNoRows {
		jsonError(w, err, http.StatusNotFound)
		return
	}
	if err != nil {
		jsonError(w, err, http.StatusInternalServerError)
		return
	}
	jsonOK(w, d)
}

func (h *DocumentHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)

	// Try multipart first (for file update), then JSON
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		var body struct {
			Title      string  `json:"title"`
			Category   string  `json:"category"`
			ExpiryDate *string `json:"expiry_date"`
			Notes      string  `json:"notes"`
		}
		if err2 := json.NewDecoder(r.Body).Decode(&body); err2 != nil {
			jsonError(w, err, http.StatusBadRequest)
			return
		}
		var expiryDate *time.Time
		if body.ExpiryDate != nil && *body.ExpiryDate != "" {
			t, _ := time.Parse("2006-01-02", *body.ExpiryDate)
			expiryDate = &t
		}
		var d models.Document
		err3 := h.DB.QueryRow(r.Context(), `
			UPDATE documents SET title=$1, category=$2, expiry_date=$3, notes=$4, updated_at=NOW()
			WHERE id=$5
			RETURNING id, title, category, file_url, expiry_date, notes, created_at, updated_at
		`, body.Title, body.Category, expiryDate, body.Notes, id).
			Scan(&d.ID, &d.Title, &d.Category, &d.FileURL, &d.ExpiryDate, &d.Notes, &d.CreatedAt, &d.UpdatedAt)
		if err3 == pgx.ErrNoRows {
			jsonError(w, err3, http.StatusNotFound)
			return
		}
		if err3 != nil {
			jsonError(w, err3, http.StatusInternalServerError)
			return
		}
		jsonOK(w, d)
		return
	}

	title := r.FormValue("title")
	category := r.FormValue("category")
	notes := r.FormValue("notes")

	var expiryDate *time.Time
	if s := r.FormValue("expiry_date"); s != "" {
		t, _ := time.Parse("2006-01-02", s)
		expiryDate = &t
	}

	var existingURL string
	h.DB.QueryRow(r.Context(), `SELECT file_url FROM documents WHERE id=$1`, id).Scan(&existingURL)

	fileURL := existingURL
	file, _, err := r.FormFile("file")
	if err == nil {
		defer file.Close()
		res, err := h.Cld.Upload.Upload(context.Background(), file, uploader.UploadParams{
			Folder:       "home-management/documents",
			ResourceType: "auto",
		})
		if err != nil {
			jsonError(w, fmt.Errorf("cloudinary upload: %w", err), http.StatusInternalServerError)
			return
		}
		fileURL = res.SecureURL
	}

	var d models.Document
	err = h.DB.QueryRow(r.Context(), `
		UPDATE documents SET title=$1, category=$2, file_url=$3, expiry_date=$4, notes=$5, updated_at=NOW()
		WHERE id=$6
		RETURNING id, title, category, file_url, expiry_date, notes, created_at, updated_at
	`, title, category, fileURL, expiryDate, notes, id).
		Scan(&d.ID, &d.Title, &d.Category, &d.FileURL, &d.ExpiryDate, &d.Notes, &d.CreatedAt, &d.UpdatedAt)
	if err == pgx.ErrNoRows {
		jsonError(w, err, http.StatusNotFound)
		return
	}
	if err != nil {
		jsonError(w, err, http.StatusInternalServerError)
		return
	}
	jsonOK(w, d)
}

func (h *DocumentHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	ct, err := h.DB.Exec(r.Context(), `DELETE FROM documents WHERE id=$1`, id)
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
