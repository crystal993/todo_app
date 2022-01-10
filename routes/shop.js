// npm으로 설치했던 express라이브러리의 Router()사용
var router = require('express').Router();


router.get('/shirts', function(요청, 응답){
    응답.send('셔츠 파는 페이지입니다.');
});

router.get('/pants', function(요청, 응답){
    응답.send('바지 파는 페이지입니다.');
}); 

//이 파일에서 router라는 변수를 배출
module.exports = router;