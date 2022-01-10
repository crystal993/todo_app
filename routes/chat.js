const { append } = require("express/lib/response");

var router = require("express").Router();

//chat목록으로 이동 
router.get("/chat", function(request,response){
    response.render("chat.ejs");
})

module.exports = router;