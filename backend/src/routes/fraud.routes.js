const router = require('express').Router();
const { getHighRiskUsers, getRiskTrend, getRiskDistribution } = require('../controllers/fraud.controller');
const { protect } = require('../middlewares/auth.middleware');
router.use(protect);
router.get('/high-risk-users', getHighRiskUsers);
router.get('/trend', getRiskTrend);
router.get('/distribution', getRiskDistribution);
module.exports = router;
