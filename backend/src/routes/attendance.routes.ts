import { Router } from 'express';
import { attendanceController } from '../controllers/AttendanceController';

const router = Router();

router.get('/', attendanceController.getAttendance);
router.post('/', attendanceController.markAttendance);

export default router;
