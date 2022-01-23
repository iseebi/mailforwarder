import { Callback, Context, SESMessage, SNSEvent, SQSEvent } from "aws-lambda";
import AppContainer from "./container";
import { Forwarding } from "./models";

const container = new AppContainer();

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
