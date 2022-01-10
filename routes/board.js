var router = require("express").Router();

router.use("/", loginCheck);

// 로그인 여부 체크
function loginCheck(request, response, next) {
  if (request.user) {
    //request.user가 있으면 next() 통과
    next();
  } else {
    //request.user가 없으면 경고메세지
    response.redirect("/login");
  }
}

// 게시글 등록 페이지
router.get("/write", function (request, response) {
  response.render("write.ejs", { isAuthenticated: request.isAuthenticated() });
});

// 게시글 등록
router.post("/add", function (request, response) {
  // 참고 : response.send()이 부분은 없으면 브라우저 멈춤
  // 실패하든 성공하든 무조건 무언가 보내줘야 함.
  response.send("등록 성공");
  console.log(request.body.title);
  console.log(request.body.date);

  //1. db에 counter컬렉션에 현재 총 게시물 갯수 데이터 찾아오기
  db.collection("counter").findOne(
    { name: "게시물 갯수" },
    function (error, result) {
      console.log(result.totalPost);
      var 총게시물갯수 = result.totalPost;

      var posts = {
        _id: 총게시물갯수 + 1,
        작성자: request.user.id,
        제목: request.body.title,
        날짜: request.body.date,
      };

      //2. db에 todo id,제목,날짜 저장
      db.collection("post").insertOne(posts, function (error, result) {
        console.log("DB에 저장완료");

        //3. db에 counter 컬렉션에 총 게시물 갯수 1씩 증가
        db.collection("counter").updateOne(
          { name: "게시물 갯수" },
          { $inc: { totalPost: 1 } },
          function (error, result) {
            if (error) {
              return console.log(error);
            }
          }
        );
      });
    }
  );
});

// 게시글 리스트
//db에 저장된 post라는 이름을 가진 collection 안의 모든 데이터를 보여주기
// ejs파일로 보내줘야한다. 그냥 html파일만 보내주면 static페이지임.
router.get("/list", function (request, response) {
  // 1. post 콜렉션에 저장된 모든 데이터를 Array자료형으로 가져온다.
  db.collection("post")
    .find()
    .toArray(function (error, result) {
      console.log(result);
      // console.log(request.body._id);
      // console.log(result[0].작성자);

      // 2. result라는 데이터를 posts 라는 이름으로 list.ejs 파일에 보낸다.
      response.render("list.ejs", { posts: result });
    });
});

//게시글 삭제
router.delete("/delete", function (request, response) {
  console.log(request.body);

  // 문자열을 숫자로 변환
  request.body._id = parseInt(request.body._id);

  // 삭제할 데이터
  var removeData = { _id: request.body._id, 작성자: request.user._id };

  // 삭제
  db.collection("post").deleteOne(removeData, function (error, result) {
    console.log("삭제완료");
    if (error) {
      console.log(error);
    }
    //response코드가 성공하면 200
    response.status(200).send({ message: "성공했습니다" });
  });
});

//상세페이지
//detail로 접속하면 detail.ejs 보여줌
//detail2로 접속하면 detail2.ejs 보여줌
router.get("/detail/:id", function (request, response) {
  db.collection("post").findOne(
    { _id: parseInt(request.params.id) },
    function (error, result) {
      console.log(result);
      response.render("detail.ejs", {
        data: result,
        isAuthenticated: request.isAuthenticated(),
      });
    }
  );
});

//게시글 수정 페이지
router.get("/edit/:id", function (request, response) {
  db.collection("post").findOne(
    { _id: parseInt(request.params.id) },
    function (error, result) {
      console.log(result);
      response.render("edit.ejs", {
        data: result,
        isAuthenticated: request.isAuthenticated(),
      });
    }
  );
});

// 게시글 수정1 - put요청으로 수정하는 방법
// 라이브러리 설치 npm install method-override
router.put("/edit", function (request, response) {
  //폼에 담긴 제목, 날짜 데이터를 수정
  db.collection("post").updateOne(
    { _id: parseInt(request.body.id) },
    { $set: { 제목: request.body.title, 날짜: request.body.date } },
    function (error, result) {
      console.log("수정완료");
      response.render("list.ejs", {
        isAuthenticated: request.isAuthenticated(),
      });
    }
  );
});

// 게시글 수정2 - post요청으로 수정하는 방법
// router.post("/edit/:id", function (request, response) {
//   //게시글 내용 db에 수정
//   db.collection("post").updateOne(
//     { _id: parseInt(request.params.id) },
//     {
//       $set: { 제목: request.body.title, 날짜: request.body.date },
//       function(error, result) {
//         if (error) {
//           console.log(error);
//         }
//          response.redirect('/list');
//       },
//     }
//   );

//   // response.redirect('/list');쓰면 밑에 과정 생략가능
//   //수정한 데이터 가져오기
//   db.collection("post")
//     .find()
//     .toArray(function (error, result) {
//       response.render("list.ejs", {posts: result});
//     });

// });

// 검색 기능
router.get("/search", (request, response) => {
  // mongo DB에서 생성한 SERACH INDEX 에서 찾을 검색조건
  var searchCondition = [
    {
      $search: {
        index: "titleSearch",
        text: {
          query: request.query.value,
          path: "제목", // 제목날짜 둘다 찾고 싶으면 ['제목', '날짜']
        },
      },
    },
    { $sort: { _id: -1 } }, // id 1은 오름차순, -1은 내림차순
    {
      $limit: 10, //상위 10개만 가져옴
    },
  ];

  db.collection("post")
    .aggregate(searchCondition)
    .toArray((error, result) => {
      console.log(result);
      response.render("serchResult.ejs", { posts: result });
    });
});

module.exports = router;
