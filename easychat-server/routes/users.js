var express = require('express');
var router = express.Router();
const { authenticateToken } = require('../middleware');

/* GET users listing. */
router.get('/', authenticateToken, function (req, res, next) {
  res.send('respond with a resource');
});

router.get('/:id', authenticateToken, function (req, res, next) {
  res.send('respond with a resourceaswd');
});

module.exports = router;
