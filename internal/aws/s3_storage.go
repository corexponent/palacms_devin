package aws

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"path/filepath"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/pocketbase/pocketbase/tools/filesystem"
)

type S3FileSystem struct {
	client      *s3.Client
	bucket      string
	publicURL   string
	region      string
}

func NewS3FileSystem(cfg *Config) (*S3FileSystem, error) {
	if !cfg.S3Enabled {
		return nil, fmt.Errorf("S3 is not enabled")
	}
	
	ctx := context.Background()
	
	var awsCfg aws.Config
	var err error
	
	if cfg.S3AccessKey != "" && cfg.S3SecretKey != "" {
		awsCfg, err = config.LoadDefaultConfig(ctx,
			config.WithRegion(cfg.S3Region),
			config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
				cfg.S3AccessKey,
				cfg.S3SecretKey,
				"",
			)),
		)
	} else {
		awsCfg, err = config.LoadDefaultConfig(ctx,
			config.WithRegion(cfg.S3Region),
		)
	}
	
	if err != nil {
		return nil, fmt.Errorf("failed to load AWS config: %w", err)
	}
	
	s3Client := s3.NewFromConfig(awsCfg, func(o *s3.Options) {
		if cfg.S3Endpoint != "" {
			o.BaseEndpoint = aws.String(cfg.S3Endpoint)
			o.UsePathStyle = true
		}
	})
	
	publicURL := cfg.S3PublicURL
	if publicURL == "" {
		publicURL = fmt.Sprintf("https://%s.s3.%s.amazonaws.com", cfg.S3Bucket, cfg.S3Region)
	}
	
	return &S3FileSystem{
		client:    s3Client,
		bucket:    cfg.S3Bucket,
		publicURL: publicURL,
		region:    cfg.S3Region,
	}, nil
}

func (fs *S3FileSystem) Upload(data []byte, key string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	
	contentType := getContentType(key)
	
	_, err := fs.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(fs.bucket),
		Key:         aws.String(key),
		Body:        bytes.NewReader(data),
		ContentType: aws.String(contentType),
	})
	
	return err
}

func (fs *S3FileSystem) UploadReader(reader io.Reader, key string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()
	
	data, err := io.ReadAll(reader)
	if err != nil {
		return fmt.Errorf("failed to read data: %w", err)
	}
	
	contentType := getContentType(key)
	
	_, err = fs.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(fs.bucket),
		Key:         aws.String(key),
		Body:        bytes.NewReader(data),
		ContentType: aws.String(contentType),
	})
	
	return err
}

func (fs *S3FileSystem) Delete(key string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	
	_, err := fs.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(fs.bucket),
		Key:    aws.String(key),
	})
	
	return err
}

func (fs *S3FileSystem) GetURL(key string) string {
	return fmt.Sprintf("%s/%s", strings.TrimRight(fs.publicURL, "/"), key)
}

func (fs *S3FileSystem) Exists(key string) (bool, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	
	_, err := fs.client.HeadObject(ctx, &s3.HeadObjectInput{
		Bucket: aws.String(fs.bucket),
		Key:    aws.String(key),
	})
	
	if err != nil {
		if strings.Contains(err.Error(), "NotFound") {
			return false, nil
		}
		return false, err
	}
	
	return true, nil
}

func (fs *S3FileSystem) Copy(sourceKey, destKey string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	
	copySource := fmt.Sprintf("%s/%s", fs.bucket, sourceKey)
	
	_, err := fs.client.CopyObject(ctx, &s3.CopyObjectInput{
		Bucket:     aws.String(fs.bucket),
		CopySource: aws.String(copySource),
		Key:        aws.String(destKey),
	})
	
	return err
}

func getContentType(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))
	
	contentTypes := map[string]string{
		".jpg":  "image/jpeg",
		".jpeg": "image/jpeg",
		".png":  "image/png",
		".gif":  "image/gif",
		".svg":  "image/svg+xml",
		".webp": "image/webp",
		".pdf":  "application/pdf",
		".zip":  "application/zip",
		".json": "application/json",
		".js":   "application/javascript",
		".css":  "text/css",
		".html": "text/html",
		".txt":  "text/plain",
		".xml":  "application/xml",
		".mp4":  "video/mp4",
		".mp3":  "audio/mpeg",
		".wav":  "audio/wav",
	}
	
	if ct, ok := contentTypes[ext]; ok {
		return ct
	}
	
	return "application/octet-stream"
}

var _ filesystem.System = (*S3FileSystem)(nil)
