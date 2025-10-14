
// 
//

/*
const { AWSIntegration } = require('./aws/integration');

const awsIntegration = new AWSIntegration();

onServe((e) => {
  awsIntegration.setup($app).then((integration) => {
    if (integration.isS3Enabled()) {
      console.log('AWS S3 storage is active');
    }
    if (integration.isSESEnabled()) {
      console.log('AWS SES mailer is active');
    }
    if (integration.isCognitoEnabled()) {
      console.log('AWS Cognito authentication is active');
    }
  }).catch((err) => {
    console.error('Failed to setup AWS integration:', err);
  });
});

onRecordAfterCreateSuccess((e) => {
  const record = e.record;
  
  if (record.collection().name === 'custom_uploads' && awsIntegration.isS3Enabled()) {
    const metadata = {
      uploaded_at: new Date().toISOString(),
      uploaded_by: record.get('user_id'),
      file_name: record.get('file')
    };
    
    const metadataKey = `metadata/${record.id}.json`;
    awsIntegration.uploadToS3(
      Buffer.from(JSON.stringify(metadata)),
      metadataKey
    ).then(() => {
      console.log(`Uploaded metadata for ${record.id}`);
    }).catch((err) => {
      console.error(`Failed to upload metadata: ${err.message}`);
    });
  }
}, 'custom_uploads');

onRecordAfterCreateSuccess((e) => {
  const record = e.record;
  
  if (record.collection().name === 'notifications' && awsIntegration.isSESEnabled()) {
    const message = {
      to: [{ address: record.get('recipient_email') }],
      subject: record.get('subject'),
      html: record.get('html_body'),
      text: record.get('text_body')
    };
    
    awsIntegration.sesMailer.send(message).then(() => {
      console.log(`Sent notification email to ${record.get('recipient_email')}`);
    }).catch((err) => {
      console.error(`Failed to send notification: ${err.message}`);
    });
  }
}, 'notifications');
*/

console.log('AWS integration example hook loaded (currently disabled)');
console.log('To enable AWS integrations via JavaScript, uncomment the code in pb_hooks/aws_example.js');
