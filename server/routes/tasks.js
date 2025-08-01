import express from 'express';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// 占位符路由
router.get('/', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: '任务管理API - 待实现',
    data: []
  });
});

export default router; 