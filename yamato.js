'use strict';
// const Shopify =require('@shopify/shopify-api');
// const dotenv = require('dotenv');
// dotenv.config();
const express = require("express");
const axios = require("axios");
const app = express();
const consola = require('consola'); 
const { dateFormat, isAfter } = require('date-fns');
const add = require('date-fns/add')
const {formatInTimeZone} = require('date-fns-tz')
const format = require('date-fns/format')
const crypto = require('crypto');
const { Client } = require('pg');
const { createObjectCsvWriter } = require('csv-writer');
const net = require('net');
app.use(express.json());
const path = require('path');

// app.set('trust proxy', true);

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// app.get('/', (req, res) => {
//   const ip = req.socket.remoteAddress;
//   const clientIP = req.headers['x-forwarded-for']?.split(',').shift() || req.socket?.remoteAddress;
//   if (net.isIPv6(clientIP)) {
//     let ipv4Address = clientIP.split('::ffff:')[1];
//     console.log(ipv4Address); // Outputs: 127.0.0.1
// }
//   res.send(`Địa chỉ IP của bạn là: ${clientIP}`);
// });


app.listen(9000, () => {
//  console.log("Server running on port 300res.send({data: "thuytt-remote-mac"});0");
 consola.success(`Server running on port 9000!!!`);
});


const generateRandomKey = () => {
  const now = new Date();

  const day = String(now.getDate()).padStart(2, '0'); // dd
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0'); // SSS
  const month = String(now.getMonth() + 1).padStart(2, '0'); // MM
  const hours = String(now.getHours()).padStart(2, '0'); // HH
  const year = now.getFullYear();
  const minutes = String(now.getMinutes()).padStart(2, '0'); // mm
  const seconds = String(now.getSeconds()).padStart(2, '0'); // ss

  return `${day}${milliseconds}${month}${hours}${year}${minutes}${seconds}`;
};

    
const commonKey = 'xr5RJVtwJuAu';
const companyId = 'TAndD13'; // 例: 会社ID
const baseUrl='https://com-dev03.kuronekoyamato.co.jp'
app.get("/test", (req, res, next) => {
  // 共通キー、会社IDを定義

  // ランダムキーを生成 (前述のddSSSMMHHyyyymmss形式)
  
  const randomKey = generateRandomKey();

  // 文字列を結合
  const plainText = commonKey + randomKey + companyId;

  // SHA-256ハッシュを計算
  const hash = crypto.createHash('sha256').update(plainText).digest('hex');

  // 64桁に満たない場合、0パディングを行う
  const paddedHash = hash.padStart(64, '0');

  // 結果を出力
  console.log('生成されたハッシュ値:', paddedHash);
  res.json({randomKey,paddedHash});
})

app.get('/getStoreInfo', async (req, res) => {
  try {
      // ランダムキーの生成
      const randomKey = generateRandomKey();

      // 文字列を結合してSHA-256ハッシュを作成
      const plainText = commonKey + randomKey + companyId;
      const hash = crypto.createHash('sha256').update(plainText).digest('hex');
      const paddedHash = hash.padStart(64, '0');

      // 最寄店舗一覧URLの取得
      const storeListUrl = `${baseUrl}/authapi/authMapUrl?COMPANY_ID=${companyId}&TIME=${randomKey}&HASH=${paddedHash}`;
      const storeListResponse = await axios.get(storeListUrl);

      const mapURL= storeListResponse.data.Response.RepOutput.MAP
      console.log('最寄店舗一覧URL取得成功:', mapURL);
      // サイト認証
      const authUrl = `${baseUrl}/authapi/authLogin?COMPANY_ID=${companyId}&TIME=${randomKey}&HASH=${paddedHash}`;
      const authResponse = await axios.get(authUrl);

      const atoken= authResponse.data.Response.RepOutput.ATOKEN
      console.log('サイト認証成功:', atoken);

      // 店舗検索リクエスト
      // const searchUrl = `${baseUrl}/storeSearch?access_token=${accessToken}`;

      // console.log('店舗検索成功:', searchUrl);

      // 結果をJSON形式で返す
      res.json({
        url:`${mapURL}&ATOKEN=${atoken}`,
      });

  } catch (error) {
      console.error('エラーが発生しました:', error);
      res.status(500).json({ error: 'エラーが発生しました。' });
  }
});

const generateMMKAuthKey = (trackingNumber, secretKey) => {
  // 認証キー元番号を算出
  const bigIntTrackingNumber = BigInt(trackingNumber);
  const bigIntSecretKey = BigInt(secretKey);
  const authKeySourceNumber = bigIntTrackingNumber * bigIntSecretKey;

  // 元番号から下8桁を抽出
  const authKey = authKeySourceNumber.toString().slice(-8);

  return authKey;
};

// 例
const trackingNumber = '120000236999'; // 11桁または12桁の送り状伝票番号
const secretKey = '96258010'; // 8桁の秘密鍵

const mmkAuthKey = generateMMKAuthKey(trackingNumber, secretKey);
console.log('生成されたMMK認証キー:', mmkAuthKey);


// /key エンドポイント
app.get('/key', (req, res) => {
  // クエリパラメータからtrackingNumberとsecretKeyを取得
  const trackingNumber = '120000236988'; // 11桁または12桁の送り状伝票番号
  const secretKey = '96258010'; // 8桁の秘密鍵

  // 入力チェック
  if (!trackingNumber || !secretKey) {
      return res.status(400).send('trackingNumberとsecretKeyの両方が必要です');
  }

  try {
      // MMK認証キーを生成
      const mmkAuthKey = generateMMKAuthKey(trackingNumber, secretKey);
      res.json({ mmkAuthKey });
  } catch (error) {
      res.status(500).send('MMK認証キーの生成中にエラーが発生しました');
  }
});
