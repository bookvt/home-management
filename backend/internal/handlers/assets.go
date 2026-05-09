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

type AssetHandler struct {
	DB  *pgxpool.Pool
	Cld *cloudinary.Cloudinary
}

func (h *AssetHandler) List(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query(r.Context(), `
		SELECT id, name, category, purchase_date, price, warranty_expiry, notes, image_url, created_at, updated_at
		FROM assets ORDER BY name ASC
	`)
	if err != nil {
		jsonError(w, err, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	items := []models.Asset{}
	for rows.Next() {
		var a models.Asset
		if err := rows.Scan(&a.ID, &a.Name, &a.Category, &a.PurchaseDate, &a.Price,
			&a.WarrantyExpiry, &a.Notes, &a.ImageURL, &a.CreatedAt, &a.UpdatedAt); err != nil {
			jsonError(w, err, http.StatusInternalServerError)
			return
		}
		items = append(items, a)
	}
	jsonOK(w, items)
}

func (h *AssetHandler) Create(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		jsonError(w, err, http.StatusBadRequest)
		return
	}

	name := r.FormValue("name")
	category := r.FormValue("category")
	notes := r.FormValue("notes")

	var purchaseDate *time.Time
	if s := r.FormValue("purchase_date"); s != "" {
		t, err := time.Parse("2006-01-02", s)
		if err != nil {
			jsonError(w, fmt.Errorf("invalid purchase_date"), http.StatusBadRequest)
			return
		}
		purchaseDate = &t
	}

	var price *float64
	if s := r.FormValue("price"); s != "" {
		p, err := strconv.ParseFloat(s, 64)
		if err != nil {
			jsonError(w, fmt.Errorf("invalid price"), http.StatusBadRequest)
			return
		}
		price = &p
	}

	var warrantyExpiry *time.Time
	if s := r.FormValue("warranty_expiry"); s != "" {
		t, err := time.Parse("2006-01-02", s)
		if err != nil {
			jsonError(w, fmt.Errorf("invalid warranty_expiry"), http.StatusBadRequest)
			return
		}
		warrantyExpiry = &t
	}

	imageURL := ""
	file, _, err := r.FormFile("image")
	if err == nil {
		defer file.Close()
		res, err := h.Cld.Upload.Upload(context.Background(), file, uploader.UploadParams{
			Folder: "home-management/assets",
		})
		if err != nil {
			jsonError(w, fmt.Errorf("cloudinary upload: %w", err), http.StatusInternalServerError)
			return
		}
		imageURL = res.SecureURL
	}

	var a models.Asset
	err = h.DB.QueryRow(r.Context(), `
		INSERT INTO assets (name, category, purchase_date, price, warranty_expiry, notes, image_url)
		VALUES ($1,$2,$3,$4,$5,$6,$7)
		RETURNING id, name, category, purchase_date, price, warranty_expiry, notes, image_url, created_at, updated_at
	`, name, category, purchaseDate, price, warrantyExpiry, notes, imageURL).
		Scan(&a.ID, &a.Name, &a.Category, &a.PurchaseDate, &a.Price,
			&a.WarrantyExpiry, &a.Notes, &a.ImageURL, &a.CreatedAt, &a.UpdatedAt)
	if err != nil {
		jsonError(w, err, http.StatusInternalServerError)
		return
	}
	jsonOK(w, a)
}

func (h *AssetHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	var a models.Asset
	err := h.DB.QueryRow(r.Context(), `
		SELECT id, name, category, purchase_date, price, warranty_expiry, notes, image_url, created_at, updated_at
		FROM assets WHERE id=$1
	`, id).Scan(&a.ID, &a.Name, &a.Category, &a.PurchaseDate, &a.Price,
		&a.WarrantyExpiry, &a.Notes, &a.ImageURL, &a.CreatedAt, &a.UpdatedAt)
	if err == pgx.ErrNoRows {
		jsonError(w, err, http.StatusNotFound)
		return
	}
	if err != nil {
		jsonError(w, err, http.StatusInternalServerError)
		return
	}
	jsonOK(w, a)
}

func (h *AssetHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)

	if err := r.ParseMultipartForm(32 << 20); err != nil {
		// try JSON fallback
		var body struct {
			Name           string   `json:"name"`
			Category       string   `json:"category"`
			PurchaseDate   *string  `json:"purchase_date"`
			Price          *float64 `json:"price"`
			WarrantyExpiry *string  `json:"warranty_expiry"`
			Notes          string   `json:"notes"`
		}
		if err2 := json.NewDecoder(r.Body).Decode(&body); err2 != nil {
			jsonError(w, err, http.StatusBadRequest)
			return
		}
		var purchaseDate *time.Time
		if body.PurchaseDate != nil && *body.PurchaseDate != "" {
			t, _ := time.Parse("2006-01-02", *body.PurchaseDate)
			purchaseDate = &t
		}
		var warrantyExpiry *time.Time
		if body.WarrantyExpiry != nil && *body.WarrantyExpiry != "" {
			t, _ := time.Parse("2006-01-02", *body.WarrantyExpiry)
			warrantyExpiry = &t
		}
		var a models.Asset
		err3 := h.DB.QueryRow(r.Context(), `
			UPDATE assets SET name=$1, category=$2, purchase_date=$3, price=$4, warranty_expiry=$5, notes=$6, updated_at=NOW()
			WHERE id=$7
			RETURNING id, name, category, purchase_date, price, warranty_expiry, notes, image_url, created_at, updated_at
		`, body.Name, body.Category, purchaseDate, body.Price, warrantyExpiry, body.Notes, id).
			Scan(&a.ID, &a.Name, &a.Category, &a.PurchaseDate, &a.Price,
				&a.WarrantyExpiry, &a.Notes, &a.ImageURL, &a.CreatedAt, &a.UpdatedAt)
		if err3 == pgx.ErrNoRows {
			jsonError(w, err3, http.StatusNotFound)
			return
		}
		if err3 != nil {
			jsonError(w, err3, http.StatusInternalServerError)
			return
		}
		jsonOK(w, a)
		return
	}

	name := r.FormValue("name")
	category := r.FormValue("category")
	notes := r.FormValue("notes")

	var purchaseDate *time.Time
	if s := r.FormValue("purchase_date"); s != "" {
		t, _ := time.Parse("2006-01-02", s)
		purchaseDate = &t
	}
	var price *float64
	if s := r.FormValue("price"); s != "" {
		p, _ := strconv.ParseFloat(s, 64)
		price = &p
	}
	var warrantyExpiry *time.Time
	if s := r.FormValue("warranty_expiry"); s != "" {
		t, _ := time.Parse("2006-01-02", s)
		warrantyExpiry = &t
	}

	// get existing image_url
	var existingURL string
	h.DB.QueryRow(r.Context(), `SELECT image_url FROM assets WHERE id=$1`, id).Scan(&existingURL)

	imageURL := existingURL
	file, _, err := r.FormFile("image")
	if err == nil {
		defer file.Close()
		res, err := h.Cld.Upload.Upload(context.Background(), file, uploader.UploadParams{
			Folder: "home-management/assets",
		})
		if err != nil {
			jsonError(w, fmt.Errorf("cloudinary upload: %w", err), http.StatusInternalServerError)
			return
		}
		imageURL = res.SecureURL
	}

	var a models.Asset
	err = h.DB.QueryRow(r.Context(), `
		UPDATE assets SET name=$1, category=$2, purchase_date=$3, price=$4, warranty_expiry=$5, notes=$6, image_url=$7, updated_at=NOW()
		WHERE id=$8
		RETURNING id, name, category, purchase_date, price, warranty_expiry, notes, image_url, created_at, updated_at
	`, name, category, purchaseDate, price, warrantyExpiry, notes, imageURL, id).
		Scan(&a.ID, &a.Name, &a.Category, &a.PurchaseDate, &a.Price,
			&a.WarrantyExpiry, &a.Notes, &a.ImageURL, &a.CreatedAt, &a.UpdatedAt)
	if err == pgx.ErrNoRows {
		jsonError(w, err, http.StatusNotFound)
		return
	}
	if err != nil {
		jsonError(w, err, http.StatusInternalServerError)
		return
	}
	jsonOK(w, a)
}

func (h *AssetHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	ct, err := h.DB.Exec(r.Context(), `DELETE FROM assets WHERE id=$1`, id)
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
