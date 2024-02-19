require('dotenv').config();
let mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const express = require('express');
const cors = require('cors');
const app = express();
let bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
})
let currentUrl;

const urlSchema = new mongoose.Schema({
  original_url: {
    type: String,
    required: true
  },
  short_url: {
    type: String,
    required: true
  }
});
let url = mongoose.model('url', urlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.post('/api/shorturl', async (req, res) => {
  let search = await url.findOne({original_url: req.body.url});
  //If entry exists, return it from the database
  if (search)
  {
    currentUrl = search;
    res.json({
      original_url: currentUrl.original_url,
      short_url: currentUrl.short_url });
    console.log("test");
  }
  else { //Otherwise create new entry in database
    currentUrl = new url({
      original_url: req.body.url,
      short_url: Math.floor(Math.random() * 1000)
    })
    //If the random function happens to return an already existing short_url, generate another until a unique one is created
    while (await url.findOne({short_url: currentUrl.short_url})) {
      currentUrl.short_url = Math.floor(Math.random() * 1000);
    }
    await currentUrl.save();
    console.log(currentUrl);
    res.json({
      original_url: currentUrl.original_url,
      short_url: currentUrl.short_url 
    });
    console.log("test");
  }
})
app.get('/api/shorturl', (req, res) => {
  res.json({ original_url: currentUrl.original_url, short_url: currentUrl.short_url });
});

app.route('/api/shorturl/:short_url').get(async (req, res) => {
  shortUrl = req.params.short_url;
  redirectUrl = await url.findOne({short_url: shortUrl})
  if (redirectUrl) {
    res.redirect(redirectUrl.original_url);
  }
  else {
    res.json({"error": "invalid url"})
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
