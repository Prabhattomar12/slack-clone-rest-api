import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotEnv from 'dotenv';
import db from './dbModel.js';
import Pusher from 'pusher';

const app = express();
const PORT = process.env.PORT || 9000;
// app configs
dotEnv.config();

const pusher = new Pusher({
  appId: '1215913',
  key: '302c9f0c58825fb17d83',
  secret: '4a4c4e216b9f0c7e772d',
  cluster: 'ap2',
  useTLS: true,
});

// middlewares
app.use(express.json());
app.use(cors());

// db configs
const MONGO_DB_URI = process.env.MONGO_DB_URI;
mongoose.connect(MONGO_DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});

mongoose.connection.once('open', () => {
  console.log('DB Connected');
  // pusher trigger
  const changeStream = mongoose.connection.collection('channels').watch();
  changeStream.on('change', (change) => {
    if (change.operationType === 'insert') {
      // "my-channel", "my-event"
      pusher.trigger('channel', 'inserted', {
        change: change,
      });
    } else if (change.operationType == 'update') {
      pusher.trigger('conversation', 'updated', {
        change: change,
      });
    } else {
      console.log('Error triggering pusher');
    }
  });
});
// routes
app.get('/', (req, res) => res.status(200).send('API IS LIVE.'));

app.post('/add/newChannel', (req, res) => {
  const newChannelName = req.body;

  db.create(newChannelName, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});

app.get('/get/channelList', (req, res) => {
  db.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      let channelList = [];
      data.map((item) => {
        let channel = {
          id: item._id,
          channelName: item.channelName,
        };
        channelList.push(channel);
      });
      res.status(200).send(channelList);
    }
  });
});

app.post('/add/newMessage', (req, res) => {
  const newMessage = req.body;

  db.updateOne(
    { _id: req.query.id },
    { $push: { conversation: newMessage } },
    (err, data) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.status(201).send(data);
      }
    }
  );
});

app.get('/get/conversation', (req, res) => {
  db.findOne({ _id: req.query.id }, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

// listen
app.listen(PORT, () => console.log(`Server is running at port : ${PORT}`));
