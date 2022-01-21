import { SESMailCommonHeaders } from "aws-lambda/trigger/ses";

export const ForwardingStatus = {
  Received: "received",
  Completed: "completed",
  Failed: "completed",
};
export type ForwardingStatus = typeof ForwardingStatus[keyof typeof ForwardingStatus];

export interface Forwarding {
  forwardingId: string;
  createdAt: number;
  forwardedAt?: number;
  objectKey: string;
  recipient: string;
  mappingKey: string;
  accountId: string;
  timestamp: number;
  headers: SESMailCommonHeaders;
  status: ForwardingStatus;
}

export interface AccountMapping {
  mappingKey: string;
  accountId: string;
  createdAt: number;
}

export interface Account {
  accountId: string;
  createdAt: number;
  accountEmail: string;
}
