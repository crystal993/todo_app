const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

const MongoClient = require("mongodb").MongoClient;
const { render } = require("express/lib/response");

app.set("view engine", "ejs");

app.use("/public", express.static("public"));

const methodOverride = require("method-override");
app.use(methodOverride("_method"));

// .env 환경 설정에 필요함
require("dotenv").config();

MongoClient.connect(process.env.DB_URL, function (error, client) {
  //연결되면 할 일
  if (error) return console.log(error);

  db = client.db("todoapp");

  app.listen(process.env.PORT, function () {
    console.log("listening on 8080");
  });
});

// app.use() : 미들웨어 
//미들웨어 : 요청과 응답사이에 실행되는 코드
//아이디, 회원가입 
app.use(require('./routes/member.js'));

//index페이지
app.get("/", function (요청, 응답) {
  응답.render("index.ejs");
});

// app.use() : 미들웨어 
//미들웨어 : 요청과 응답사이에 실행되는 코드
app.use('/shop', require('./routes/shop.js'));
app.use('/', require('./routes/board.js'));
app.use('/', require('./routes/chat.js'));

//업로드 페이지로 이동
app.get('/upload', function(request,response){
  response.render('upload.ejs');
})

// multer를 이용한 이미지 하드에 저장하기
// npm install multer
let multer = require('multer');
var storage = multer.diskStorage({
  // 이미지 업로드한 곳의 경로
  destination : function(req, file, cb){
    cb(null, './public/image');
  },
  // 저장한 이미지의 파일명 설정하는 부분
  filename : function(req, file, cb){
    cb(null, file.originalname);
  }
});

var upload = multer({storage: storage});

app.post('/upload', upload.single('profile'), function(request, response){
  response.send('업로드완료');
});

app.get('/image/:imageName', function(request, response){
  response.sendFile( __dirname + '/public/image' + request.params.imageName);
});

