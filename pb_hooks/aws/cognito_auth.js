
const { 
  CognitoIdentityProviderClient, 
  InitiateAuthCommand, 
  GetUserCommand,
  ListUsersCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand
} = require('@aws-sdk/client-cognito-identity-provider');

class CognitoAuth {
  constructor(config) {
    if (!config.cognitoEnabled) {
      throw new Error('Cognito is not enabled');
    }
    
    if (!config.cognitoUserPoolId || !config.cognitoClientId) {
      throw new Error('Cognito user pool ID and client ID are required');
    }
    
    const clientConfig = {
      region: config.cognitoRegion,
    };
    
    if (config.cognitoAccessKey && config.cognitoSecretKey) {
      clientConfig.credentials = {
        accessKeyId: config.cognitoAccessKey,
        secretAccessKey: config.cognitoSecretKey,
      };
    }
    
    this.client = new CognitoIdentityProviderClient(clientConfig);
    this.userPoolId = config.cognitoUserPoolId;
    this.clientId = config.cognitoClientId;
    this.clientSecret = config.cognitoClientSecret;
    this.region = config.cognitoRegion;
  }
  
  async authenticateUser(username, password) {
    const authParams = {
      USERNAME: username,
      PASSWORD: password,
    };
    
    if (this.clientSecret) {
      authParams.SECRET_HASH = this.clientSecret;
    }
    
    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: this.clientId,
      AuthParameters: authParams,
    });
    
    const result = await this.client.send(command);
    return result.AuthenticationResult;
  }
  
  async getUser(accessToken) {
    const command = new GetUserCommand({
      AccessToken: accessToken,
    });
    
    const result = await this.client.send(command);
    return result;
  }
  
  async verifyToken(token) {
    try {
      await this.getUser(token);
      return true;
    } catch (err) {
      return false;
    }
  }
  
  async listUsers(limit = 60) {
    const command = new ListUsersCommand({
      UserPoolId: this.userPoolId,
      Limit: limit,
    });
    
    const result = await this.client.send(command);
    return result.Users;
  }
  
  async createUser(email, password, attributes = {}) {
    const userAttributes = [
      {
        Name: 'email',
        Value: email,
      },
      {
        Name: 'email_verified',
        Value: 'true',
      },
    ];
    
    for (const [name, value] of Object.entries(attributes)) {
      userAttributes.push({
        Name: name,
        Value: value,
      });
    }
    
    const createCommand = new AdminCreateUserCommand({
      UserPoolId: this.userPoolId,
      Username: email,
      UserAttributes: userAttributes,
      TemporaryPassword: password,
      MessageAction: 'SUPPRESS',
    });
    
    await this.client.send(createCommand);
    
    const setPasswordCommand = new AdminSetUserPasswordCommand({
      UserPoolId: this.userPoolId,
      Username: email,
      Password: password,
      Permanent: true,
    });
    
    await this.client.send(setPasswordCommand);
  }
}

function setupCognitoAuth(app, cognito) {
  app.onRecordAuthWithPasswordRequest('users').add(async (e) => {
    try {
      const authResult = await cognito.authenticateUser(e.identity, e.password);
      
      console.log(`User authenticated via Cognito: ${e.identity}`);
      
      let record;
      try {
        record = await app.findFirstRecordByData('users', 'email', e.identity);
      } catch (err) {
        const collection = await app.findCollectionByNameOrId('users');
        record = new Record(collection);
        record.set('email', e.identity);
        record.set('emailVisibility', true);
        record.set('verified', true);
        
        await app.save(record);
        
        console.log(`Created new user from Cognito: ${e.identity}`);
      }
      
      e.record = record;
      
      if (authResult.AccessToken) {
        record.set('cognitoAccessToken', authResult.AccessToken);
      }
      if (authResult.RefreshToken) {
        record.set('cognitoRefreshToken', authResult.RefreshToken);
      }
      if (authResult.IdToken) {
        record.set('cognitoIdToken', authResult.IdToken);
      }
      
    } catch (err) {
      console.log(`Cognito authentication failed, falling back to PocketBase: ${err.message}`);
      return e.next();
    }
  });
  
  console.log('Cognito authentication hooks installed');
}

module.exports = {
  CognitoAuth,
  setupCognitoAuth
};
