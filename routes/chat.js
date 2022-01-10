const { ObjectId } = require('mongodb');
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

//chat목록으로 이동 
router.get("/chat", function(request,response){
    db.collection("chatroom").find({member: request.user._id}).toArray().then((result)=>{
        response.render("chat.ejs", { data : result });
    });
});

//채팅방 생성
router.post("/chat",loginCheck, function(request, response){
    // console.log(request.body);
    let dt = new Date();
    // 오늘 날짜,시간,공백제거
    let today = dt.toLocaleString().replace(/(\s*)/g, "");
    let chatName = '채팅방 ['+today+']'
    
    let chatRoomInfo = {
        title: chatName,
        member: [ObjectId(request.body.member1),request.user._id],
        date: today
    };

    db.collection("chatroom").insertOne(chatRoomInfo).then((result)=>{
        response.send('성공');
    })
})

module.exports = router;