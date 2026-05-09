package handlers

import (
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"

	"home-management/internal/models"
)

type SearchHandler struct {
	DB *pgxpool.Pool
}

func (h *SearchHandler) Search(w http.ResponseWriter, r *http.Request) {
	q := "%" + r.URL.Query().Get("q") + "%"

	results := []models.SearchResult{}

	rows, err := h.DB.Query(r.Context(), `
		SELECT id, 'maintenance' as category, name as title, COALESCE(notes,'') as subtitle
		FROM maintenance WHERE name ILIKE $1 OR notes ILIKE $1
		UNION ALL
		SELECT id, 'asset', name, category FROM assets WHERE name ILIKE $1 OR category ILIKE $1 OR notes ILIKE $1
		UNION ALL
		SELECT id, 'expense', type, amount::text FROM expenses WHERE type ILIKE $1 OR notes ILIKE $1
		UNION ALL
		SELECT id, 'document', title, category FROM documents WHERE title ILIKE $1 OR category ILIKE $1 OR notes ILIKE $1
		LIMIT 50
	`, q)
	if err != nil {
		jsonError(w, err, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var sr models.SearchResult
		if err := rows.Scan(&sr.ID, &sr.Category, &sr.Title, &sr.Subtitle); err != nil {
			jsonError(w, err, http.StatusInternalServerError)
			return
		}
		results = append(results, sr)
	}
	jsonOK(w, results)
}
