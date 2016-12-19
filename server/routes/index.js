import {Router} from 'express';
const router = Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'EC2 Instance Dashboard' });
});

export default router;
