import { Callback, Context, SESMessage, SNSEvent } from "aws-lambda";
import AppContainer from "./container";

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
