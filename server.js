const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

const MongoClient = require("mongodb").MongoClient;

app.set('view engine','ejs');

MongoClient.connect(
  "mongodb+srv://admin:admin1234@cluster0.ir1mp.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",
  function (에러, client) {
    //연결되면 할 일
    if (에러) return console.log(에러);

    db = client.db("todoapp");

    app.listen(8080, function () {
      console.log("listening on 8080");
    });
  }
);

// /pet에 방문하면 관련된 안내문 출력
app.get("/pet", function (요청, 응답) {
  응답.send("펫 용품 쇼핑할 수 있는 페이지입니다.");
});

app.get("/beauty", function (요청, 응답) {
  응답.send("뷰티 용품 쇼핑할 수 있는 페이지입니다.");
});

app.get("/", function (요청, 응답) {
  응답.sendFile(__dirname + "/index.html");
});

app.get("/write", function (요청, 응답) {
  응답.sendFile(__dirname + "/write.html");
});

// 게시글 등록
app.post("/add", function (요청, 응답) {
  응답.send("전송완료");
  console.log(요청.body.title);
  console.log(요청.body.date);

  db.collection('counter').findOne({name : '게시물 갯수'},function(에러,결과){
    console.log(결과.totalPost);
    var 총게시물갯수 = 결과.totalPost;

    //db에 저장
    db.collection('post').insertOne({_id : 총게시물갯수 + 1, 제목: 요청.body.title, 날짜: 요청.body.date }, function(에러,결과) {
        console.log('DB에 저장완료');
    });
  });

});



// 게시글 출력
app.get('/list', function(요청,응답){
    
    db.collection('post').find().toArray(function(에러, 결과){
        console.log(결과);
        응답.render('list.ejs', { posts : 결과 });
    });
    
    //db에 저장된 post라는 이름을 가진 collection 안의 모든 데이터를 꺼내기.

});