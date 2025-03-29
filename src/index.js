const express = require("express");
const dotenv = require('dotenv');
const { default: mongoose } = require("mongoose");
dotenv.config()

const app = express()
const port = process.env.PORT || 3001

app.get('/', (req, res) => {
    return res.send('Hello, world! Bonjour');
})

mongoose.connect(`mongodb+srv://21521942:${process.env.MONGO_DB}@master.uqz2k.mongodb.net/?retryWrites=true&w=majority&appName=Master`)
.then(() => {
    console.log('Connect to Db success!')
})
.catch((err) => {
    console.log(err)
})

app.listen(port, () => {
    console.log('Server is running in port ' + port);
});