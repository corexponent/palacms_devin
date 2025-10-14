
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

class SESMailer {
  constructor(config) {
    if (!config.sesEnabled) {
      throw new Error('SES is not enabled');
    }
    
    if (!config.sesFromAddress) {
      throw new Error('SES from address is required');
    }
    
    const clientConfig = {
      region: config.sesRegion,
    };
    
    if (config.sesAccessKey && config.sesSecretKey) {
      clientConfig.credentials = {
        accessKeyId: config.sesAccessKey,
        secretAccessKey: config.sesSecretKey,
      };
    }
    
    this.client = new SESClient(clientConfig);
    this.fromAddress = config.sesFromAddress;
  }
  
  async send(message) {
    const toAddresses = message.to?.map(addr => addr.address || addr) || [];
    const ccAddresses = message.cc?.map(addr => addr.address || addr) || [];
    const bccAddresses = message.bcc?.map(addr => addr.address || addr) || [];
    
    let fromAddress = this.fromAddress;
    if (message.from && message.from.address) {
      if (message.from.name) {
        fromAddress = `${message.from.name} <${message.from.address}>`;
      } else {
        fromAddress = message.from.address;
      }
    }
    
    const emailParams = {
      Source: fromAddress,
      Destination: {
        ToAddresses: toAddresses,
        CcAddresses: ccAddresses,
        BccAddresses: bccAddresses,
      },
      Message: {
        Subject: {
          Data: message.subject,
          Charset: 'UTF-8',
        },
        Body: {},
      },
    };
    
    if (message.html) {
      emailParams.Message.Body.Html = {
        Data: message.html,
        Charset: 'UTF-8',
      };
    }
    
    if (message.text) {
      emailParams.Message.Body.Text = {
        Data: message.text,
        Charset: 'UTF-8',
      };
    }
    
    const command = new SendEmailCommand(emailParams);
    await this.client.send(command);
  }
  
  reset() {
  }
}

module.exports = {
  SESMailer
};
