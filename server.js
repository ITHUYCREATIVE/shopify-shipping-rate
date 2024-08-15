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

// app.set('trust proxy', true);

app.get('/', (req, res) => {
  const ip = req.socket.remoteAddress;
  const clientIP = req.headers['x-forwarded-for']?.split(',').shift() || req.socket?.remoteAddress;
  if (net.isIPv6(clientIP)) {
    let ipv4Address = clientIP.split('::ffff:')[1];
    console.log(ipv4Address); // Outputs: 127.0.0.1
}
  res.send(`Địa chỉ IP của bạn là: ${clientIP}`);
});
// Replace these with your actual Heroku database credentials
/// const dbUser = '';
// const dbPassword = '';
// const dbName = '';
// const dbHost = ''; // Typically provided by Heroku
// const dbPort = '5432'; // Typically 5432 for Postgres

const client = new Client({
  user: dbUser,
  password: dbPassword,
  database: dbName,
  host: dbHost,
  port: dbPort,
  ssl: {
    rejectUnauthorized: false // For development purposes, set it to true in production
  }
});


async function getAllAccounts() {
  try {
    await client.connect();

    const query = 'SELECT * FROM accounts'; // Assuming your table is named 'accounts'

    const result = await client.query(query);

    return result.rows;
  } catch (error) {
    console.error('Error fetching accounts:', error);
    // throw error;
  } finally {
    await client.end();
  }
}

// // Example usage
// const accountsData = getAllAccounts()
//   .then(accounts => {
//     // console.log('All accounts:', accounts);
//   })
//   .catch(error => {
//     console.error('Error:', error);
//   });

//   console.log('All accounts:', accountsData);
async function checkSubscriptions() {
  try {
    const accountsData = await getAllAccounts();

    const records = [];

    for (const account of accountsData) {
       console.log('Check account:', account);
      const data = await getSubscription(account.shop_id, account.access_token, account.subscription_id);
      console.log('getSubscription:', data);
      // Add account ID and subscription status to records array
      records.push({ account_id: account.id,shop_id: account.shop_id,plan: account.plan_id == 2 ? "Advance" : "Standard", subscription_status: data?.status , currentPeriodEnd: data?.currentPeriodEnd });
    }

    // Write records to CSV file
    const csvWriter = createObjectCsvWriter({
      path: 'subscriptions.csv',
      header: [
        { id: 'account_id', title: 'Account ID' },
        { id: 'shop_id', title: 'Domain' },
        { id: 'plan', title: 'Plan' },
        { id: 'subscription_status', title: 'Subscription Status' },
        { id: 'currentPeriodEnd', title: 'currentPeriodEnd' }
      ]
    });

    await csvWriter.writeRecords(records);

    console.log('CSV file written successfully.');
  } catch (error) {
    console.error('Error checking subscriptions:', error);
  }
}

// async function checkSubscriptions() {
//   try {
//     const accountsData = await getAllAccounts();

//     for (const account of accountsData) {
//       const data = await getSubscription(account.shop_id, account.access_token, account.subscription_id);

//       if (data?.status === 'active') {
//         console.log(`Account ${account.shop_id} has an active subscription.`);
//         // Handle the active subscription as needed
//       } else {
//         console.log(`Account ${account.shop_id} does not have an active subscription.`);
//       }
//     }
//   } catch (error) {
//     console.error('Error checking subscriptions:', error);
//   }
// }

// Function to fetch subscription details
const getSubscription = async (shop, accessToken, subscriptionId) => {
  try {
    // console.log('getSubscription:', shop, accessToken, subscriptionId);
    const response = await axios.post(
      `https://${shop}/admin/api/2023-10/graphql.json`,
      { query: getSubscriptionQuery(subscriptionId) },
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      }
    );
    // console.log('response:', response.data.data);

    return { status: response?.data?.data?.node?.status, currentPeriodEnd: response?.data?.data?.node?.currentPeriodEnd };  
  } catch (error) {
    // console.error('Error fetching subscription:', error);
    // throw error;
  }
};

