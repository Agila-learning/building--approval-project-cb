export interface Task {
  id: string;
  applicationId: string;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Pending Review' | 'Assigned' | 'In Progress' | 'Waiting for Documents' | 'Waiting for Customer' | 'Waiting for Government' | 'Completed';
  dueDate: string;
  assignedDate: string;
  assignedTo: string; // e.g. "Naveen"
  customerName: string;
  propertyLocation: string;
}

export interface EmployeeFollowUp {
  id: string;
  applicationId: string;
  customerName: string;
  reason: string;
  dueTime: string;
  status: 'Pending' | 'Completed' | 'Rescheduled';
  assignedTo: string;
}

// Function to generate and retrieve mock tasks specifically for an employee
export const getEmployeeTasks = (employeeName: string): Task[] => {
  const storedTasks = localStorage.getItem('employeeTasks');
  let tasks: Task[] = [];
  
  if (storedTasks) {
    tasks = JSON.parse(storedTasks);
  } else {
    // Generate some mock tasks based on recent applications
    const storedApps = localStorage.getItem('recentApplications');
    const apps = storedApps ? JSON.parse(storedApps) : [];
    
    // Assign tasks to the mocked user
    apps.forEach((app: any, index: number) => {
      if (index % 2 === 0) {
        tasks.push({
          id: `TASK-${1000 + index}`,
          applicationId: app.id,
          title: 'Document Verification',
          description: 'Verify Aadhar card and Property Tax receipt for accuracy.',
          priority: index === 0 ? 'Urgent' : 'Medium',
          status: index === 0 ? 'Pending Review' : 'In Progress',
          dueDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          assignedDate: app.date,
          assignedTo: employeeName,
          customerName: app.customer,
          propertyLocation: app.location
        });
      }
    });

    // Save to local storage
    localStorage.setItem('employeeTasks', JSON.stringify(tasks));
  }

  return tasks.filter(t => t.assignedTo === employeeName);
};

export const updateTaskStatus = (taskId: string, newStatus: Task['status']) => {
  const storedTasks = localStorage.getItem('employeeTasks');
  if (storedTasks) {
    const tasks: Task[] = JSON.parse(storedTasks);
    const updated = tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
    localStorage.setItem('employeeTasks', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  }
};

export const getEmployeeFollowUps = (employeeName: string): EmployeeFollowUp[] => {
  const stored = localStorage.getItem('employeeFollowUps');
  let followups: EmployeeFollowUp[] = [];

  if (stored) {
    followups = JSON.parse(stored);
  } else {
    // Generate mock followups
    const storedApps = localStorage.getItem('recentApplications');
    const apps = storedApps ? JSON.parse(storedApps) : [];
    
    if (apps.length > 0) {
      followups.push({
        id: 'FU-100',
        applicationId: apps[0].id,
        customerName: apps[0].customer,
        reason: 'Missing Signature on Patta Document',
        dueTime: '10:30 AM',
        status: 'Pending',
        assignedTo: employeeName
      });
      followups.push({
        id: 'FU-101',
        applicationId: apps[1]?.id || 'BLD-999',
        customerName: apps[1]?.customer || 'Test User',
        reason: 'Call to confirm inspection time',
        dueTime: '2:00 PM',
        status: 'Pending',
        assignedTo: employeeName
      });
    }
    localStorage.setItem('employeeFollowUps', JSON.stringify(followups));
  }
  
  return followups.filter(f => f.assignedTo === employeeName);
};

export const updateFollowUpStatus = (id: string, status: EmployeeFollowUp['status']) => {
  const stored = localStorage.getItem('employeeFollowUps');
  if (stored) {
    const f: EmployeeFollowUp[] = JSON.parse(stored);
    const updated = f.map(item => item.id === id ? { ...item, status } : item);
    localStorage.setItem('employeeFollowUps', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  }
};
