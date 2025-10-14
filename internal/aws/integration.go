package aws

import (
	"fmt"
	"log"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

type Integration struct {
	Config     *Config
	S3Storage  *S3FileSystem
	SESMailer  *SESMailer
}

func Setup(app *pocketbase.PocketBase) (*Integration, error) {
	cfg := LoadConfig()
	
	if !cfg.IsValid() && (cfg.S3Enabled || cfg.SESEnabled) {
		return nil, fmt.Errorf("AWS configuration is invalid")
	}
	
	integration := &Integration{
		Config: cfg,
	}
	
	if cfg.S3Enabled {
		s3fs, err := NewS3FileSystem(cfg)
		if err != nil {
			log.Printf("Warning: Failed to initialize S3 storage: %v", err)
			log.Printf("Falling back to local storage")
		} else {
			integration.S3Storage = s3fs
			log.Printf("AWS S3 storage enabled: bucket=%s, region=%s", cfg.S3Bucket, cfg.S3Region)
			
			setupS3FileHooks(app, s3fs)
		}
	}
	
	if cfg.SESEnabled {
		sesMailer, err := NewSESMailer(cfg)
		if err != nil {
			log.Printf("Warning: Failed to initialize SES mailer: %v", err)
			log.Printf("Falling back to default mailer")
		} else {
			integration.SESMailer = sesMailer
			log.Printf("AWS SES mailer enabled: region=%s, from=%s", cfg.SESRegion, cfg.SESFromAddress)
			
			app.OnMailerSend().BindFunc(func(e *core.MailerSendEvent) error {
				return sesMailer.Send(e.Message)
			})
		}
	}
	
	if cfg.DatabaseType != "sqlite" {
		log.Printf("Database type: %s", cfg.DatabaseType)
	}
	
	return integration, nil
}

func setupS3FileHooks(app *pocketbase.PocketBase, s3fs *S3FileSystem) {
	app.OnFileAfterTokenRequest().BindFunc(func(e *core.FileTokenEvent) error {
		return nil
	})
	
}

func (i *Integration) GetPublicURL(localPath string) string {
	if i.S3Storage != nil {
		return i.S3Storage.GetURL(localPath)
	}
	return localPath
}

func (i *Integration) IsS3Enabled() bool {
	return i.S3Storage != nil
}

func (i *Integration) IsSESEnabled() bool {
	return i.SESMailer != nil
}