// GraphQL query to get subscription details
const getSubscriptionQuery = (subscriptionId) => {
  return `
    query {
      node(id: "${subscriptionId}") {
        ...on AppSubscription {
          createdAt
          currentPeriodEnd
          id
          name
          status
          test
          lineItems {
            plan {
              pricingDetails {
                ...on AppRecurringPricing {
                  interval
                  price {
                    amount
                    currencyCode
                  }
                }
                ...on AppUsagePricing {
                  terms
                  cappedAmount {
                    amount
                    currencyCode
                  }
                  balanceUsed {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
      }
    }
  `;
};

  // async function checkSubscriptions() {
  //   try {
  //     const accountsData = await getAllAccounts();
  //     console.log('All accounts:', accountsData);
  //     for (const account of accountsData) {
  //       const response = await axios.get(`https://${account.shop_id}/admin/api/2023-10/recurring_application_charges.json`, {
  //         headers: {
  //           'X-Shopify-Access-Token': account.access_token
  //         }
  //       });
  
  //       const subscriptions = response.data.recurring_application_charges;
  
  //       // Check if there are any active subscriptions
  //       const activeSubscriptions = subscriptions.filter(subscription => subscription.status === 'active');
  
  //       if (activeSubscriptions.length > 0) {
  //         console.log(`Account ${account.shop_id} has an active subscription.`);
  //         // Handle the active subscription as needed
  //       } else {
  //         console.log(`Account ${account.shop_id} does not have an active subscription.`);
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Error checking subscriptions:', error);
  //   }
  // }
  
  // Call the function to start checking subscriptions
  // checkSubscriptions();

// // const session = await Shopify.Utils.loadCurrentSession(
// //     req,
// //     res
// //   );
// //   const client = new Shopify.Clients.Rest(
// //     session.shop,
// //     session.accessToken
// //   );
// //   const response = client.get({path: 'shop'});

// const { API_KEY, API_SECRET_KEY, SCOPES, SHOP, HOST } = process.env;

// Shopify.Context.initialize({
//   API_KEY,
//   API_SECRET_KEY,
//   SCOPES: SCOPES,
//   HOST_NAME: HOST.replace(/https?:\/\//, ""),
//   HOST_SCHEME: HOST.split("://")[0],
//   IS_EMBEDDED_APP: true,
//   API_VERSION: "2022-04"
// });
// // Storing the currently active shops in memory will force them to re-login when your server restarts. You should
// // persist this object in your app.
// const ACTIVE_SHOPIFY_SHOPS= {};

// // the rest of the example code goes here

// app.get("/", async (req, res) => {
//    // This shop hasn't been seen yet, go through OAuth to create a session
//   if (ACTIVE_SHOPIFY_SHOPS[SHOP] === undefined) {
//      // not logged in, redirect to login
//     res.redirect(`/login`);
//   } else {
//     res.send("Hello world!");
//     // Load your app skeleton page with App Bridge, and do something amazing!
//     res.end();
//   }
// });
  
const books = [
    {title: 'Harry Potter', id: 1},
    {title: 'Twilight', id: 2},
    {title: 'Lorien Legacies', id: 3}
]

app.listen(9000, () => {
//  console.log("Server running on port 300res.send({data: "thuytt-remote-mac"});0");
 consola.success(`Server running on port 9000!!!`);
});

app.get("/test", (req, res, next) => {
  
    // const date = new Date();
    const date = "2023-10-15T02:50:32.000Z";
    const tztime = formatInTimeZone(new Date(date), 'Asia/Tokyo', 'yyyy年MM月dd日　HH:mm')
    const after15= add(new Date(date), {hours:0,minutes:0})
    // res.send(date);
    const formatDate1 = format(after15, "yyyy-MM-dd")
    const formatDate = format(after15, "yyyy-MM-dd")+"T"+format(after15, "HH:MM:SSXXXXX")

    let pickupAt=(new Date());
    const currentDate = formatInTimeZone(new Date(),  "Asia/Tokyo", "yyyy-MM-dd");
    const currentTime = formatInTimeZone(new Date(), "Asia/Tokyo", "HH:mm");
    console.log('++++++++++ currentTime ++++++++++');
    console.log(currentTime, );
    const beforeTime = "12:15";
    // Input time as a string
const timeString = "15:1";

// Split the time into hours and minutes
const timeParts = timeString.split(':');
const hours = timeParts[0];
const minutes = timeParts[1];

// Pad the hours and minutes with leading zeros if needed
const paddedHours = hours.length < 2 ? '0' + hours : hours;
const paddedMinutes = minutes.length < 2 ? '0' + minutes : minutes;

// Format the time as "HH:mm"
const formattedTime = paddedHours + ':' + paddedMinutes;

// Output the result
console.log("formattedTime");
console.log(formattedTime);

    const currentTimeStr = `${currentDate}T${beforeTime}`;
        console.log('++++++++++ beforeTime ++++++++++');
        console.log(beforeTime);
        console.log("item.beforeTime > currentTime",beforeTime > currentTime);
        console.log("item.beforeTime > currentTime", isAfter(new Date("2023-10-16T20:10"), new Date(currentTime)));
        if (beforeTime > currentTime) {
        //   break; 
        pickupAt = add(new Date(currentTimeStr), {minutes:45})
        }
        // pickupAt = add(new Date(currentTimeStr), {minutes:45})
        console.log(pickupAt)
        const pickupAtTZ= formatInTimeZone(pickupAt,  "Asia/Tokyo", "yyyy-MM-dd") + "T" +formatInTimeZone(pickupAt,  "Asia/Tokyo", "HH:mm:ssXXXXX");
        console.log('++++++++++ pickupAt ++++++++++');
        console.log(pickupAtTZ);

        const arr = [{"id":"464a5470-7f2b-4073-98db-3c47775dcc24","beforeTime":"12:15","pickupAfter":"45"},{"id":"7ba7bad5-9c96-413a-9784-7f2ddcef03eb","beforeTime":"19:00","pickupAfter":"30"}];

const result = arr.find(element => {
  return element.beforeTime > "20:56";
});

console.log(result); // 👉️ 3


    res.json({date, after15, formatDate1, formatDate, tztime, pickupAt});
    
});

