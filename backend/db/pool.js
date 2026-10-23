import fs from 'node:fs'
import tls from 'node:tls'
import pg from 'pg'
import { Signer } from '@aws-sdk/rds-signer'

/*
  資料庫連線池（整個後端共用這一個）。

  為什麼沒有密碼？
  - database-1 開的是「IAM 身分驗證」，沒有固定密碼。
  - 每次要開新連線時，用 AWS 帳號的登入狀態向 AWS 換一張「15 分鐘有效的臨時密碼」（token），
    跟在終端機貼 `aws rds generate-db-auth-token` 那行是同一件事，只是改由程式自動做。
  - pg 的 password 可以給一個函式：每開一條新連線就呼叫一次，所以 token 過期也沒關係。
  - 本機開發時，用的是你自己 `aws login` 的身分；之後部署到 AWS 上，改用伺服器本身的 IAM 角色，
    程式不用改。

  為什麼要 certs/global-bundle.pem？
  - 這是 AWS 官方公開的 RDS 憑證（https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem），
    不是機密。用它檢查「連到的真的是 AWS 的資料庫」，等同 psql 的 sslmode=verify-full
    （比 sslmode=require 嚴格：require 只加密，不確認對方身分）。
*/

const { DB_HOST, DB_PORT = '5432', DB_NAME = 'postgres', DB_USER, AWS_REGION } = process.env

if (!DB_HOST || !DB_USER || !AWS_REGION) {
  throw new Error('缺少資料庫設定：請確認 backend/.env 有 DB_HOST、DB_USER、AWS_REGION（參考 .env.example）')
}

const signer = new Signer({
  hostname: DB_HOST,
  port: Number(DB_PORT),
  username: DB_USER,
  region: AWS_REGION,
})

export const pool = new pg.Pool({
  host: DB_HOST,
  port: Number(DB_PORT),
  database: DB_NAME,
  user: DB_USER,
  password: () => signer.getAuthToken(),
  ssl: {
    rejectUnauthorized: true,
    // 開了「網際網路存取閘道」的端點用一般的 Amazon 公開憑證（Node 內建就信任）；
    // 走 VPC 內部連線的端點則用 RDS 專用憑證。兩種都放進來，換連線方式時不用改程式。
    ca: [...tls.rootCertificates, fs.readFileSync(new URL('../certs/global-bundle.pem', import.meta.url), 'utf8')],
  },
  max: 10,
})

// 只要用一次就好的查詢，直接 query(sql, params)；需要交易（transaction）時再用 pool.connect()。
export function query(text, params) {
  return pool.query(text, params)
}
