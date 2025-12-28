import { Callback, Context, SESMessage, SNSEvent, SQSEvent } from "aws-lambda";
import AppContainer from "./container";
import { Forwarding } from "./models";

const container = new AppContainer();

if (process.env.MAIL_RECEIVER_GOOGLE_WORKLOAD_CREDENTIAL_CONFIG && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  const configPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  require("fs").writeFileSync(
    configPath,
    process.env.MAIL_RECEIVER_GOOGLE_WORKLOAD_CREDENTIAL_CONFIG,
  );
}


export const receiveMailTopicHandler = (event: SNSEvent, context: Context, callback: Callback) => {
  Promise.all(
    event.Records.map(async (e) => {
      const message = JSON.parse(e.Sns.Message) as SESMessage;
      await container.getReceiveUseCase().handleReceiveEventAsync(message);
    }),
  )
    .then(() => callback())
    .catch((e) => callback(e));
};

export const forwardMailTopicHandler = (event: SQSEvent, context: Context, callback: Callback) => {
  Promise.all(
    event.Records.map(async (e) => {
      const forwarding = JSON.parse(e.body) as Forwarding;
      await container.getForwardingUseCase().handleForwardEventAsync(forwarding);
    }),
  )
    .then(() => callback())
    .catch((e) => callback(e));
};
