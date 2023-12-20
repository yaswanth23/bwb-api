import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as util from 'util';
import * as path from 'path';

AWS.config.update({
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  region: process.env.AWS_REGION,
});

const S3 = new AWS.S3();
const readFile = util.promisify(fs.readFile);

@Injectable()
export class AwsService {
  async uploadFile(filePath: string): Promise<AWS.S3.ManagedUpload.SendData> {
    const file = await readFile(filePath);

    const params = {
      Bucket: 'bwb-assets',
      Key:
        process.env.APP_ENV === 'production'
          ? 'purchase-orders/prod/'
          : 'purchase-orders/dev/' + path.basename(filePath),
      Body: file,
    };

    return S3.upload(params).promise();
  }
}
