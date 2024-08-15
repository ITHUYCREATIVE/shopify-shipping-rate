const express = require('express');
const app = express();
const consola = require('consola'); 
// const fetch = require('node-fetch');
const cookieParser = require('cookie-parser');
const cors = require('cors');

app.use(cookieParser());
app.use(cors());
app.listen(3000, () => {
     consola.success(`Server running on port 3000!!!`);
});

const CLIENT_KEY = 'awhm583l5s52pl22' // this value can be found in app's developer portal
const SERVER_ENDPOINT_REDIRECT = 'https://web.licorice.pink/'
app.get('/oauth', (req, res) => {
    const csrfState = Math.random().toString(36).substring(2);
    res.cookie('csrfState', csrfState, { maxAge: 60000 });

    let url = 'https://www.tiktok.com/v2/auth/authorize/';

    // the following params need to be in `application/x-www-form-urlencoded` format.
    url += '?client_key=' + CLIENT_KEY;
    url += '&scope=user.info.basic,user.info.profile,user.info.stats';
    url += '&response_type=code';
    url += '&redirect_uri=' + SERVER_ENDPOINT_REDIRECT;
    consola.success(url);
    res.redirect(url);
})

