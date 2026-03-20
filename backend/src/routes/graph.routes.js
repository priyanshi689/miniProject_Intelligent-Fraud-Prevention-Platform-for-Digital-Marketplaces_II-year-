const router = require('express').Router();
const { getUserGraph, getFraudRings } = require('../controllers/graph.controller');
const { protect } = require('../middlewares/auth.middleware');
router.use(protect);
router.get('/user/:userId', getUserGraph);
router.get('/fraud-rings', getFraudRings);
module.exports = router;
