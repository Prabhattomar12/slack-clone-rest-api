import mongoose from 'mongoose';

const channelSchema = mongoose.Schema({
  channelName: String,
  conversation: [
    {
      username: String,
      image: String,
      message: String,
      timestamp: String,
    },
  ],
});

export default mongoose.model('channels', channelSchema);
