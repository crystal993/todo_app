var router = require("express").Router();

// 패스워드 암호화 bcrypt
// npm install bcrypt
const bcrypt = require("bcrypt");

//1 - 로그인
const passport = require("passport");
const LocalStrategy = require("passport-local");
const session = require("express-session");
const { request } = require("express");

//2 - 로그인을 하기 위해서 필요
router.use(
  session({ secret: "비밀코드", resave: true, saveUninitialized: false })
);

// Passport // 3 - 로그인
router.use(passport.initialize());
router.use(passport.session());

// Custom Middlewares // 4 - 로그인
// 로그인한 회원의 접근 권한을 주기 위한 변수 - 전역변수로 선언
router.use(function (request, response, next) {
  response.locals.isAuthenticated = request.isAuthenticated();
  response.locals.currentUser = request.user;
  next();
});

//login 페이지 //1
router.get("/login", function (request, response) {
  response.render("login.ejs");
});

//login 기능 //2
router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/fail",
  }),
  function (request, response) {
    console.log(request.user._id);
    response.render("index.ejs");
  }
);

// 마이페이지에 접속 - 회원만
router.get("/mypage", loginCheck, function (request, response) {
  console.log(request.user);
  response.render("myPage.ejs", { 사용자: request.user });
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
        function (error, result) {
          if (error) return done(error);

          if (!result)
            return done(null, false, { message: "존재하지않는 아이디요" });

          //console.log(bcrypt.compareSync(입력한비번,result.pw));   : 암호화한 pw와 입력한 비번 비교
          if (bcrypt.compareSync(입력한비번, result.pw)) {
            return done(null, result);
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
  db.collection("login").findOne({ id: 아이디 }, function (error, result) {
    done(null, result);
  });
});

//로그아웃
router.get("/logout", function (request, response) {
  request.logout();
  response.render("index.ejs", {});
});

//회원가입 페이지
router.get("/signup", function (request, response) {
  response.render("sign_up.ejs");
});

//회원가입 기능
router.post("/signup", function (request, response) {
  //1. 저장 전에 아이디 중복 되는지 - 완
  //2. 아이디 형식이 맞는지 - 완
  //3. 패스워드 암호화 bcrypt.hashSync - 완
  let encryptedPassowrd = bcrypt.hashSync(request.body.pw, 10); // sync, hashSync

  //phone
  let userPhone =
    String(request.body.telno1) +
    String(request.body.telno2) +
    String(request.body.telno3);

  db.collection("login").insertOne(
    {
      id: request.body.id,
      pw: encryptedPassowrd,
      phone: userPhone,
    },
    function (error, result) {
      // console.log('id:',request.body.id);
      // console.log('pw:',request.body.pw);
      // console.log('address:',request.body.address);
      response.redirect("/login");
    }
  );
});

//아이디 중복 체크
router.get("/idCheck", (request, response) => {
  console.log(request.query.id);

  //db에 동일한 아이디 존재하는지 찾기
  db.collection("login").findOne(
    { id: request.query.id },
    function (error, result) {
      if (error) {
        console.log(error);
      }

      if (result) {
        return response
          .status(200)
          .send({ id: result.id, message: "사용할 수 없는 아이디입니다." });
      } else {
        return response.send({ message: "멋진 아이디네요!" });
      }
    }
  );
});

//이 파일에서 router라는 변수를 배출
module.exports = router;
