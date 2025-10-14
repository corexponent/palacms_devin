package aws

import (
	"os"
	"strconv"
)

type Config struct {
	S3Enabled       bool
	S3Bucket        string
	S3Region        string
	S3AccessKey     string
	S3SecretKey     string
	S3Endpoint      string
	S3PublicURL     string
	
	DatabaseType    string
	DatabaseURL     string
	
	SESEnabled      bool
	SESRegion       string
	SESAccessKey    string
	SESSecretKey    string
	SESFromAddress  string
	
	CloudFrontEnabled      bool
	CloudFrontDistribution string
	CloudFrontDomain       string
	
	CognitoEnabled      bool
	CognitoUserPoolId   string
	CognitoClientId     string
	CognitoClientSecret string
	CognitoRegion       string
	CognitoAccessKey    string
	CognitoSecretKey    string
}

func LoadConfig() *Config {
	return &Config{
		S3Enabled:   getEnvBool("AWS_S3_ENABLED", false),
		S3Bucket:    os.Getenv("AWS_S3_BUCKET"),
		S3Region:    getEnvDefault("AWS_S3_REGION", "us-east-1"),
		S3AccessKey: os.Getenv("AWS_ACCESS_KEY_ID"),
		S3SecretKey: os.Getenv("AWS_SECRET_ACCESS_KEY"),
		S3Endpoint:  os.Getenv("AWS_S3_ENDPOINT"),
		S3PublicURL: os.Getenv("AWS_S3_PUBLIC_URL"),
		
		DatabaseType: getEnvDefault("DATABASE_TYPE", "sqlite"),
		DatabaseURL:  os.Getenv("DATABASE_URL"),
		
		SESEnabled:     getEnvBool("AWS_SES_ENABLED", false),
		SESRegion:      getEnvDefault("AWS_SES_REGION", "us-east-1"),
		SESAccessKey:   getEnvDefault("AWS_SES_ACCESS_KEY_ID", os.Getenv("AWS_ACCESS_KEY_ID")),
		SESSecretKey:   getEnvDefault("AWS_SES_SECRET_ACCESS_KEY", os.Getenv("AWS_SECRET_ACCESS_KEY")),
		SESFromAddress: os.Getenv("AWS_SES_FROM_ADDRESS"),
		
		CloudFrontEnabled:      getEnvBool("AWS_CLOUDFRONT_ENABLED", false),
		CloudFrontDistribution: os.Getenv("AWS_CLOUDFRONT_DISTRIBUTION_ID"),
		CloudFrontDomain:       os.Getenv("AWS_CLOUDFRONT_DOMAIN"),
		
		CognitoEnabled:      getEnvBool("AWS_COGNITO_ENABLED", false),
		CognitoUserPoolId:   os.Getenv("AWS_COGNITO_USER_POOL_ID"),
		CognitoClientId:     os.Getenv("AWS_COGNITO_CLIENT_ID"),
		CognitoClientSecret: os.Getenv("AWS_COGNITO_CLIENT_SECRET"),
		CognitoRegion:       getEnvDefault("AWS_COGNITO_REGION", "us-east-1"),
		CognitoAccessKey:    getEnvDefault("AWS_COGNITO_ACCESS_KEY_ID", os.Getenv("AWS_ACCESS_KEY_ID")),
		CognitoSecretKey:    getEnvDefault("AWS_COGNITO_SECRET_ACCESS_KEY", os.Getenv("AWS_SECRET_ACCESS_KEY")),
	}
}

func (c *Config) IsValid() bool {
	if c.S3Enabled {
		if c.S3Bucket == "" || c.S3Region == "" {
			return false
		}
	}
	
	if c.DatabaseType == "postgres" || c.DatabaseType == "mysql" {
		if c.DatabaseURL == "" {
			return false
		}
	}
	
	if c.SESEnabled {
		if c.SESRegion == "" || c.SESFromAddress == "" {
			return false
		}
	}
	
	return true
}

func getEnvDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvBool(key string, defaultValue bool) bool {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	
	boolValue, err := strconv.ParseBool(value)
	if err != nil {
		return defaultValue
	}
	return boolValue
}
