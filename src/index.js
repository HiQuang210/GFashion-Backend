const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const routes = require("./routes");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const cors = require("cors");
const startOrderChangeStream = require("./changeStreams/orderChangeStream");

dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(cors());

app.get("/", (req, res) => {
  return res.send("Hello, world! Bonjour");
});

app.use(bodyParser.json());
app.use(cookieParser());
routes(app);

mongoose
  .connect(`${process.env.MONGO_DB}`)
  .then(() => {
    startOrderChangeStream();
    console.log("Connect to Db success!");
  })
  .catch((err) => {
    console.log(err);
  });

app.listen(port, () => {
  console.log("Server is running in port " + port);
});
