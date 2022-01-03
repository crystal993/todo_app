const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

const MongoClient = require("mongodb").MongoClient;

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

app.post("/add", function (요청, 응답) {
  응답.send("전송완료");
  console.log(요청.body.title);
  console.log(요청.body.date);
  //db에 저장해주세요
  db.collection('post').insertOne({제목: 요청.body.title, 날짜: 요청.body.date }, function(에러,결과) {
      console.log('DB에 저장완료');
  });
});
