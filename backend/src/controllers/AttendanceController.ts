import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import prisma from '../prisma';

const ATTENDANCE_FILE = path.join(__dirname, '../../data/attendance.json');

function ensureDataDir() {
  const dir = path.dirname(ATTENDANCE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function loadAttendanceRecords(): any[] {
  try {
    ensureDataDir();
    if (fs.existsSync(ATTENDANCE_FILE)) {
      const data = fs.readFileSync(ATTENDANCE_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn('Could not read attendance file:', err);
  }
  return [];
}

export function saveAttendanceRecords(records: any[]) {
  ensureDataDir();
  fs.writeFileSync(ATTENDANCE_FILE, JSON.stringify(records, null, 2), 'utf-8');
}

export class AttendanceController {
  // GET /attendance
  async getAttendance(req: Request, res: Response) {
    try {
      const { date, staffName, staffId } = req.query;
      let records = loadAttendanceRecords();

      if (date) {
        records = records.filter(r => r.date === String(date));
      }
      if (staffName) {
        records = records.filter(r => r.name.toLowerCase() === String(staffName).toLowerCase());
      }
      if (staffId) {
        records = records.filter(r => r.id === String(staffId));
      }

      res.json(records);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // POST /attendance
  async markAttendance(req: Request, res: Response) {
    try {
      const body = req.body || {};
      const userName = (req.headers['x-user-name'] as string) || body.name || 'Staff Member';
      const userRole = (req.headers['x-user-role'] as string) || body.role || 'Staff Member';
      const staffId = (req.headers['x-staff-id'] as string) || body.id || `EMP-${userName.replace(/\s+/g, '')}`;

      const today = body.date || new Date().toISOString().split('T')[0];
      const timeString = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      let records = loadAttendanceRecords();
      let index = records.findIndex(r => (r.name.toLowerCase() === userName.toLowerCase() || r.id === staffId) && r.date === today);

      const type = body.type; // 'checkIn' | 'checkOut' | 'PRESENT' | 'HALF_DAY' | 'LEAVE'
      const status = body.status || (type === 'LEAVE' ? 'Leave' : 'Present');

      if (index >= 0) {
        if (type === 'checkIn' || type === 'PRESENT') {
          records[index].checkIn = body.checkIn || timeString;
          records[index].status = status;
        } else if (type === 'checkOut') {
          records[index].checkOut = body.checkOut || timeString;
          records[index].status = status;
        } else {
          records[index].status = status;
          if (body.checkIn) records[index].checkIn = body.checkIn;
          if (body.checkOut) records[index].checkOut = body.checkOut;
        }
      } else {
        const newRecord = {
          id: staffId,
          name: userName,
          role: userRole,
          date: today,
          checkIn: type === 'checkOut' ? '--' : (body.checkIn || timeString),
          checkOut: type === 'checkOut' ? (body.checkOut || timeString) : '--',
          status,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=0D8ABC&color=fff`
        };
        records.push(newRecord);
        index = records.length - 1;
      }

      saveAttendanceRecords(records);

      // Create internal notification so Admin sees staff attendance in real time
      try {
        await prisma.notification.create({
          data: {
            title: `Attendance Marked: ${userName}`,
            message: `${userName} marked ${status} for today (${today}) at ${timeString}.`,
            type: 'attendance',
            case_id: staffId
          }
        });
      } catch (nErr) {
        // Notification table optional failure safe
      }

      res.json({ success: true, record: records[index] });
    } catch (error: any) {
      console.error('Error recording attendance:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export const attendanceController = new AttendanceController();
