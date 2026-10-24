import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar'; 
import Footer from './components/Footer';
import Landing from './pages/Landing';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import TrackApplication from './pages/TrackApplication';
import AdminLayout from './layouts/AdminLayout';
import ApplicationsList from './pages/admin/ApplicationsList';
import ApplicationDetail from './pages/admin/ApplicationDetail';
import ReceiptPrint from './pages/admin/ReceiptPrint';
import CustomersList from './pages/admin/CustomersList';
import StaffList from './pages/admin/StaffList';
import CustomerUpload from './pages/customer/CustomerUpload';
import EmployeeLayout from './layouts/EmployeeLayout';
import MyApplications from './pages/employee/MyApplications';
// EmployeeApplicationDetail removed, using ApplicationDetail for both
import ApplyNow from './pages/customer/ApplyNow';
import CustomerLeads from './pages/admin/CustomerLeads';
import AttendanceList from './pages/admin/AttendanceList';
import LinkTracking from './pages/admin/LinkTracking';
import EmployeeAttendance from './pages/employee/EmployeeAttendance';
import FollowUpsList from './pages/admin/FollowUpsList';
import Settings from './pages/admin/Settings';
import EnquiriesList from './pages/admin/EnquiriesList';
import Reports from './pages/admin/Reports';
import PaymentsList from './pages/admin/PaymentsList';
import PaymentDetail from './pages/admin/PaymentDetail';
import Expenses from './pages/admin/Expenses';
import Receipts from './pages/admin/Receipts';
import Quotations from './pages/admin/Quotations';
import ApplicationPDF from './pages/admin/ApplicationPDF';
import CashBook from './pages/admin/CashBook';

function App() {
  useEffect(() => {
    // Load global theme colors and mode (removed localstorage overrides to enforce index.css theme)

    const savedMode = localStorage.getItem('themeMode');
    if (savedMode === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }

    // Background task: Auto-assign unassigned follow-ups after 10 minutes
    const interval = setInterval(() => {
      const storedFollowUps = localStorage.getItem('followUps');
      if (!storedFollowUps) return;
      
      const followUps = JSON.parse(storedFollowUps);
      let changed = false;
      const now = Date.now();
      
      const staffSaved = localStorage.getItem('staffMembers');
      const staffList = staffSaved ? JSON.parse(staffSaved).filter((s: any) => s.status === 'Active') : [];
      if (staffList.length === 0) return;

      const assignedCounts: Record<string, number> = {};
      staffList.forEach((s: any) => assignedCounts[s.name] = 0);
      followUps.forEach((f: any) => {
        if (f.assignedTo && assignedCounts[f.assignedTo] !== undefined) {
          assignedCounts[f.assignedTo]++;
        }
      });

      const bestStaff = Object.keys(assignedCounts).reduce((a, b) => assignedCounts[a] < assignedCounts[b] ? a : b, staffList[0].name);

      followUps.forEach((f: any) => {
        if (f.status === 'unassigned' && (now - f.timestamp > 10 * 60 * 1000)) {
          f.status = 'followup';
          f.assignedTo = bestStaff;
          changed = true;
        }
      });

      if (changed) {
        localStorage.setItem('followUps', JSON.stringify(followUps));
        window.dispatchEvent(new Event('storage'));
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);
  return (
    <Router>
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)',
            borderRadius: '0.75rem',
            padding: '1rem 1.5rem',
          },
        }}
      />
      <div className="app-container">
        <Routes>
          {/* Main Website Routes with Navbar & Footer */}
          <Route path="/*" element={
            <>
              <Navbar />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/track-application" element={<TrackApplication />} />
                </Routes>
              </main>
              <Footer />
            </>
          } />
          
          {/* Standalone Layouts */}
          <Route path="/upload/:id" element={<CustomerUpload />} />
          <Route path="/apply" element={<ApplyNow />} />
          <Route path="/login" element={<Login />} />
          <Route path="/print/application/:id" element={<ApplicationPDF />} />
          <Route path="/print/receipt/:id" element={<ReceiptPrint />} />
          {/* Admin Layout */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            
            {/* Applications Module */}
            <Route path="applications" element={<ApplicationsList />} />
            <Route path="applications/new" element={<ApplicationDetail />} />
            <Route path="applications/:id" element={<ApplicationDetail />} />
            
            {/* Customers Module */}
            <Route path="customers" element={<CustomersList />} />
            <Route path="leads" element={<CustomerLeads />} />
            <Route path="leads/new" element={<ApplicationDetail />} />
            <Route path="enquiries" element={<EnquiriesList />} />
            
            {/* Staff Module */}
            <Route path="staff" element={<StaffList />} />
            <Route path="attendance" element={<AttendanceList />} />
            <Route path="link-tracking" element={<LinkTracking />} />
            
            {/* Fallbacks for other routes */}
            <Route path="properties/*" element={<div style={{padding:'2rem'}}><h2>Properties Module</h2><p>Coming soon...</p></div>} />
            <Route path="documents/*" element={<div style={{padding:'2rem'}}><h2>Documents Module</h2><p>Coming soon...</p></div>} />
            <Route path="workflow/*" element={<div style={{padding:'2rem'}}><h2>Workflow Module</h2><p>Coming soon...</p></div>} />
            <Route path="payments" element={<PaymentsList />} />
            <Route path="payments/:id" element={<PaymentDetail />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="receipts" element={<Receipts />} />
            <Route path="cashbook" element={<CashBook />} />
            <Route path="quotations" element={<Quotations />} />
            <Route path="submissions/*" element={<div style={{padding:'2rem'}}><h2>Submissions Module</h2><p>Coming soon...</p></div>} />
            <Route path="tasks/*" element={<div style={{padding:'2rem'}}><h2>Tasks Module</h2><p>Coming soon...</p></div>} />
            <Route path="followups" element={<FollowUpsList />} />
            <Route path="reports/*" element={<Reports />} />
            <Route path="settings/*" element={<Settings />} />
            
            {/* Maintenance Module */}
            <Route path="maintenance/view" element={<ApplicationsList />} />
            <Route path="maintenance/logs" element={<ApplicationsList />} />
            <Route path="maintenance/revert" element={<ApplicationsList />} />
          </Route>
          {/* Employee Layout */}
          <Route path="/employee" element={<EmployeeLayout />}>
            <Route index element={<EmployeeDashboard />} />
            
            {/* Application Module */}
            <Route path="applications" element={<MyApplications />} />
            <Route path="applications/new" element={<ApplicationDetail />} />
            <Route path="applications/:id" element={<ApplicationDetail />} />
            
            {/* Fallbacks for other routes */}
            <Route path="attendance" element={<EmployeeAttendance />} />
            <Route path="followups" element={<FollowUpsList />} />
            <Route path="profile/*" element={<div style={{padding:'2rem'}}><h2>Profile</h2><p>Coming soon...</p></div>} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
