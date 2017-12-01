const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const shortUrl = require('./models/shortUrl');

app.use(bodyParser.json());
app.use(cors());

// Connect to the database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/shortUrls');

// Allow node to find static content
app.use(express.static(__dirname + '/public'));

app.get('/new/:urlToShorten(*)', (req, res, next) => {
  const { urlToShorten } = req.params;
  // Regex for url
  let regex = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;

  // String entered is valid URL
  if (regex.test(urlToShorten) === true) {
    const short = Math.floor(Math.random() * 100000).toString();

    // JSON data to send back to user
    let data = new shortUrl({
      originalUrl: urlToShorten,
      shorterUrl: short
    });

    // Save in database
    data.save(err => {
      if (err) {
        return res.send('Error saving to database');
      }
    });
    // Send back JSON data
    return res.json(data);

    // String entered is invalid URL
  } else {
    let data = new shortUrl({
      originalUrl: urlToShorten,
      shorterUrl: 'InvalidUrl'
    });
    return res.json(data);
  }
});

// Query database and forward to originalUrl
app.get('/:urlToForward', (req, res, next) => {
  const { urlToForward } = req.params;

  shortUrl.findOne({ shorterUrl: urlToForward }, (err, data) => {
    if (err) {
      return res.send('Error reading database');
    }

    let regex = new RegExp('^(http|https)://', 'i');
    const stringToCheck = data.originalUrl;
    if (regex.test(stringToCheck)) {
      res.redirect(301, data.originalUrl);
    } else {
      res.redirect(301, 'http://' + data.originalUrl);
    }
  });
});

app.listen(process.env.PORT || 3000, () => console.log('server running'));
