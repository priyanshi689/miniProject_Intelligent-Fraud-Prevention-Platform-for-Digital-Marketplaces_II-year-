const router = require('express').Router();
const { createCase, getCases, getCaseById, updateCase } = require('../controllers/case.controller');
const { protect } = require('../middlewares/auth.middleware');
router.use(protect);
router.post('/', createCase);
router.get('/', getCases);
router.get('/:id', getCaseById);
router.patch('/:id', updateCase);
module.exports = router;