app.get('/api/books', (req,res)=> {
    res.send(books);
    });
     

app.get('/createOrder', (req,res)=> {

    const orderData= {
        "order_type": "PICK_UP",
        "external_store_id": "e9c67722-633f-11ee-8c99-0242ac120002",
        "external_order_id": "5517036388627-12321414",
        "display_id": "#1017",
        "items": [
          {
            "external_item_id": "14201273647379",
            "name": "apple",
            "quantity": 1,
            "unit_price": 500
          },
          {
            "external_item_id": "14201273680147",
            "name": "lemon",
            "quantity": 2,
            "unit_price": 300
          }
        ],
        "note": "受取方法 テイクアウト, 受取日 2023-10-23(月), 受取時間 5:00, 連絡先電話番号 0988888888",
        "total_price": 1525,
        "item_total_price": 1100,
        "order_date_and_time": "2023-10-21T04:10:58-04:00",
        "customer": {
          "name": "fewaf fewe",
          "phone_number": "",
          "address": "Kanagawa Yokohama Mitsuzawa Nishimachi, Kanagawa "
        },
        "estimated_pickup_time": "2023-10-23T05:00:00+09:00",
        "is_preorder": false
      }

    const data = {
        userId: 1,
        id: 1,
        title: 'foo',
        body: 'bar'
      };
      const customHeaders = {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJDdXN0b21DbGFpbXMiOnsicHJvdmlkZXIiOnsiaWQiOjIyfSwic2NvcGVzIjpbeyJJRCI6MSwiTmFtZSI6Im9yZGVycy5yZWFkIn0seyJJRCI6MiwiTmFtZSI6Im9yZGVycy5kZWxpdmVyeS5yZWFkIn0seyJJRCI6MywiTmFtZSI6Im9yZGVycy5zdGF0ZS53cml0ZSJ9LHsiSUQiOjQsIk5hbWUiOiJzdG9yZXMucmVhZCJ9LHsiSUQiOjUsIk5hbWUiOiJzdG9yZXMud2ViaG9va19zdGF0dXMud3JpdGUifSx7IklEIjo2LCJOYW1lIjoic3RvcmVzLnN0YXRlLndyaXRlIn0seyJJRCI6NywiTmFtZSI6Im9yZGVycy53ZWJob29rIn1dfSwiZXhwIjoxNzAwNDg2NDU3LCJqdGkiOiI3ODQ0OTQwZC1kMTRiLTQwMGMtOGU4Yy00MTZhMmViMTNhYWUiLCJpYXQiOjE2OTc4OTQ0NTcsImlzcyI6ImNhbWVsLXB1YmxpYy1hcGkifQ.kykduc0zs6Hhffa7VMHheua_d6YQmFtqpaW90y3RvAw', // Replace with your access token
        'Content-Type': 'application/json', // Adjust the content type as needed
      };
      // POSTリクエストを送信
      axios.post('https://stg-api.camel.kitchen/public-api/v1/webhook/orders', orderData,{
        headers: customHeaders
      })
        .then(function (response) {
          // リクエストが成功した場合の処理
          console.log('レスポンス:', response.data);
          res.send(response.data);
        })
        .catch(function (error) {
          // エラーが発生した場合の処理
          console.error('エラー:', error);
        });

        });

