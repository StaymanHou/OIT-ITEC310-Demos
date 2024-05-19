Source: https://github.com/masfranzhuo/mongoose-express-CRUD/tree/master

# Node.js mongoose express CRUD
Node.js CRUD application based on the MongoDB database design and Express.js framework

This Node.js CRUD code use 
- Express.js framework
- mongoose ORM

First start MongoDB. `sudo mongod --fork --logpath /var/log/mongodb/main.log`

```
npm install
```

To start the dev server, run `node app.js`. Visit http:127.0.0.1:3011 . Because this is a purely API endpoint with no frontend, To send a POST request, you can use tools such [Postman](https://www.postman.com/)

### Note:

Create collection name 'books' on 'example' database at MongoDB
```
use example
```
```
db.createCollection("books")
```
