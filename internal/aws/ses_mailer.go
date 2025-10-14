package aws

import (
	"context"
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/ses"
	"github.com/aws/aws-sdk-go-v2/service/ses/types"
	"github.com/pocketbase/pocketbase/tools/mailer"
)

type SESMailer struct {
	client      *ses.Client
	fromAddress string
}

func NewSESMailer(cfg *Config) (*SESMailer, error) {
	if !cfg.SESEnabled {
		return nil, fmt.Errorf("SES is not enabled")
	}
	
	if cfg.SESFromAddress == "" {
		return nil, fmt.Errorf("SES from address is required")
	}
	
	ctx := context.Background()
	
	var awsCfg aws.Config
	var err error
	
	if cfg.SESAccessKey != "" && cfg.SESSecretKey != "" {
		awsCfg, err = config.LoadDefaultConfig(ctx,
			config.WithRegion(cfg.SESRegion),
			config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
				cfg.SESAccessKey,
				cfg.SESSecretKey,
				"",
			)),
		)
	} else {
		awsCfg, err = config.LoadDefaultConfig(ctx,
			config.WithRegion(cfg.SESRegion),
		)
	}
	
	if err != nil {
		return nil, fmt.Errorf("failed to load AWS config: %w", err)
	}
	
	sesClient := ses.NewFromConfig(awsCfg)
	
	return &SESMailer{
		client:      sesClient,
		fromAddress: cfg.SESFromAddress,
	}, nil
}

func (m *SESMailer) Send(message *mailer.Message) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	
	var toAddresses []string
	for _, addr := range message.To {
		toAddresses = append(toAddresses, addr.Address)
	}
	
	var ccAddresses []string
	for _, addr := range message.Cc {
		ccAddresses = append(ccAddresses, addr.Address)
	}
	
	var bccAddresses []string
	for _, addr := range message.Bcc {
		bccAddresses = append(bccAddresses, addr.Address)
	}
	
	fromAddress := m.fromAddress
	if message.From.Address != "" {
		fromAddress = fmt.Sprintf("%s <%s>", message.From.Name, message.From.Address)
	}
	
	input := &ses.SendEmailInput{
		Source: aws.String(fromAddress),
		Destination: &types.Destination{
			ToAddresses:  toAddresses,
			CcAddresses:  ccAddresses,
			BccAddresses: bccAddresses,
		},
		Message: &types.Message{
			Subject: &types.Content{
				Data:    aws.String(message.Subject),
				Charset: aws.String("UTF-8"),
			},
			Body: &types.Body{},
		},
	}
	
	if message.HTML != "" {
		input.Message.Body.Html = &types.Content{
			Data:    aws.String(message.HTML),
			Charset: aws.String("UTF-8"),
		}
	}
	
	if message.Text != "" {
		input.Message.Body.Text = &types.Content{
			Data:    aws.String(message.Text),
			Charset: aws.String("UTF-8"),
		}
	}
	
	_, err := m.client.SendEmail(ctx, input)
	if err != nil {
		return fmt.Errorf("failed to send email via SES: %w", err)
	}
	
	return nil
}

func (m *SESMailer) Reset() {
}
