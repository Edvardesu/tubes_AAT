import { Router, Request, Response, NextFunction } from 'express';
import { notificationService, preferenceService } from '../services';
import { HTTP_STATUS } from '@lapor-pakdhe/shared';

const router = Router();

// GET /notifications - Get user notifications
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

    const result = await notificationService.getUserNotifications(userId, page, limit);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        notifications: result.notifications,
        meta: result.meta,
      },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /notifications/:id/read - Mark notification as read
router.patch('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    await notificationService.markAsRead(req.params.id, userId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    next(error);
  }
});

// POST /notifications/read-all - Mark all notifications as read
router.post('/read-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    await notificationService.markAllAsRead(userId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /notifications/:id - Delete a notification
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    await notificationService.deleteNotification(req.params.id, userId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    next(error);
  }
});

// ==================== PREFERENCES ====================

// GET /notifications/preferences - Get user notification preferences
router.get('/preferences', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const preferences = await preferenceService.getPreferences(userId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /notifications/preferences - Update user notification preferences
router.put('/preferences', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const {
      emailEnabled,
      pushEnabled,
      inAppEnabled,
      reportCreated,
      reportAssigned,
      statusUpdated,
      reportEscalated,
      reportResolved,
      reportCommented,
      upvoteReceived,
      systemAnnouncement,
      quietHoursEnabled,
      quietHoursStart,
      quietHoursEnd,
    } = req.body;

    const preferences = await preferenceService.updatePreferences(userId, {
      emailEnabled,
      pushEnabled,
      inAppEnabled,
      reportCreated,
      reportAssigned,
      statusUpdated,
      reportEscalated,
      reportResolved,
      reportCommented,
      upvoteReceived,
      systemAnnouncement,
      quietHoursEnabled,
      quietHoursStart,
      quietHoursEnd,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: preferences,
      message: 'Notification preferences updated',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
