const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

const MongoClient = require("mongodb").MongoClient;

app.set("view engine", "ejs");

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
  // 참고 : 응답.send()이 부분은 없으면 브라우저 멈춤
  // 실패하든 성공하든 무조건 무언가 보내줘야 함.
  응답.send("전송완료");
  console.log(요청.body.title);
  console.log(요청.body.date);

  //1. db에 counter컬렉션에 현재 총 게시물 갯수 데이터 찾아오기
  db.collection("counter").findOne(
    { name: "게시물 갯수" },
    function (에러, 결과) {
      console.log(결과.totalPost);
      var 총게시물갯수 = 결과.totalPost;

      //2. db에 todo id,제목,날짜 저장
      db.collection("post").insertOne(
        { _id: 총게시물갯수 + 1, 제목: 요청.body.title, 날짜: 요청.body.date },
        function (에러, 결과) {
          console.log("DB에 저장완료");

          //3. db에 counter 컬렉션에 총 게시물 갯수 1씩 증가
          db.collection("counter").updateOne(
            { name: "게시물 갯수" },
            { $inc: { totalPost: 1 } },
            function (에러, 결과) {
              if (에러) {
                return console.log(에러);
              }
            }
          );
        }
      );
    }
  );
});

// 게시글 리스트
//db에 저장된 post라는 이름을 가진 collection 안의 모든 데이터를 보여주기
// ejs파일로 보내줘야한다. 그냥 html파일만 보내주면 static페이지임.
app.get("/list", function (요청, 응답) {

  // 1. post 콜렉션에 저장된 모든 데이터를 Array자료형으로 가져온다.
  db.collection("post")
    .find()
    .toArray(function (에러, 결과) {
      console.log(결과);

      // 2. 결과라는 데이터를 posts 라는 이름으로 list.ejs 파일에 보낸다.
      응답.render("list.ejs", { posts: 결과 });
    });
  
});

//게시글 삭제
app.delete("/delete", function(요청, 응답){
  console.log(요청.body);

  // 문자열을 숫자로 변환
  요청.body._id = parseInt(요청.body._id);
  
  // 삭제
  db.collection('post').deleteOne(요청.body,function(에러,결과){
    console.log('삭제완료');

    //응답코드가 성공하면 200
    응답.status(200).send({message: '성공했습니다'});
  })
})
