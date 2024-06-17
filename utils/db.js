const mongoose = require('mongoose');


module.exports = () => {
    mongoose.connect('mongodb://localhost:27017/tourist-app', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));
}
