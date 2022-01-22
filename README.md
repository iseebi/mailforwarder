# mailforwarder

AWS SESでメールを受信し、特定のURLにPOSTする。(関連プロジェクトの mailreceiver を想定している)

## デプロイ

### 環境設定

~/.aws/credentials を適切に設定し、`AWS_PROFILE` と `AWS_REGION` が参照できる状態にあること。

SESのメール受信を使用する関係上、使用できるリージョンは限定される。(東京リージョン ap-northeast-1 は使えない。)

### クローン後

パッケージインストール

```
$ npm install
$ npm run bootstrap
```

CDKの初期化

```
$ cd packages/mailforwarder-infrastructure
$ npm run cdk bootstrap
```

### デプロイ

```
$ export MAIL_RECEIVER_URL="https://..."
$ export MAIL_RECEIVER_AUTH="Basic ..."
$ npm run build
$ npm run deploy-ci
```

## AWSコンソールでの初期設定

### SES

- Email receivingにて、Rule set をアクティブにする。
- Verified Identitiesで、受信したいドメインを確認状態にする。

### IAM

mailreceiverのメールボックスバケット(S3QLで使用)も、このスタックで合わせて作られており、これにアクセスできるユーザーとしてMailForwarderStack-MailForwarderMUAUser*がある。

S3QLで使用するために、アクセスキーを発行しておく。(取り扱いには特に注意する)

### S3

mailreceiverのメールボックスバケット`mailforwarderstack-mailboxbucket*`の名前を控えておく。

### DynamoDB

MailForwarderStack-AccountsTable* に、下記の項目を作成する。
(受信メールアドレスの数だけ作成する)

- accountId: UUIDを作成して設定
- accountEmail: 配信先のメールアドレス (mailreceiver側に存在するアカウントを指定)
- createdAt: JavaScript コンソールで `new Date().getTime()` 

```
{
 "accountId": "A6137788-A915-439D-B92F-09F6702A8D33",
 "accountEmail": "user@example.com",
 "createdAt": 1642818458904
}
```

MailForwarderStack-AccountMappingsTable* に、下記の項目を作成する。

- mappingKey: 受信メールアドレスによる転送の条件
    - フルメールアドレス一致の場合、そのメールアドレス `user@example.com`
        - Gmailスタイルエイリアス `user+test1@example.com` は、エイリアス部分が除かれた状態で評価される。
    - ドメイン一致(*@user.example.com)の場合、@+ドメイン `@user.example.com`
    - 両方に一致する場合は、フルメールアドレス一致が優先される。
- accountId: 配信先のアカウントのUUID
- createdAt: JavaScript コンソールで `new Date().getTime()` 

```
{
  "mappingKey": "user@example.com",
  "accountId": "A6137788-A915-439D-B92F-09F6702A8D33",
  "createdAt": 1642818583197
}
```

