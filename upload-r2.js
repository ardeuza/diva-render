// upload-r2.js — upload output.png to Cloudflare R2 (S3-compatible)

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');

(async () => {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKey = process.env.R2_ACCESS_KEY_ID;
  const secretKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET || 'diva-cards';
  const key = process.env.R2_KEY;

  if (!accountId || !accessKey || !secretKey || !key) {
    console.error('Missing R2 env vars');
    process.exit(1);
  }

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  });

  const body = fs.readFileSync('output.png');
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: 'image/png',
    CacheControl: 'public, max-age=300',
  }));

  console.log(`[r2] uploaded s3://${bucket}/${key} ${(body.length/1024).toFixed(0)}KB`);
})();
