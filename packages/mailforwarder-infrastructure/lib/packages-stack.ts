import { Duration, Stack, StackProps } from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as ses from "aws-cdk-lib/aws-ses";
import * as sesActions from "aws-cdk-lib/aws-ses-actions";
import * as sns from "aws-cdk-lib/aws-sns";
import * as ddb from "aws-cdk-lib/aws-dynamodb";
import { BucketAccessControl } from "aws-cdk-lib/aws-s3";
import { SubscriptionProtocol } from "aws-cdk-lib/aws-sns";
import { Construct } from "constructs";


export class PackagesStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

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
      sortKey: {
        name: "createdAt", type: ddb.AttributeType.NUMBER
      },
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
    });
    accountsTable.grant(functionRole);
    const accountMappingsTable = new ddb.Table(this, "AccountMappingsTable", {
      partitionKey: {
        name: "mappingKey",
        type: ddb.AttributeType.STRING
      },
      sortKey: {
        name: "createdAt", type: ddb.AttributeType.NUMBER
      },
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
    });
    accountMappingsTable.grant(functionRole);
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
      sortKey: {
        name: "createdAt", type: ddb.AttributeType.NUMBER
      },
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
    });
    forwardingTable.grant(functionRole);

    // Mail Receive handler
    const receiveBucket = new s3.Bucket(this, "ReceiveMailsBucket", {
      accessControl: BucketAccessControl.PRIVATE,
    });
    receiveBucket.addLifecycleRule({
      expiration: Duration.days(60),
    })
    const receiveTopic = new sns.Topic(this, "ReceiveMailTopic");
    const receiveMailFunction = new lambda.Function(this, "ReceiveMailHandler", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code,
      role: functionRole,
      handler: "index.receiveMailTopicHandler"
    });
    receiveMailFunction.addPermission("ReceiveMailTopicFunctionPermission", {
      principal: new iam.ServicePrincipal("sns.amazonaws.com"),
      action: "lambda:InvokeFunction",
      sourceArn: receiveTopic.topicArn
    })
    new sns.Subscription(this, "ReceiveMailSubscription", {
      protocol: SubscriptionProtocol.LAMBDA,
      topic: receiveTopic,
      endpoint: receiveMailFunction.functionArn,
    })

    // receive rule
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