app.get('/api/books/:id', (req, res) => {
const book = books.find(c => c.id === parseInt(req.params.id));
    
if (!book) res.status(404).send('<h2 style="font-family: Malgun Gothic; color: darkred;">Ooops... Cant find what you are looking for!</h2>');
res.send(book);
});
     
//CREATE Request Handler
app.post('/api/books', (req, res)=> {
 
    const { error } = validateBook(req.body);
    if (error){
    res.status(400).send(error.details[0].message)
    return;
    }
    const book = {
    id: books.length + 1,
    title: req.body.title
    };
    books.push(book);
    res.send(book);
});

// Demo code for https://shopify.dev/api/admin/rest/reference/shipping-and-fulfillment/carrierservice
const rate1 = [
    {
        "service_name": "ヤマト運輸",
        "service_code": "ヤマト運輸",
        "total_price": "39000",
        "description": "ヤマト宅急便",
        "currency": "JPY",
      //   "min_delivery_date": "2022-05-12 14:48:45 -0400",
      //   "max_delivery_date": "2022-05-12 14:48:45 -0400"
    },
];

//Xử lý trả về rate sau 
const rate2 = [
  {
        "service_name": "ヤマト運輸",
        "service_code": "ヤマト運輸",
        "total_price": "1000",
        "description": "ヤマト運輸",
        "currency": "JPY",
    },
    {
        "service_name": "ヤマト運輸",
        "service_code": "ヤマト運輸",
        "total_price": "12000",
        "description": "ヤマト運輸",
        "currency": "JPY",
    },
    {
      "service_name": "佐川",
      "service_code": "佐川",
      "total_price": "49000",
      "description": "佐川宅急便",
      "currency": "JPY",
      "min_delivery_date": "2023-02-17 14:48:45 -0400",
        "max_delivery_date": "2023-02-20 14:48:45 -0400",
  },
  {
      "service_name": "日本郵便",
      "service_code": "日本郵便",
      "total_price": "80000",
      "description": "日本郵便",
      "currency": "JPY",
  }
];
app.post('/carrier_service',  function (ctx, next){  
    console.log("+++++++++ /carrier_service ++++++++++");
    console.log(`${JSON.stringify(ctx.body)}`);
    //WRITE THE SHIPPING RATE CALC. HERE!
    /**
     * 
     * 
     * 
     * 
     * 
     * 
     * 
     */
    // const payload = JSON.stringify(ctx.body);
    // const {origin} = payload.rate
    consola.success(ctx.body?.rate?.destination?.postal_code);
    consola.success(ctx.body?.rate?.destination?.postal_code.includes("158"));
    const rates = ctx.body?.rate?.destination?.postal_code.includes("158") ? rate1: rate2 ;
    // const rates = rate2 ;
    ctx.body = JSON.stringify({rates})
    next.send(JSON.stringify({rates}));
});
     

