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

// 패스워드 암호화 bcrypt
// npm install bcrypt
const bcrypt = require("bcrypt");

MongoClient.connect(process.env.DB_URL, function (에러, client) {
  //연결되면 할 일
  if (에러) return console.log(에러);

  db = client.db("todoapp");

  app.listen(process.env.PORT, function () {
    console.log("listening on 8080");
  });
});

//1 - 로그인
const passport = require("passport");
const LocalStrategy = require("passport-local");
const session = require("express-session");

//2 - 로그인을 하기 위해서 필요
app.use(
  session({ secret: "비밀코드", resave: true, saveUninitialized: false })
);

// Passport // 3 - 로그인
app.use(passport.initialize());
app.use(passport.session());

// Custom Middlewares // 4 - 로그인
// 로그인한 회원의 접근 권한을 주기 위한 변수 
// 전역변수로 선언
app.use(function (request, response, next) {
  response.locals.isAuthenticated = request.isAuthenticated();
  response.locals.currentUser = request.user;
  next();
});

//login 페이지 //1
app.get("/login", function (요청, 응답) {
  응답.render("login.ejs");
});

//login 기능 //2
app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/fail",
  }),
  function (요청, 응답) {
    console.log(요청.user._id);
    응답.render('index.ejs',{isAuthenticated:요청.isAuthenticated()});
  }
);

// 마이페이지에 접속 - 회원만
app.get("/mypage", loginCheck, function (request, response) {
  console.log(request.user);
  response.render("myPage.ejs", { 사용자: request.user, isAuthenticated:request.isAuthenticated() });
});

// 로그인 여부 체크
function loginCheck(request, response, next) {
  if (request.user) {
    //request.user가 있으면 next() 통과
    next();
  } else {
    //request.user가 없으면 경고메세지
    response.send("로그인 안 하셨는데요??");
  }
}

// 아이디/비번 DB와 맞는지 비교
// LocalStrategy 인증 방식
passport.use(
  new LocalStrategy(
    {
      usernameField: "id",
      passwordField: "pw",
      session: true, // 세션에 저장하는지 여부
      passReqToCallback: false, // 아이디/비번 말고도 다른 정보 검증시에 true
    },
    function (입력한아이디, 입력한비번, done) {
      // 이 부분은 아이디와 비밀번호를 검증하는 부분
      // console.log(입력한아이디, 입력한비번);
      db.collection("login").findOne(
        { id: 입력한아이디 },
        function (에러, 결과) {
          if (에러) return done(에러);

          if (!결과)
            return done(null, false, { message: "존재하지않는 아이디요" });

          //console.log(bcrypt.compareSync(입력한비번,결과.pw));   : 암호화한 pw와 입력한 비번 비교
          if (bcrypt.compareSync(입력한비번, 결과.pw)) {
            return done(null, 결과);
          } else {
            return done(null, false, { message: "비번틀렸어요" });
          }
        }
      );
    }
  )
);

//세션 만들고 세션아이디 발급해서 쿠키로 보내주기
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

//로그인한 유저의 개인 정보를 db에서 찾는 역할
passport.deserializeUser(function (아이디, done) {
  //db에서 위에 있는 user.id를 유저를 찾은 뒤에 유저정보를
  // done(null, {여기에 넣는다})
  db.collection("login").findOne({ id: 아이디 }, function (에러, 결과) {
    done(null, 결과);
  });
});


//로그아웃 
app.get('/logout', function(request,response){
  request.logout();
  response.render('index.ejs',{isAuthenticated:request.isAuthenticated()});
});

// /pet에 방문하면 관련된 안내문 출력
app.get("/pet", function (요청, 응답) {
  응답.send("펫 용품 쇼핑할 수 있는 페이지입니다.");
});

app.get("/beauty", function (요청, 응답) {
  응답.send("뷰티 용품 쇼핑할 수 있는 페이지입니다.");
});

app.get("/", function (요청, 응답) {
  응답.render("index.ejs",{isAuthenticated:요청.isAuthenticated()});
});

app.get("/write", function (요청, 응답) {
  응답.render("write.ejs",{isAuthenticated:요청.isAuthenticated()});
});

