
function getEnvDefault(key, defaultValue) {
  const value = process.env[key] || $os.getenv(key);
  return value !== '' ? value : defaultValue;
}

function getEnvBool(key, defaultValue) {
  const value = process.env[key] || $os.getenv(key);
  if (value === '') {
    return defaultValue;
  }
  
  const lowerValue = value.toLowerCase();
  return lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes';
}

class AWSConfig {
  constructor() {
    this.s3Enabled = getEnvBool('AWS_S3_ENABLED', false);
    this.s3Bucket = getEnvDefault('AWS_S3_BUCKET', '');
    this.s3Region = getEnvDefault('AWS_S3_REGION', 'us-east-1');
    this.s3AccessKey = getEnvDefault('AWS_ACCESS_KEY_ID', '');
    this.s3SecretKey = getEnvDefault('AWS_SECRET_ACCESS_KEY', '');
    this.s3Endpoint = getEnvDefault('AWS_S3_ENDPOINT', '');
    this.s3PublicURL = getEnvDefault('AWS_S3_PUBLIC_URL', '');
    
    this.databaseType = getEnvDefault('DATABASE_TYPE', 'sqlite');
    this.databaseURL = getEnvDefault('DATABASE_URL', '');
    
    this.sesEnabled = getEnvBool('AWS_SES_ENABLED', false);
    this.sesRegion = getEnvDefault('AWS_SES_REGION', 'us-east-1');
    this.sesAccessKey = getEnvDefault('AWS_SES_ACCESS_KEY_ID', getEnvDefault('AWS_ACCESS_KEY_ID', ''));
    this.sesSecretKey = getEnvDefault('AWS_SES_SECRET_ACCESS_KEY', getEnvDefault('AWS_SECRET_ACCESS_KEY', ''));
    this.sesFromAddress = getEnvDefault('AWS_SES_FROM_ADDRESS', '');
    
    this.cloudFrontEnabled = getEnvBool('AWS_CLOUDFRONT_ENABLED', false);
    this.cloudFrontDistribution = getEnvDefault('AWS_CLOUDFRONT_DISTRIBUTION_ID', '');
    this.cloudFrontDomain = getEnvDefault('AWS_CLOUDFRONT_DOMAIN', '');
    
    this.cognitoEnabled = getEnvBool('AWS_COGNITO_ENABLED', false);
    this.cognitoUserPoolId = getEnvDefault('AWS_COGNITO_USER_POOL_ID', '');
    this.cognitoClientId = getEnvDefault('AWS_COGNITO_CLIENT_ID', '');
    this.cognitoClientSecret = getEnvDefault('AWS_COGNITO_CLIENT_SECRET', '');
    this.cognitoRegion = getEnvDefault('AWS_COGNITO_REGION', 'us-east-1');
    this.cognitoAccessKey = getEnvDefault('AWS_COGNITO_ACCESS_KEY_ID', getEnvDefault('AWS_ACCESS_KEY_ID', ''));
    this.cognitoSecretKey = getEnvDefault('AWS_COGNITO_SECRET_ACCESS_KEY', getEnvDefault('AWS_SECRET_ACCESS_KEY', ''));
  }
  
  isValid() {
    if (this.s3Enabled) {
      if (!this.s3Bucket || !this.s3Region) {
        return false;
      }
    }
    
    if (this.databaseType === 'postgres' || this.databaseType === 'mysql') {
      if (!this.databaseURL) {
        return false;
      }
    }
    
    if (this.sesEnabled) {
      if (!this.sesRegion || !this.sesFromAddress) {
        return false;
      }
    }
    
    return true;
  }
}

function loadConfig() {
  return new AWSConfig();
}

module.exports = {
  loadConfig,
  AWSConfig,
  getEnvDefault,
  getEnvBool
};
