const express = require("express");
const app = express();

// 양방향 소켓 통신이 가능
const http = require('http').createServer(app);
const { Server } = require("socket.io");
const io = new Server(http);

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


// 서버 띄우는 부분
MongoClient.connect(process.env.DB_URL, function (error, client) {
  //연결되면 할 일
  if (error) return console.log(error);

  db = client.db("todoapp");

  http.listen(process.env.PORT, function () {
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

// 채팅기능
// 1. 웹소켓 페이지로 접속
app.get('/socket', function(request, response){
  console.log("웹소켓페이지 접속"+request.user._id);
  db.collection("chatroom").find({member: request.user._id}).toArray().then((result)=>{
    result.curUser = request.user._id;
    response.render("socket.ejs", {data : result});
  });
});

// 2. 웹소켓 접속시 채팅 기능
io.on('connection', function(socket){

  let curChatRoom;

  // 3. 채팅방 만들기 
  // socket.join(방이름)
  socket.on('join-room', function(data){
    curChatRoom = data;
    console.log(curChatRoom + '접속됨');
    socket.join(curChatRoom);
  });

  // 4. 현재 채팅방에서 메세지 전송
  socket.on('room-send', function(data){
    console.log(data);
    io.to(curChatRoom).emit('broadcast', {
      msg : data.msg, 
      userId : data.curUser,
      msgTime : data.msgTime
    });
    
  });

  // // 서버가 유저가 보낸 메세지를 수신
  // // socket.on(작명, 콜백함수)
  // // 유저가 user-send이름으로 메세지를 보내면 내부코드 실행
  // socket.on('user-send', function(userData){
    // // console.log(socket.id);

    // // 서버가 다시 유저에게 보내는 메세지
    // // io.emmit은 이 사이트 접속한 모든 사람한테 보내준다. => boradcast
    // io.emit('broadcast', userData);

    //서버-유저1명간의 소통 - 나한테만, 1:1채팅도 만들 수 있다.
    //io.to(socket.id).emit('broadcast', userData);
  // });

});