// 게시글 등록
app.post("/add", function (요청, 응답) {
  // 참고 : 응답.send()이 부분은 없으면 브라우저 멈춤
  // 실패하든 성공하든 무조건 무언가 보내줘야 함.
  응답.send("등록 성공");
  console.log(요청.body.title);
  console.log(요청.body.date);

  //1. db에 counter컬렉션에 현재 총 게시물 갯수 데이터 찾아오기
  db.collection("counter").findOne(
    { name: "게시물 갯수" },
    function (에러, 결과) {
      console.log(결과.totalPost);
      var 총게시물갯수 = 결과.totalPost;
      
      var posts =  { _id: 총게시물갯수 + 1, 작성자: 요청.user.id, 제목: 요청.body.title, 날짜: 요청.body.date  };

      //2. db에 todo id,제목,날짜 저장
      db.collection("post").insertOne(
        posts,
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
      // console.log(요청.body._id); 
      // console.log(결과[0].작성자); 

      // 2. 결과라는 데이터를 posts 라는 이름으로 list.ejs 파일에 보낸다.
      응답.render("list.ejs", { posts: 결과});
    });
});

//게시글 삭제
app.delete("/delete", function (요청, 응답) {
  console.log(요청.body);

  // 문자열을 숫자로 변환
  요청.body._id = parseInt(요청.body._id);

  // 삭제할 데이터
  var removeData = { _id : 요청.body._id, 작성자 : 요청.user._id}

  // 삭제
  db.collection("post").deleteOne(removeData, function (에러, 결과) {
    console.log("삭제완료");
    if(에러) {console.log(에러);}
    //응답코드가 성공하면 200
    응답.status(200).send({ message: "성공했습니다"});
  });
});

//상세페이지
//detail로 접속하면 detail.ejs 보여줌
//detail2로 접속하면 detail2.ejs 보여줌
app.get("/detail/:id", function (요청, 응답) {
  db.collection("post").findOne(
    { _id: parseInt(요청.params.id) },
    function (에러, 결과) {
      console.log(결과);
      응답.render("detail.ejs", { data: 결과, isAuthenticated:요청.isAuthenticated() });
    }
  );
});

//게시글 수정 페이지
app.get("/edit/:id", function (요청, 응답) {
  db.collection("post").findOne(
    { _id: parseInt(요청.params.id) },
    function (에러, 결과) {
      console.log(결과);
      응답.render("edit.ejs", { data: 결과, isAuthenticated:요청.isAuthenticated() });
    }
  );
});

// 게시글 수정1 - put요청으로 수정하는 방법
// 라이브러리 설치 npm install method-override
app.put("/edit", function (요청, 응답) {
  //폼에 담긴 제목, 날짜 데이터를 수정
  db.collection("post").updateOne(
    { _id: parseInt(요청.body.id) },
    { $set: { 제목: 요청.body.title, 날짜: 요청.body.date } },
    function (에러, 결과) {
      console.log("수정완료");
      응답.render("list.ejs", {isAuthenticated:요청.isAuthenticated()});
    }
  );
});

// 게시글 수정2 - post요청으로 수정하는 방법
// app.post("/edit/:id", function (요청, 응답) {
//   //게시글 내용 db에 수정
//   db.collection("post").updateOne(
//     { _id: parseInt(요청.params.id) },
//     {
//       $set: { 제목: 요청.body.title, 날짜: 요청.body.date },
//       function(에러, 결과) {
//         if (에러) {
//           console.log(에러);
//         }
//          응답.redirect('/list');
//       },
//     }
//   );

//   // 응답.redirect('/list');쓰면 밑에 과정 생략가능
//   //수정한 데이터 가져오기
//   db.collection("post")
//     .find()
//     .toArray(function (에러, 결과) {
//       응답.render("list.ejs", {posts: 결과});
//     });

// });





//회원가입 페이지
app.get("/signup", function (request, response) {
  response.render("sign_up.ejs");
});

//회원가입
app.post("/signup", function (request, response) {
  //1. 저장 전에 아이디 중복 되는지 
  //2. 아이디 형식이 맞는지 
  //3. 패스워드 암호화 bcrypt.hashSync
  let encryptedPassowrd = bcrypt.hashSync(request.body.pw, 10); // sync, hashSync

  db.collection("login").insertOne(
    {
      id: request.body.id,
      pw: encryptedPassowrd,
      address: request.body.address,
    },
    function (error, result) {
      // console.log('id:',request.body.id);
      // console.log('pw:',request.body.pw);
      // console.log('address:',request.body.address);
      response.redirect("/login");
    }
  );
});

// 검색 기능
app.get('/search', (request, response) => {
  
  // mongo DB에서 생성한 SERACH INDEX 에서 찾을 검색조건 
  var searchCondition = [
    {
      $search: {
        index: 'titleSearch',
        text: {
          query: request.query.value,
          path: '제목'  // 제목날짜 둘다 찾고 싶으면 ['제목', '날짜']
        }
      }
    },
    { $sort : { _id : -1} }, // id 1은 오름차순, -1은 내림차순
    { $limit : 10 //상위 10개만 가져옴
    } 
] 

  db.collection('post').aggregate(searchCondition).toArray((error,result)=>{
    console.log(result);
    response.render('serchResult.ejs', { posts: result });
  });
});