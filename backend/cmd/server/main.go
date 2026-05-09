package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/joho/godotenv"
	"github.com/rs/cors"

	"home-management/internal/db"
	"home-management/internal/handlers"
	"home-management/migrations"
)

func main() {
	_ = godotenv.Load()

	dsn := mustEnv("DATABASE_URL")

	pool, err := db.Connect(context.Background(), dsn)
	if err != nil {
		log.Fatalf("db connect: %v", err)
	}
	defer pool.Close()

	if err := db.Migrate(migrations.FS, dsn); err != nil {
		log.Fatalf("migrate: %v", err)
	}

	cld, err := cloudinary.NewFromParams(
		mustEnv("CLOUDINARY_CLOUD_NAME"),
		mustEnv("CLOUDINARY_API_KEY"),
		mustEnv("CLOUDINARY_API_SECRET"),
	)
	if err != nil {
		log.Fatalf("cloudinary: %v", err)
	}

	mh := &handlers.MaintenanceHandler{DB: pool}
	ah := &handlers.AssetHandler{DB: pool, Cld: cld}
	eh := &handlers.ExpenseHandler{DB: pool}
	dh := &handlers.DocumentHandler{DB: pool, Cld: cld}
	sh := &handlers.SearchHandler{DB: pool}
	dash := &handlers.DashboardHandler{DB: pool}

	r := chi.NewRouter()
	r.Use(chiMiddleware.Logger)
	r.Use(chiMiddleware.Recoverer)

	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: false,
	})
	r.Use(c.Handler)

	r.Route("/api", func(r chi.Router) {
		r.Get("/dashboard", dash.Get)
		r.Get("/search", sh.Search)

		r.Route("/maintenance", func(r chi.Router) {
			r.Get("/", mh.List)
			r.Post("/", mh.Create)
			r.Get("/{id}", mh.Get)
			r.Put("/{id}", mh.Update)
			r.Delete("/{id}", mh.Delete)
		})

		r.Route("/assets", func(r chi.Router) {
			r.Get("/", ah.List)
			r.Post("/", ah.Create)
			r.Get("/{id}", ah.Get)
			r.Put("/{id}", ah.Update)
			r.Delete("/{id}", ah.Delete)
		})

		r.Route("/expenses", func(r chi.Router) {
			r.Get("/", eh.List)
			r.Get("/trends", eh.Trends)
			r.Post("/", eh.Create)
			r.Get("/{id}", eh.Get)
			r.Put("/{id}", eh.Update)
			r.Delete("/{id}", eh.Delete)
		})

		r.Route("/documents", func(r chi.Router) {
			r.Get("/", dh.List)
			r.Post("/", dh.Create)
			r.Get("/{id}", dh.Get)
			r.Put("/{id}", dh.Update)
			r.Delete("/{id}", dh.Delete)
		})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	fmt.Printf("Server listening on :%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}

func mustEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		log.Fatalf("missing required env var: %s", key)
	}
	return v
}
