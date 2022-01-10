const res = require('express/lib/response');
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

//chat으로 이동 
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

//chat 메세지 전송
router.post("/message", loginCheck, function(request, response){
    let dt = new Date();
    // 오늘 날짜,시간,공백제거    
    let today = dt.toLocaleDateString().replace(/(\s*)/g, "");

    var msgData = {
        parent : request.body.parent,
        content : request.body.content,
        userid : request.user._id,
        date : today
    }

    db.collection("message").insertOne(msgData).then((result)=>{
        // response.render("chat.ejs",{msg:result})
        console.log("DB저장 성공");
        response.send("DB저장 성공");
    }).catch(()=>{

    })
})

//서버와 유저간의 실시간 소통채널 열기 
router.get('/message/:id', loginCheck, function(request, response){
    response.writeHead(200, {
        "Connection": "keep-alive",
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      });
    
    db.collection("message").find({ parent : request.params.id }).toArray()
    .then((result)=>{
        response.write('event: test\n');
        response.write('data: ' + JSON.stringify(result) +'\n\n');  
    });  

})

module.exports = router;