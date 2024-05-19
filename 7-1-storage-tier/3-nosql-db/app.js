var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var port = 3011;
var db = 'mongodb://localhost/demo_7_1_storage_tier';

var books = require('./routes/books');

mongoose.connect(db);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use('/books', books);

app.get('/', function(req, res){
    console.log('app starting on port: '+port)
    res.send('tes express nodejs mongodb');
});

app.listen(port, function(){
    console.log('app listening on port: '+port);
});