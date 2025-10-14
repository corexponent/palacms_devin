# AWS Integration for PalaCMS (JavaScript/TypeScript)

This directory contains JavaScript/TypeScript implementations of AWS integrations for PalaCMS, providing an alternative to the Go implementation in `internal/aws/`.

## Features

- **S3 Storage**: Upload, download, and manage files in Amazon S3
- **SES Email**: Send emails via Amazon Simple Email Service
- **Cognito Authentication**: Integrate AWS Cognito for user authentication
- **RDS Database**: Configuration for PostgreSQL and MySQL databases

## Installation

The JavaScript AWS integrations run as PocketBase hooks. To use them:

1. **Install dependencies**:
   ```bash
   cd pb_hooks
   npm install
   ```

2. **Configure environment variables** (same as Go version):
   ```bash
   # S3 Configuration
   AWS_S3_ENABLED=true
   AWS_S3_BUCKET=your-bucket-name
   AWS_S3_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   AWS_S3_ENDPOINT=  # Optional: for S3-compatible services
   AWS_S3_PUBLIC_URL=  # Optional: custom public URL
   
   # SES Configuration
   AWS_SES_ENABLED=true
   AWS_SES_REGION=us-east-1
   AWS_SES_FROM_ADDRESS=noreply@example.com
   AWS_SES_ACCESS_KEY_ID=  # Optional: defaults to AWS_ACCESS_KEY_ID
   AWS_SES_SECRET_ACCESS_KEY=  # Optional: defaults to AWS_SECRET_ACCESS_KEY
   
   # Cognito Configuration
   AWS_COGNITO_ENABLED=true
   AWS_COGNITO_USER_POOL_ID=your-pool-id
   AWS_COGNITO_CLIENT_ID=your-client-id
   AWS_COGNITO_CLIENT_SECRET=your-client-secret
   AWS_COGNITO_REGION=us-east-1
   
   # Database Configuration
   DATABASE_TYPE=postgres  # or mysql, or sqlite (default)
   DATABASE_URL=postgresql://user:pass@host:5432/dbname
   ```

3. **Enable the integration** by creating a hook file or uncommenting the example:
   ```bash
   cp aws_example.js main.js
   # Edit main.js to uncomment the AWS integration code
   ```

## Usage

### Basic Setup

Create a hook file (e.g., `pb_hooks/main.js`):

```javascript
const { AWSIntegration } = require('./aws/integration');

const awsIntegration = new AWSIntegration();

onServe((e) => {
  awsIntegration.setup($app).then((integration) => {
    console.log('AWS integration ready');
  });
});
```

### S3 File Storage

The S3 integration automatically handles file uploads and downloads:

```javascript
// Files uploaded to PocketBase will be automatically synced to S3
// No additional code needed - it's handled by the integration hooks

// Manual upload example:
const buffer = Buffer.from('Hello, S3!');
await awsIntegration.uploadToS3(buffer, 'path/to/file.txt');

// Get public URL:
const url = awsIntegration.getPublicURL('path/to/file.txt');
```

### SES Email

Send emails using Amazon SES:

```javascript
// SES automatically replaces the default mailer
// Use PocketBase's standard email methods and they'll use SES

// Or send directly:
const message = {
  to: [{ address: 'user@example.com', name: 'User Name' }],
  subject: 'Hello from PalaCMS',
  html: '<p>This email was sent via AWS SES</p>',
  text: 'This email was sent via AWS SES'
};

await awsIntegration.sesMailer.send(message);
```

### Cognito Authentication

Cognito auth is automatically integrated:

```javascript
// Users can authenticate via Cognito automatically
// The integration creates PocketBase user records for Cognito users

// Manual operations:
await awsIntegration.cognitoAuth.createUser(
  'user@example.com',
  'SecurePassword123!',
  { name: 'John Doe' }
);

const users = await awsIntegration.cognitoAuth.listUsers(50);
```

