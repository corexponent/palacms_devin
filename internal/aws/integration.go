package aws

import (
	"fmt"
	"io"
	"log"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

type Integration struct {
	Config      *Config
	S3Storage   *S3FileSystem
	SESMailer   *SESMailer
	CognitoAuth *CognitoAuth
}

func Setup(app *pocketbase.PocketBase) (*Integration, error) {
	cfg := LoadConfig()
	
	if !cfg.IsValid() && (cfg.S3Enabled || cfg.SESEnabled) {
		return nil, fmt.Errorf("AWS configuration is invalid")
	}
	
	integration := &Integration{
		Config: cfg,
	}
	
	if err := SetupDatabase(app, cfg); err != nil {
		log.Printf("Warning: Database setup failed: %v", err)
		log.Printf("Falling back to SQLite")
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
			
			app.OnMailerSend().BindFunc(func(e *core.MailerEvent) error {
				return sesMailer.Send(e.Message)
			})
		}
	}
	
	if cfg.CognitoEnabled {
		cognito, err := NewCognitoAuth(cfg)
		if err != nil {
			log.Printf("Warning: Failed to initialize Cognito: %v", err)
			log.Printf("Falling back to PocketBase authentication")
		} else {
			integration.CognitoAuth = cognito
			log.Printf("AWS Cognito enabled: user_pool=%s, region=%s", cfg.CognitoUserPoolId, cfg.CognitoRegion)
			
			if err := SetupCognitoAuth(app, cognito); err != nil {
				log.Printf("Warning: Failed to setup Cognito hooks: %v", err)
			}
		}
	}
	
	return integration, nil
}

func setupS3FileHooks(app *pocketbase.PocketBase, s3fs *S3FileSystem) {
	app.OnModelAfterCreateSuccess().BindFunc(func(e *core.ModelEvent) error {
		record, ok := e.Model.(*core.Record)
		if !ok {
			return nil
		}
		
		for _, field := range record.Collection().Fields {
			if field.Type() != "file" {
				continue
			}
			
			files := record.GetStringSlice(field.GetName())
			for _, filename := range files {
				if filename == "" {
					continue
				}
				
				localPath := record.BaseFilesPath() + "/" + filename
				
				fs, err := app.NewFilesystem()
				if err != nil {
					log.Printf("Failed to create filesystem: %v", err)
					continue
				}
				defer fs.Close()
				
				reader, err := fs.GetReader(localPath)
				if err != nil {
					log.Printf("Failed to read file %s: %v", localPath, err)
					continue
				}
				
				s3Key := fmt.Sprintf("%s/%s/%s", record.Collection().Name, record.Id, filename)
				
				if err := s3fs.UploadFile(reader, s3Key); err != nil {
					log.Printf("Failed to upload %s to S3: %v", filename, err)
					reader.Close()
					continue
				}
				reader.Close()
				
				log.Printf("Successfully uploaded %s to S3 as %s", filename, s3Key)
			}
		}
		
		return nil
	})
	
	app.OnModelAfterDeleteSuccess().BindFunc(func(e *core.ModelEvent) error {
		record, ok := e.Model.(*core.Record)
		if !ok {
			return nil
		}
		
		for _, field := range record.Collection().Fields {
			if field.Type() != "file" {
				continue
			}
			
			files := record.GetStringSlice(field.GetName())
			for _, filename := range files {
				if filename == "" {
					continue
				}
				
				s3Key := fmt.Sprintf("%s/%s/%s", record.Collection().Name, record.Id, filename)
				
				if err := s3fs.DeleteFile(s3Key); err != nil {
					log.Printf("Failed to delete %s from S3: %v", s3Key, err)
					continue
				}
				
				log.Printf("Successfully deleted %s from S3", s3Key)
			}
		}
		
		return nil
	})
	
	app.OnFileDownloadRequest().BindFunc(func(e *core.FileDownloadRequestEvent) error {
		s3Key := fmt.Sprintf("%s/%s/%s", e.Record.Collection().Name, e.Record.Id, e.ServedName)
		
		exists, err := s3fs.FileExists(s3Key)
		if err != nil || !exists {
			return e.Next()
		}
		
		if err := s3fs.ServeFile(e.Response, e.Request, s3Key); err != nil {
			log.Printf("Failed to serve file from S3: %v", err)
			return e.Next()
		}
		
		return nil
	})
	
	log.Println("S3 file hooks installed - files will be uploaded/downloaded from S3")
}

func (i *Integration) GetPublicURL(localPath string) string {
	if i.S3Storage != nil {
		return i.S3Storage.GetFileURL(localPath)
	}
	return localPath
}

func (i *Integration) UploadToS3(reader io.Reader, key string) error {
	if i.S3Storage == nil {
		return fmt.Errorf("S3 storage is not enabled")
	}
	return i.S3Storage.UploadFile(reader, key)
}

func (i *Integration) DeleteFromS3(key string) error {
	if i.S3Storage == nil {
		return fmt.Errorf("S3 storage is not enabled")
	}
	return i.S3Storage.DeleteFile(key)
}

func (i *Integration) IsS3Enabled() bool {
	return i.S3Storage != nil
}

func (i *Integration) IsSESEnabled() bool {
	return i.SESMailer != nil
}

func (i *Integration) IsCognitoEnabled() bool {
	return i.CognitoAuth != nil
}
