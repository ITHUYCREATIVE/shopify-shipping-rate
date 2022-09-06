'use strict';
// const Shopify =require('@shopify/shopify-api');
// const dotenv = require('dotenv');
// dotenv.config();
const express = require("express");
const app = express();
const consola = require('consola'); 
app.use(express.json());


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

app.listen(3000, () => {
//  console.log("Server running on port 3000");
 consola.success(`Server running on port 3000!!!`);
});

app.get("/test", (req, res, next) => {
    res.json(["Tony","Lisa","Michael","Ginger","Food"]);
});

app.get('/api/books', (req,res)=> {
    res.send(books);
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
        "service_name": "ヤマト",
        "service_code": "ヤマト",
        "total_price": "39000",
        "description": "ヤマト宅急便",
        "currency": "JPY",
      //   "min_delivery_date": "2022-05-12 14:48:45 -0400",
      //   "max_delivery_date": "2022-05-12 14:48:45 -0400"
    },
];

const rate2 = [
    {
          "service_name": "ヤマト",
          "service_code": "ヤマト",
          "total_price": "39000",
          "description": "ヤマト宅急便",
          "currency": "JPY",
        //   "min_delivery_date": "2022-05-12 14:48:45 -0400",
        //   "max_delivery_date": "2022-05-12 14:48:45 -0400"
      },
      {
        "service_name": "佐川",
        "service_code": "佐川",
        "total_price": "49000",
        "description": "佐川宅急便",
        "currency": "JPY",
        // "min_delivery_date": "2022-05-12 14:48:45 -0400",
        // "max_delivery_date": "2022-05-12 14:48:45 -0400"
    },
    {
        "service_name": "その他",
        "service_code": "その他",
        "total_price": "80000",
        "description": "その他",
        "currency": "JPY",
        // "min_delivery_date": "2022-05-12 14:48:45 -0400",
        // "max_delivery_date": "2022-05-12 14:48:45 -0400"
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
     
     