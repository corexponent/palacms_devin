
const { loadConfig } = require('./config');
const { S3FileSystem } = require('./s3_filesystem');
const { SESMailer } = require('./ses_mailer');
const { CognitoAuth, setupCognitoAuth } = require('./cognito_auth');
const { setupDatabase } = require('./database');

class AWSIntegration {
  constructor() {
    this.config = null;
    this.s3Storage = null;
    this.sesMailer = null;
    this.cognitoAuth = null;
  }
  
  async setup(app) {
    this.config = loadConfig();
    
    if (!this.config.isValid() && (this.config.s3Enabled || this.config.sesEnabled)) {
      console.warn('AWS configuration is invalid');
      return this;
    }
    
    try {
      setupDatabase(app, this.config);
    } catch (err) {
      console.warn(`Warning: Database setup failed: ${err.message}`);
      console.warn('Falling back to SQLite');
    }
    
    if (this.config.s3Enabled) {
      try {
        this.s3Storage = new S3FileSystem(this.config);
        console.log(`AWS S3 storage enabled: bucket=${this.config.s3Bucket}, region=${this.config.s3Region}`);
        
        this.setupS3FileHooks(app);
      } catch (err) {
        console.warn(`Warning: Failed to initialize S3 storage: ${err.message}`);
        console.warn('Falling back to local storage');
      }
    }
    
    if (this.config.sesEnabled) {
      try {
        this.sesMailer = new SESMailer(this.config);
        console.log(`AWS SES mailer enabled: region=${this.config.sesRegion}, from=${this.config.sesFromAddress}`);
        
        app.onMailerSend().add((e) => {
          return this.sesMailer.send(e.message);
        });
      } catch (err) {
        console.warn(`Warning: Failed to initialize SES mailer: ${err.message}`);
        console.warn('Falling back to default mailer');
      }
    }
    
    if (this.config.cognitoEnabled) {
      try {
        this.cognitoAuth = new CognitoAuth(this.config);
        console.log(`AWS Cognito enabled: user_pool=${this.config.cognitoUserPoolId}, region=${this.config.cognitoRegion}`);
        
        setupCognitoAuth(app, this.cognitoAuth);
      } catch (err) {
        console.warn(`Warning: Failed to initialize Cognito: ${err.message}`);
        console.warn('Falling back to PocketBase authentication');
      }
    }
    
    return this;
  }
  
  setupS3FileHooks(app) {
    const s3fs = this.s3Storage;
    
    app.onModelAfterCreateSuccess().add(async (e) => {
      const record = e.model;
      if (!record || !record.collection) {
        return;
      }
      
      for (const field of record.collection().fields) {
        if (field.type !== 'file') {
          continue;
        }
        
        const files = record.getStringSlice(field.name) || [];
        for (const filename of files) {
          if (!filename) {
            continue;
          }
          
          try {
            const localPath = `${record.baseFilesPath()}/${filename}`;
            
            const fs = app.newFilesystem();
            const fileBuffer = await fs.getReader(localPath);
            
            const s3Key = `${record.collection().name}/${record.id}/${filename}`;
            
            await s3fs.uploadFile(fileBuffer, s3Key);
            
            console.log(`Successfully uploaded ${filename} to S3 as ${s3Key}`);
          } catch (err) {
            console.error(`Failed to upload ${filename} to S3: ${err.message}`);
          }
        }
      }
    });
    
    app.onModelAfterDeleteSuccess().add(async (e) => {
      const record = e.model;
      if (!record || !record.collection) {
        return;
      }
      
      for (const field of record.collection().fields) {
        if (field.type !== 'file') {
          continue;
        }
        
        const files = record.getStringSlice(field.name) || [];
        for (const filename of files) {
          if (!filename) {
            continue;
          }
          
          try {
            const s3Key = `${record.collection().name}/${record.id}/${filename}`;
            
            await s3fs.deleteFile(s3Key);
            
            console.log(`Successfully deleted ${s3Key} from S3`);
          } catch (err) {
            console.error(`Failed to delete ${s3Key} from S3: ${err.message}`);
          }
        }
      }
    });
    
    app.onFileDownloadRequest().add(async (e) => {
      const s3Key = `${e.record.collection().name}/${e.record.id}/${e.servedName}`;
      
      try {
        const exists = await s3fs.fileExists(s3Key);
        if (!exists) {
          return e.next();
        }
        
        const fileBuffer = await s3fs.getFile(s3Key);
        
        e.response.header().set('Content-Type', require('./s3_filesystem').getContentType(s3Key));
        e.response.write(fileBuffer);
        
        return null;
      } catch (err) {
        console.error(`Failed to serve file from S3: ${err.message}`);
        return e.next();
      }
    });
    
    console.log('S3 file hooks installed - files will be uploaded/downloaded from S3');
  }
  
  getPublicURL(localPath) {
    if (this.s3Storage) {
      return this.s3Storage.getFileURL(localPath);
    }
    return localPath;
  }
  
  async uploadToS3(buffer, key) {
    if (!this.s3Storage) {
      throw new Error('S3 storage is not enabled');
    }
    return this.s3Storage.uploadFile(buffer, key);
  }
  
  async deleteFromS3(key) {
    if (!this.s3Storage) {
      throw new Error('S3 storage is not enabled');
    }
    return this.s3Storage.deleteFile(key);
  }
  
  isS3Enabled() {
    return this.s3Storage !== null;
  }
  
  isSESEnabled() {
    return this.sesMailer !== null;
  }
  
  isCognitoEnabled() {
    return this.cognitoAuth !== null;
  }
}

module.exports = {
  AWSIntegration
};