app.get('/remote', (req,res)=> {
  res.send({data: "thuytt-remote-mac"});
  });

  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  }
  
  // // Example usage: Get a random integer between 1 and 10
  // const randomInteger = getRandomInt(1, 11); 
  function generateRandomName(length) {
    // const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const words = [
      "Lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", "sed", "do",
      "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore", "magna", "aliqua", "enim",
      "ad", "minim", "veniam", "quis", "nostrud", "exercitation", "ullamco", "laboris", "nisi", "aliquip",
      "commodo", "consequat", "duis", "aute", "irure", "reprehenderit", "voluptate", "velit", "esse", "cillum",
      "fugiat", "nulla", "pariatur", "excepteur", "sint", "occaecat", "cupidatat", "non", "proident", "sunt",
      "culpa", "qui", "officia", "deserunt", "mollit", "anim", "est", "laborum", "eveniet", "expedita", "distinctio",
      "provident", "voluptatem", "architecto", "sequi", "beatae", "aperiam", "ipsa", "nesciunt", "commodi", "tempora",
      "ratione", "culpa", "illum", "harum", "quae", "illo", "veritatis", "voluptas", "consequatur", "quisquam", "ducimus",
      "praesentium", "voluptatibus", "accusantium", "doloremque", "iure", "suscipit", "natus", "temporibus", "ipsam", "eligendi",
      "reiciendis", "repellendus", "saepe", "earum", "facere", "molestias", "corrupti", "quibusdam", "officiis", "debitis", "numquam",
      "ratione", "maxime", "placeat", "consequatur", "aut", "magnam", "recusandae", "asperiores", "aliquid", "provident", "odit",
      "facilis", "consectetuer", "lobortis", "pharetra", "diam", "tincidunt", "nisi", "fermentum", "et", "phasellus", "faucibus",
      "scelerisque", "eleifend", "donec", "pretium", "libero", "mauris", "eleifend", "aliquet", "tincidunt", "in", "magna", "id",
      "dui", "vivamus", "metus", "arcu", "adipiscing", "mollis", "massa", "vulputate", "aliquam", "gravida", "ornare", "ut", "egestas",
      "sapien", "vestibulum", "ante", "iaculis", "ac", "massa", "vitae", "metus", "quisque", "velit", "eget", "luctus", "dapibus", "et",
      "magnis", "dis", "parturient", "montes", "nascetur", "ridiculus", "mus", "sed", "quis", "augue", "quam", "nulla", "porttitor", "magna",
      "eu", "at", "auctor", "pellentesque", "habitant", "morbi", "tristique", "senectus", "netus", "et", "malesuada", "fames", "ac", "turpis",
      "egestas", "mauris", "pharetra", "et", "feugiat", "vitae", "ante", "nulla", "fringilla", "orci", "sed", "volutpat", "nulla", "vestibulum",
      "eu", "pede", "sit", "amet", "facilisi", "suspendisse", "dui", "nunc", "suspendisse", "non", "ligula", "pellentesque", "sollicitudin", "mauris",
      "a", "accumsan", "odio", "tempus", "quis", "odio", "vestibulum", "id", "ligula", "porttitor", "felis", "euismod", "semper", "orci", "phasellus",
      "venenatis", "metus", "vitae", "felis", "porta", "faucibus", "suspendisse", "aliquet", "augue", "sit", "amet", "nisl", "tempus", "convallis", "quis",
      "ac", "enim", "ut", "est", "nunc", "et", "quam", "etiam", "sed", "lacus", "quis", "erat", "felis", "pretium", "ornare", "dapibus", "lorem", "ipsum",
      "diam", "nulla", "commodo", "felis", "eget", "massa", "lacus", "nulla", "pede", "volutpat", "et", "ultrices", "vel", "augue", "quis", "massa",
      "vestibulum", "ante", "ipsum", "primis", "in", "faucibus", "orci", "luctus", "et", "ultrices", "posuere", "cubilia", "curae", "suspendisse",
      "sollicitudin", "vel", "augue", "quis", "iaculis", "donec", "ultrices", "ante", "sit", "amet", "augue", "in", "turpis", "pellentesque", "laoreet",
      "viverra", "id", "diam", "dignissim", "vivamus", "sit", "amet", "justo", "non", "ante", "commodo", "consectetuer", "id", "id", "ligula", "suspendisse",
      "in", "nunc", "metus", "porttitor", "pede", "quis", "amet", "eleifend", "lacus", "quisque", "in", "lectus", "sed", "libero", "eu", "felis", "aliquam",
      "ultricies", "mattis", "tellus", "donec", "suscipit", "lectus", "in", "metus", "viverra", "sit", "amet", "quam", "sagittis", "ipsum", "diam", "nec",
      "placerat", "imperdiet", "enim", "libero", "tincidunt", "dui", "finibus", "non", "imperdiet", "nisi", "maecenas", "egestas", "volutpat", "turpis", "nec",
      "euismod", "phasellus", "vestibulum", "lorem", "sed", "risus", "ultrices", "rhoncus", "proin", "velit", "enim", "lobortis", "id", "euismod", "tincidunt",
      "diam", "duis", "ac", "turpis", "ultricies", "sollicitudin", "phasellus", "ut", "sapien", "ac", "massa", "cursus", "porta", "sed", "eu", "leo", "nulla",
      "facilisi", "donec", "adipiscing", "donec", "eu", "vulputate", "tellus", "nulla", "nec", "turpis", "in", "tellus", "integer", "eu", "tempor", "mauris",
      "in", "volutpat", "nibh", "quisque", "a", "metus", "vestibulum", "at", "nibh", "ac", "tempus", "semper", "turpis", "pellentesque", "lobortis", "lacus",
      "quisque", "ultrices", "faucibus", "suspendisse", "potenti", "sed", "volutpat", "justo", "nec", "diam", "consectetur", "adipiscing", "elit", "duis",
      "tristique", "sollicitudin", "nibh", "sit", "amet", "commodo", "et", "volutpat", "sapien", "lorem", "ultrices", "magna", "et", "porta", "vestibulum",
      "tellus", "nullam", "consequat", "sem", "quis", "massa", "volutpat", "quisque", "id", "congue", "nisi", "vivamus", "non", "tincidunt", "urna", "cras",
      "dapibus", "mauris", "eget", "sapien", "cursus", "porttitor", "nisi", "eu", "posuere", "lectus", "duis", "semper", "velit", "sed", "placerat", "egestas",
      "duis", "ornare", "neque", "at", "scelerisque", "commodo", "nulla", "vestibulum", "tellus", "eu", "mi", "ullamcorper", "non", "auctor", "a", "metus",
      "nullam", "at", "nibh", "sit", "amet", "arcu", "tincidunt", "blandit", "sed", "etiam", "duis", "et", "iaculis", "dui", "in", "vitae", "turpis", "massa",
      "nullam", "vehicula", "ipsum", "a", "arcu", "cursus", "vitae", "consequat", "quis", "tellus", "nam", "accumsan", "mi", "a", "tellus", "porttitor", "accumsan",
      "pellentesque", "sed", "enim", "quisque", "mollis", "leo", "eget", "massa", "tempor", "blandit", "duis", "iaculis", "lobortis", "odio", "sit", "amet", "euismod",
      "mauris", "tristique", "vitae", "duis", "at", "consectetur", "lorem", "duis", "tristique", "velit", "nec", "vestibulum", "nulla", "libero", "aliquam", "dictumst",
      "vestibulum", "rhoncus", "est", "pellentesque", "elit", "ullamcorper", "diam", "dignissim", "arcu", "felis", "elementum", "eu", "volutpat", "odio", "facilisis",
      "mauris", "sed", "placerat", "dui", "non", "dolor", "convallis", "tincidunt", "duis", "ut", "diam", "quam", "nulla", "porttitor", "massa", "id", "neque", "aliquam",
      "vestibulum", "morbi", "blandit", "cursus", "risus", "at"]
      let loremText = '';
      const wordsCount = words.length;
    
      for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * wordsCount);
        loremText += words[randomIndex] + ' ';
      }
    //   let result = '';
    // const charsetLength = charset.length;
  
    // for (let i = 0; i < length; i++) {
    //   const randomIndex = Math.floor(Math.random() * charsetLength);
    //   result += charset.charAt(randomIndex);
    // }
  
    return loremText.trim();
  }
  app.get('/createDevice', (req,res)=> {
    for (let i = 0; i < 10; i++) {
      const randomName = generateRandomName(getRandomInt(1, 5)) ;
      console.log(randomName);
    }
    res.send({data: "success"});
    });

    
    function generateCrewSignature() {
      const clientSecret = "";
      const body = {
        "event_type": "onDeliveryRequestMatched",
        "id": 8122,
        "client_id": "jWkESBZxpvV7pfH7oatDNA1eB0pISgcC",
        "driver_name": "佐藤",
        "driver_phone_number": "08012345678",
        "pick_up_event_time_prediction": {
          "event_type": "pick_up",
          "original_prediction": "2023-03-12T10:20:55+09:00",
          "latest_prediction": "2023-03-12T10:20:55+09:00"
        },
        "finish_event_time_prediction": {
          "event_type": "finish",
          "original_prediction": "2023-03-12T10:20:55+09:00",
          "latest_prediction": "2023-03-12T10:20:55+09:00"
        }
      };
      // onDeliveryRequestMatched
      // onDeliveryRequestUndeliverable
      // onDeliveryRequestPickUped

     
      const timestamp = Math.floor(Date.now() / 1000);
      const dataToSign = `${timestamp}.${JSON.stringify(body)}`;
    
      const signature = crypto
        .createHmac('sha256', clientSecret)
        .update(dataToSign)
        .digest('hex');
    
      const crewSignature = `t=${timestamp},v1=${signature}`;
    
      return crewSignature;
    }
  app.get('/crewSignature', (req,res)=> {
    
    res.send({data: generateCrewSignature()});
    });


    
    
