import { Duration, Stack, StackProps } from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaEvents from "aws-cdk-lib/aws-lambda-event-sources";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as ses from "aws-cdk-lib/aws-ses";
import * as sesActions from "aws-cdk-lib/aws-ses-actions";
import * as sns from "aws-cdk-lib/aws-sns";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as ddb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

interface PackageStackProps {
  mailReceiverUrl: string;
  mailReceiverAuthorization: string;
}

export class PackagesStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps & PackageStackProps) {
    super(scope, id, props);

    const mailReceiverUrl = props?.mailReceiverUrl;
    if (!mailReceiverUrl) {
      throw new Error("MAIL_RECEIVER_URL Required.");
    }
    const mailReceiverAuthorization = props?.mailReceiverAuthorization || "";

    // Functions Set
    const code = new lambda.AssetCode("node_modules/mailforwarder-functions/lib");
    const functionRole = new iam.Role(this, "ForwarderFunctionsRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"),
      ],
    })

    // tables
    const accountsTable = new ddb.Table(this, "AccountsTable", {
      partitionKey: {
        name: "accountId",
        type: ddb.AttributeType.STRING
      },
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
    });
    accountsTable.grantReadWriteData(functionRole);
    const accountMappingsTable = new ddb.Table(this, "AccountMappingsTable", {
      partitionKey: {
        name: "mappingKey",
        type: ddb.AttributeType.STRING
      },
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
    });
    accountMappingsTable.grantReadWriteData(functionRole);
    accountMappingsTable.addGlobalSecondaryIndex({
      indexName: "mappingAccountIndex",
      partitionKey: { name: "accountId", type: ddb.AttributeType.STRING },
      sortKey: {
        name: "createdAt", type: ddb.AttributeType.NUMBER
      },
    });
    const forwardingTable = new ddb.Table(this, "ForwardingTable", {
      partitionKey: {
        name: "forwardingId",
        type: ddb.AttributeType.STRING
      },
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
    });
    forwardingTable.grantReadWriteData(functionRole);
    const tableNameEnvironments = {
      DDB_FORWARDING_TABLE_NAME: forwardingTable.tableName,
      DDB_MAPPING_TABLE_NAME: accountMappingsTable.tableName,
      DDB_ACCOUNTS_TABLE_NAME: accountsTable.tableName,
    };

    // queue
    const forwardingQueue = new sqs.Queue(this, "ForwardingQueue")
    forwardingQueue.grantConsumeMessages(functionRole);
    forwardingQueue.grantSendMessages(functionRole);
    const queueNameEnvironments = {
      SQS_FORWARDING_QUEUE_URL: forwardingQueue.queueUrl,
    }

    // mail receive
    const receiveBucket = new s3.Bucket(this, "ReceiveMailsBucket", {
      accessControl: s3.BucketAccessControl.PRIVATE,
    });
    receiveBucket.addLifecycleRule({
      expiration: Duration.days(90),
    })
    receiveBucket.grantRead(functionRole);
    const receiveTopic = new sns.Topic(this, "ReceiveMailTopic");
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

    // lambda environment
    const environment = {
      ...tableNameEnvironments,
      ...queueNameEnvironments,
      RECEIVE_BUCKET_NAME: receiveBucket.bucketName,
      MAIL_RECEIVER_URL: mailReceiverUrl,
      MAIL_RECEIVER_AUTH: mailReceiverAuthorization,
    };

    // Mail Receive handler
    const receiveMailFunction = new lambda.Function(this, "ReceiveMailHandler", {
      runtime: lambda.Runtime.NODEJS_20_X,
      code,
      environment,
      role: functionRole,
      handler: "index.receiveMailTopicHandler"
    });
    receiveMailFunction.addPermission("ReceiveMailTopicFunctionPermission", {
      principal: new iam.ServicePrincipal("sns.amazonaws.com"),
      action: "lambda:InvokeFunction",
      sourceArn: receiveTopic.topicArn
    });
    receiveMailFunction.addEventSource(new lambdaEvents.SnsEventSource(receiveTopic));

    // forwarding queue handler
    const forwardMailFunction = new lambda.Function(this, "ForwardMailHandler", {
      runtime: lambda.Runtime.NODEJS_20_X,
      code,
      environment,
      role: functionRole,
      handler: "index.forwardMailTopicHandler",
      timeout: Duration.seconds(20)
    });
    forwardMailFunction.addPermission("ForwardMailQueueFunctionPermission", {
      principal: new iam.ServicePrincipal("sqs.amazonaws.com"),
      action: "lambda:InvokeFunction",
      sourceArn: forwardingQueue.queueArn
    });
    forwardMailFunction.addEventSource(new lambdaEvents.SqsEventSource(forwardingQueue))

    // Mailbox
    const muaUser = new iam.User(this, "MailForwarder-MUAUser");
    const mailboxBucket = new s3.Bucket(this, "MailboxBucket", {
      accessControl: s3.BucketAccessControl.PRIVATE,
    });
    mailboxBucket.grantReadWrite(muaUser);

    // Mail Sender
    const mailSender = new iam.User(this, "MailSender");
    mailSender.addToPrincipalPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: [
        '*'
      ],
      actions: [
        'ses:SendRawEmail',
        'ses:SendEmail',
      ]
    }));
  }
}
