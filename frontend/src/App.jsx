import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";
import axios from "axios";
import { Signin } from './pages/Signin'
import { Signup } from './pages/Signup'
import { Dashboard } from './pages/Dashboard'
import { SendMoney } from './pages/SendMoney'
import { Landing } from './pages/Landing'
import About from './pages/About';
import KPIReports from './pages/KPIReports';
import { Settings } from "./pages/Settings";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Set the base URL for all axios requests
axios.defaults.baseURL = 'http://localhost:3001';

function App() {
  return (
    <>
       <BrowserRouter>
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/about" element={<About />} />
          <Route path="/kpi-reports" element={<KPIReports />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/send" element={
            <ProtectedRoute>
              <SendMoney />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/" element={<Landing />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
