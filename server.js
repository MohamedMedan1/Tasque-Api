const mongoose = require('mongoose');
const app = require('./app');

const DB = `mongodb+srv://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@cluster0.ivvffrv.mongodb.net/`;

mongoose.connect(DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(()=>console.log('DB Connected Successfully!'));


const PORT = process.env.PORT || 8000
app.listen(PORT, () => {
  console.log('Server is running now!');
});
