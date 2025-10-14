package main

import (
	"log"

	"github.com/palacms/palacms/internal"
	"github.com/palacms/palacms/internal/aws"
	_ "github.com/palacms/palacms/migrations"
	"github.com/pocketbase/pocketbase"
)

func main() {
	pb := pocketbase.New()

	if err := setup(pb); err != nil {
		log.Fatal(err)
	}

	if err := pb.Start(); err != nil {
		log.Fatal(err)
	}
}

func setup(pb *pocketbase.PocketBase) error {
	awsIntegration, err := aws.Setup(pb)
	if err != nil {
		log.Printf("Warning: AWS integration setup failed: %v", err)
	} else {
		if awsIntegration.IsS3Enabled() {
			log.Println("AWS S3 storage is active")
		}
		if awsIntegration.IsSESEnabled() {
			log.Println("AWS SES mailer is active")
		}
	}

	if err := internal.RegisterValidation(pb); err != nil {
		return err
	}

	if err := internal.RegisterEmailInvitation(pb); err != nil {
		return err
	}

	if err := internal.RegisterPasswordLinkEndpoint(pb); err != nil {
		return err
	}

	if err := internal.RegisterInfoEndpoint(pb); err != nil {
		return err
	}

	if err := internal.RegisterGenerateEndpoint(pb); err != nil {
		return err
	}

	if err := internal.RegisterAdminApp(pb); err != nil {
		return err
	}

	if err := internal.ServeSites(pb); err != nil {
		return err
	}

	if err := internal.RegisterUsageStats(pb); err != nil {
		return err
	}

	return nil
}
