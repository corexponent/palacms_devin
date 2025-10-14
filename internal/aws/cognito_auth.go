package aws

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider"
	"github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider/types"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

type CognitoAuth struct {
	client       *cognitoidentityprovider.Client
	userPoolId   string
	clientId     string
	clientSecret string
	region       string
}

func NewCognitoAuth(cfg *Config) (*CognitoAuth, error) {
	if !cfg.CognitoEnabled {
		return nil, fmt.Errorf("Cognito is not enabled")
	}
	
	if cfg.CognitoUserPoolId == "" || cfg.CognitoClientId == "" {
		return nil, fmt.Errorf("Cognito user pool ID and client ID are required")
	}
	
	ctx := context.Background()
	
	var awsCfg aws.Config
	var err error
	
	if cfg.CognitoAccessKey != "" && cfg.CognitoSecretKey != "" {
		awsCfg, err = config.LoadDefaultConfig(ctx,
			config.WithRegion(cfg.CognitoRegion),
			config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
				cfg.CognitoAccessKey,
				cfg.CognitoSecretKey,
				"",
			)),
		)
	} else {
		awsCfg, err = config.LoadDefaultConfig(ctx,
			config.WithRegion(cfg.CognitoRegion),
		)
	}
	
	if err != nil {
		return nil, fmt.Errorf("failed to load AWS config: %w", err)
	}
	
	cognitoClient := cognitoidentityprovider.NewFromConfig(awsCfg)
	
	return &CognitoAuth{
		client:       cognitoClient,
		userPoolId:   cfg.CognitoUserPoolId,
		clientId:     cfg.CognitoClientId,
		clientSecret: cfg.CognitoClientSecret,
		region:       cfg.CognitoRegion,
	}, nil
}

func (ca *CognitoAuth) AuthenticateUser(username, password string) (*types.AuthenticationResultType, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	
	authParams := map[string]string{
		"USERNAME": username,
		"PASSWORD": password,
	}
	
	if ca.clientSecret != "" {
		authParams["SECRET_HASH"] = ca.clientSecret
	}
	
	input := &cognitoidentityprovider.InitiateAuthInput{
		AuthFlow:       types.AuthFlowTypeUserPasswordAuth,
		ClientId:       aws.String(ca.clientId),
		AuthParameters: authParams,
	}
	
	result, err := ca.client.InitiateAuth(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("failed to authenticate with Cognito: %w", err)
	}
	
	return result.AuthenticationResult, nil
}

func (ca *CognitoAuth) GetUser(accessToken string) (*cognitoidentityprovider.GetUserOutput, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	
	input := &cognitoidentityprovider.GetUserInput{
		AccessToken: aws.String(accessToken),
	}
	
	result, err := ca.client.GetUser(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("failed to get user from Cognito: %w", err)
	}
	
	return result, nil
}

func (ca *CognitoAuth) VerifyToken(token string) (bool, error) {
	_, err := ca.GetUser(token)
	if err != nil {
		return false, err
	}
	
	return true, nil
}

func SetupCognitoAuth(app *pocketbase.PocketBase, cognito *CognitoAuth) error {
	app.OnRecordAuthRequest("users").BindFunc(func(e *core.RecordAuthRequestEvent) error {
		authResult, err := cognito.AuthenticateUser(e.Identity, e.Password)
		if err != nil {
			log.Printf("Cognito authentication failed, falling back to PocketBase: %v", err)
			return nil
		}
		
		log.Printf("User authenticated via Cognito: %s", e.Identity)
		
		record, err := app.FindFirstRecordByData("users", "email", e.Identity)
		if err != nil {
			collection, err := app.FindCollectionByNameOrId("users")
			if err != nil {
				return fmt.Errorf("failed to find users collection: %w", err)
			}
			
			record = core.NewRecord(collection)
			record.Set("email", e.Identity)
			record.Set("emailVisibility", true)
			record.Set("verified", true)
			
			if err := app.Save(record); err != nil {
				return fmt.Errorf("failed to create user record: %w", err)
			}
			
			log.Printf("Created new user from Cognito: %s", e.Identity)
		}
		
		e.Record = record
		
		if authResult.AccessToken != nil {
			record.Set("cognitoAccessToken", *authResult.AccessToken)
		}
		if authResult.RefreshToken != nil {
			record.Set("cognitoRefreshToken", *authResult.RefreshToken)
		}
		if authResult.IdToken != nil {
			record.Set("cognitoIdToken", *authResult.IdToken)
		}
		
		return nil
	})
	
	log.Println("Cognito authentication hooks installed")
	return nil
}

func (ca *CognitoAuth) ListUsers(limit int32) ([]types.UserType, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	
	input := &cognitoidentityprovider.ListUsersInput{
		UserPoolId: aws.String(ca.userPoolId),
		Limit:      aws.Int32(limit),
	}
	
	result, err := ca.client.ListUsers(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("failed to list users from Cognito: %w", err)
	}
	
	return result.Users, nil
}

func (ca *CognitoAuth) CreateUser(email, password string, attributes map[string]string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	
	userAttrs := []types.AttributeType{
		{
			Name:  aws.String("email"),
			Value: aws.String(email),
		},
		{
			Name:  aws.String("email_verified"),
			Value: aws.String("true"),
		},
	}
	
	for name, value := range attributes {
		userAttrs = append(userAttrs, types.AttributeType{
			Name:  aws.String(name),
			Value: aws.String(value),
		})
	}
	
	input := &cognitoidentityprovider.AdminCreateUserInput{
		UserPoolId:        aws.String(ca.userPoolId),
		Username:          aws.String(email),
		UserAttributes:    userAttrs,
		TemporaryPassword: aws.String(password),
		MessageAction:     types.MessageActionTypeSuppress, // Don't send welcome email
	}
	
	_, err := ca.client.AdminCreateUser(ctx, input)
	if err != nil {
		return fmt.Errorf("failed to create user in Cognito: %w", err)
	}
	
	setPwdInput := &cognitoidentityprovider.AdminSetUserPasswordInput{
		UserPoolId: aws.String(ca.userPoolId),
		Username:   aws.String(email),
		Password:   aws.String(password),
		Permanent:  true,
	}
	
	_, err = ca.client.AdminSetUserPassword(ctx, setPwdInput)
	if err != nil {
		return fmt.Errorf("failed to set user password: %w", err)
	}
	
	return nil
}
