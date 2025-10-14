package aws

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/go-sql-driver/mysql"
	_ "github.com/lib/pq"
	"github.com/pocketbase/pocketbase"
)

func SetupDatabase(app *pocketbase.PocketBase, cfg *Config) error {
	if cfg.DatabaseType == "sqlite" || cfg.DatabaseType == "" {
		log.Println("Using SQLite database (default)")
		return nil
	}
	
	if cfg.DatabaseURL == "" {
		return fmt.Errorf("DATABASE_URL is required for %s database", cfg.DatabaseType)
	}
	
	var driverName string
	switch cfg.DatabaseType {
	case "postgres", "postgresql":
		driverName = "postgres"
		log.Printf("Configuring PostgreSQL database")
	case "mysql":
		driverName = "mysql"
		log.Printf("Configuring MySQL database")
	default:
		return fmt.Errorf("unsupported database type: %s (supported: sqlite, postgres, mysql)", cfg.DatabaseType)
	}
	
	db, err := sql.Open(driverName, cfg.DatabaseURL)
	if err != nil {
		return fmt.Errorf("failed to open database connection: %w", err)
	}
	defer db.Close()
	
	if err := db.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %w", err)
	}
	
	log.Printf("Successfully connected to %s database", cfg.DatabaseType)
	log.Printf("PocketBase will use DATABASE_URL environment variable for database connection")
	
	return nil
}
