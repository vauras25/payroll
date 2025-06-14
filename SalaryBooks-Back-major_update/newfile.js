const http = require("http");
var express = require('express')
var multer = require('multer');
// var storage =   multer.diskStorage({
//   destination: function (req, file, callback) {
//     callback(null, './storage/admin/profile');
//   },
//   filename: function (req, file, callback) {
//     callback(null, file.fieldname + '-' + Date.now()+'.png');
//   }
// });

// upload = multer({ storage: storage });
var upload = multer();
var cors = require('cors')
//const bodyParser = require('body-parser');

var db = require('./db');
var AuthController = require('./Controller/AuthController');
var middleware = require('./Middleware/middleware');

var app = express()
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
app.use(upload.any()); 
app.use(express.static('public'));
const hostname = '127.0.0.1';
const port = 7777;
const basepath ='';


// const server = http.createServer((req, res) => {
//   res.statusCode = 200;
//   res.setHeader('Content-Type', 'text/plain');
//   res.end('Hello World\n');
// });
app.post(basepath+'/admin_signin', AuthController.admin_signin);
app.post(basepath+'/admin_token_check', AuthController.admin_token_check);
app.use(basepath+'/admin', middleware.checkAuth,middleware.authUserType(['super_admin']), require('./Routes/admin'));
app.get(basepath+'/', function (req, res) {
    res.send('Hello World!')
})
app.get(basepath+'/test', function (req, res) {
    res.send('Hello World3!')
})
app.get(basepath+'*', function(req, res){
  res.status(404).send({ status: 'error', message: 'Page Not Found' });
});
app.post(basepath+'*', function(req, res){
  res.status(404).send({ status: 'error', message: 'Page Not Found' });
});
//listen for request on port 3000, and as a callback function have the port listened on logged
app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});