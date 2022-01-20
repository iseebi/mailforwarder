import { Stack, StackProps } from 'aws-cdk-lib';
import * as s3 from "aws-cdk-lib/aws-s3";
import { BucketAccessControl } from "aws-cdk-lib/aws-s3";
import * as ses from 'aws-cdk-lib/aws-ses';
import * as sesActions from 'aws-cdk-lib/aws-ses-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

export class PackagesStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const receiveBucket = new s3.Bucket(this, 'ReceiveMailsBucket', {
      accessControl: BucketAccessControl.PRIVATE,
    });
    const receiveTopic = new sns.Topic(this, 'ReceiveMailTopic')

    const ruleSet = new ses.ReceiptRuleSet(this, "MailForwarderStack-ReceiveRuleSet", {
      rules: [
        {
          actions: [
            new sesActions.S3({
              bucket: receiveBucket,
              topic: receiveTopic,
            })
          ]
        }
      ]
    });
  }
}
