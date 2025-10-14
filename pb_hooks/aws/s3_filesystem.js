
const { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, CopyObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');

class S3FileSystem {
  constructor(config) {
    if (!config.s3Enabled) {
      throw new Error('S3 is not enabled');
    }
    
    const clientConfig = {
      region: config.s3Region,
    };
    
    if (config.s3AccessKey && config.s3SecretKey) {
      clientConfig.credentials = {
        accessKeyId: config.s3AccessKey,
        secretAccessKey: config.s3SecretKey,
      };
    }
    
    if (config.s3Endpoint) {
      clientConfig.endpoint = config.s3Endpoint;
      clientConfig.forcePathStyle = true;
    }
    
    this.client = new S3Client(clientConfig);
    this.bucket = config.s3Bucket;
    this.region = config.s3Region;
    
    this.publicURL = config.s3PublicURL || `https://${config.s3Bucket}.s3.${config.s3Region}.amazonaws.com`;
  }
  
  async uploadFile(buffer, key) {
    const contentType = getContentType(key);
    
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });
    
    await this.client.send(command);
  }
  
  async uploadBytes(data, key) {
    const contentType = getContentType(key);
    
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: data,
      ContentType: contentType,
    });
    
    await this.client.send(command);
  }
  
  async deleteFile(key) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    
    await this.client.send(command);
  }
  
  getFileURL(key) {
    return `${this.publicURL.replace(/\/$/, '')}/${key}`;
  }
  
  async fileExists(key) {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      
      await this.client.send(command);
      return true;
    } catch (err) {
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw err;
    }
  }
  
  async copyFile(sourceKey, destKey) {
    const copySource = `${this.bucket}/${sourceKey}`;
    
    const command = new CopyObjectCommand({
      Bucket: this.bucket,
      CopySource: copySource,
      Key: destKey,
    });
    
    await this.client.send(command);
  }
  
  async getFile(key) {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    
    const response = await this.client.send(command);
    
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    
    return Buffer.concat(chunks);
  }
  
  async streamToBuffer(stream) {
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }
}

function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  
  const contentTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.zip': 'application/zip',
    '.json': 'application/json',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.html': 'text/html',
    '.txt': 'text/plain',
    '.xml': 'application/xml',
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
  };
  
  return contentTypes[ext] || 'application/octet-stream';
}

module.exports = {
  S3FileSystem,
  getContentType
};
