const express = require('express');
const mongoose = require('mongoose');
const app = express();
//var router=require('./router/Beds')
const bodyParser = require('body-parser');
mongoose.set('strictQuery',false)
const url = "mongodb://127.0.0.1:27017/Beds";

mongoose.connect(url,{useNewUrlParser:true})
const con = mongoose.connection

con.on('open',()=>{
    console.log('connected.......');
})

app.use(express.json())
app.use(bodyParser.json())

const alienrouter = require('./router/Beds');
const atrouter=require('./router/Dash')
app.use('/',alienrouter);
app.use('/',atrouter);
//app.use(router)

app.listen(9000,()=>{
    console.log('Server is running');
})
