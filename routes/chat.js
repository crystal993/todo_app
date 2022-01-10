var router = require("express").Router();

//chat목록으로 이동 
router.get("/chat", function(request,response){
    response.render("chat.ejs");
})

router.post("/chat", function(request, response){
    // console.log(request.body);
    let chatRoomInfo = {
        member: [request.body.member[0],request.body.member[1]],
        date: request.body.date,
        title: request.body.title
    };

    db.collection("chatroom").insertOne(chatRoomInfo, (request, response) => {
        if(error) {console.log(error);}
        response.send("채팅방생성");
    })
})

module.exports = router;