## Module Structure

```
pb_hooks/aws/
├── config.js              # Configuration loader
├── s3_filesystem.js       # S3 storage implementation
├── ses_mailer.js          # SES email implementation
├── cognito_auth.js        # Cognito authentication
├── database.js            # Database configuration
├── integration.js         # Main integration orchestrator
└── README.md              # This file

pb_hooks/
├── package.json           # NPM dependencies
└── aws_example.js         # Example usage
```

## API Reference

### AWSIntegration

Main class for managing all AWS integrations.

```javascript
const integration = new AWSIntegration();
await integration.setup(app);

// Check what's enabled
integration.isS3Enabled()      // boolean
integration.isSESEnabled()     // boolean
integration.isCognitoEnabled() // boolean

// S3 operations
await integration.uploadToS3(buffer, key)
await integration.deleteFromS3(key)
integration.getPublicURL(key)
```

### S3FileSystem

Direct S3 operations.

```javascript
const s3 = new S3FileSystem(config);

await s3.uploadFile(buffer, 'path/file.txt')
await s3.uploadBytes(data, 'path/file.txt')
await s3.deleteFile('path/file.txt')
await s3.copyFile('source.txt', 'dest.txt')
const buffer = await s3.getFile('path/file.txt')
const exists = await s3.fileExists('path/file.txt')
const url = s3.getFileURL('path/file.txt')
```

### SESMailer

Email operations via SES.

```javascript
const ses = new SESMailer(config);

await ses.send({
  to: [{ address: 'user@example.com', name: 'User' }],
  cc: [],
  bcc: [],
  from: { address: 'sender@example.com', name: 'Sender' },
  subject: 'Email Subject',
  html: '<p>HTML content</p>',
  text: 'Plain text content'
});
```

### CognitoAuth

Authentication via AWS Cognito.

```javascript
const cognito = new CognitoAuth(config);

const authResult = await cognito.authenticateUser('user@example.com', 'password');
const user = await cognito.getUser(accessToken);
const isValid = await cognito.verifyToken(token);
const users = await cognito.listUsers(60);
await cognito.createUser('user@example.com', 'password', { name: 'User' });
```

## Comparison with Go Implementation

| Feature | Go (`internal/aws/`) | JavaScript (`pb_hooks/aws/`) |
|---------|---------------------|------------------------------|
| S3 Storage | ✅ | ✅ |
| SES Email | ✅ | ✅ |
| Cognito Auth | ✅ | ✅ |
| Database Config | ✅ | ✅ |
| Performance | Faster (compiled) | Slightly slower (interpreted) |
| Dependencies | Built into binary | Requires node_modules |
| Maintenance | Go code | JavaScript code |
| Extensibility | Requires Go rebuild | Edit and reload |

## Migration from Go to JavaScript

Both implementations can coexist. To migrate:

1. Keep the Go version running
2. Install and configure the JavaScript version
3. Test the JavaScript version with a subset of features
4. Gradually disable Go features as you validate JavaScript equivalents
5. Remove Go AWS code when fully migrated (optional)

## Troubleshooting

**"Module not found" errors**:
```bash
cd pb_hooks
npm install
```

**S3 uploads failing**:
- Check AWS credentials are correct
- Verify bucket name and region
- Ensure IAM permissions for `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`

**SES emails not sending**:
- Verify SES is out of sandbox mode or recipients are verified
- Check IAM permissions for `ses:SendEmail`
- Confirm from address is verified in SES

**Cognito auth not working**:
- Verify user pool ID and client ID
- Check client is configured for `USER_PASSWORD_AUTH` flow
- Ensure IAM permissions for Cognito operations

## Development

To modify the JavaScript AWS integration:

1. Edit files in `pb_hooks/aws/`
2. Restart PocketBase to reload hooks
3. Check logs for errors: `tail -f pb_data/logs/*.log`

## License

Same as PalaCMS (check repository root for license)
