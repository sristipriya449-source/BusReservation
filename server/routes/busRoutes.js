const express = require('express');
const {
  createBus,
  getBuses,
  updateBus,
  deleteBus,
  createRoute,
  getAllRoutes,
  updateRoute,
  deleteRoute,
  searchRoutes,
  getPopularRoutes,
} = require('../controllers/busController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getBuses);
router.post('/', protect, adminOnly, createBus);
router.put('/:id', protect, adminOnly, updateBus);
router.delete('/:id', protect, adminOnly, deleteBus);

router.get('/routes', getAllRoutes);
router.post('/routes', protect, adminOnly, createRoute);
router.put('/routes/:id', protect, adminOnly, updateRoute);
router.delete('/routes/:id', protect, adminOnly, deleteRoute);
router.get('/routes/search', searchRoutes);
router.get('/routes/popular', getPopularRoutes);

module.exports = router;
