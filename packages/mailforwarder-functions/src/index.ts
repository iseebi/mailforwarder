import { Context, SESMessage, SNSEvent, SQSEvent } from "aws-lambda";
import * as fs from "fs";
import AppContainer from "./container";
import { Forwarding } from "./models";

const container = new AppContainer();

if (process.env.MAIL_RECEIVER_GOOGLE_WORKLOAD_CREDENTIAL_CONFIG && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  const configPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  fs.writeFileSync(configPath, process.env.MAIL_RECEIVER_GOOGLE_WORKLOAD_CREDENTIAL_CONFIG, { mode: 0o600 });
}

export const receiveMailTopicHandler = async (event: SNSEvent, _context: Context): Promise<void> => {
  await Promise.all(
    event.Records.map(async (e) => {
      const message = JSON.parse(e.Sns.Message) as SESMessage;
      await container.getReceiveUseCase().handleReceiveEventAsync(message);
    }),
  );
};

export const forwardMailTopicHandler = async (event: SQSEvent, _context: Context): Promise<void> => {
  await Promise.all(
    event.Records.map(async (e) => {
      const forwarding = JSON.parse(e.body) as Forwarding;
      await container.getForwardingUseCase().handleForwardEventAsync(forwarding);
    }),
  );
};
