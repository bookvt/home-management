package db

import (
	"context"
	"embed"
	"fmt"
	"strings"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/pgx/v5"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/jackc/pgx/v5/pgxpool"
)

func Connect(ctx context.Context, dsn string) (*pgxpool.Pool, error) {
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		return nil, fmt.Errorf("pgxpool.New: %w", err)
	}
	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("db ping: %w", err)
	}
	return pool, nil
}

// Migrate runs embedded SQL migrations. migrationsFS must embed *.sql at its root (use "." as dir).
func Migrate(migrationsFS embed.FS, dsn string) error {
	src, err := iofs.New(migrationsFS, ".")
	if err != nil {
		return fmt.Errorf("iofs.New: %w", err)
	}
	// golang-migrate pgx/v5 driver expects "pgx5://" scheme
	dbURL := dsn
	if strings.HasPrefix(dbURL, "postgresql://") {
		dbURL = "pgx5://" + dbURL[len("postgresql://"):]
	} else if strings.HasPrefix(dbURL, "postgres://") {
		dbURL = "pgx5://" + dbURL[len("postgres://"):]
	}
	m, err := migrate.NewWithSourceInstance("iofs", src, dbURL)
	if err != nil {
		return fmt.Errorf("migrate.New: %w", err)
	}
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("migrate.Up: %w", err)
	}
	return nil
}
