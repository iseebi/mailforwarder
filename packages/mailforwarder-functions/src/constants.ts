const constants = {
  tables: {
    forwardingTableName: process.env.DDB_FORWARDING_TABLE_NAME || "",
    mappingTableName: process.env.DDB_MAPPING_TABLE_NAME || "",
    accountsTableName: process.env.DDB_ACCOUNTS_TABLE_NAME || "",
  },
  queue: {
    forwardingQueueUrl: process.env.SQS_FORWARDING_QUEUE_URL || "",
  },
  delivery: {
    url: process.env.MAIL_RECEIVER_URL || "",
    authorization: process.env.MAIL_RECEIVER_AUTH || "",
  },
  receiveBucketName: process.env.RECIEVE_BUCKET_NAME || "",
};

export default constants;
