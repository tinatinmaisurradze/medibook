import { lazy, Suspense, useLayoutEffect } from 'react'
import { Route, Routes, useLocation, useNavigationType } from 'react-router-dom'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { OfflineBanner } from '@/components/OfflineBanner'
import { PublicLayout } from '@/layouts/PublicLayout'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { PageSpinner } from '@/components/ui/States'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import { Forbidden, NotFound } from '@/pages/NotFound'

// Code splitting: heavier / role-specific pages are loaded on demand
const Doctors = lazy(() => import('@/pages/Doctors'))
const DoctorDetail = lazy(() => import('@/pages/DoctorDetail'))
const Book = lazy(() => import('@/pages/Book'))
const Checkout = lazy(() => import('@/pages/Checkout'))
const MyAppointments = lazy(() => import('@/pages/MyAppointments'))
const DashboardRedirect = lazy(() => import('@/pages/DashboardRedirect'))
const VisitDetail = lazy(() => import('@/pages/VisitDetail'))
const PatientProfile = lazy(() => import('@/pages/PatientProfile'))
const DoctorDashboard = lazy(() => import('@/pages/doctor/Dashboard'))
const DoctorCalendar = lazy(() => import('@/pages/doctor/Calendar'))
const DoctorPatients = lazy(() => import('@/pages/doctor/Patients'))
const PatientRecord = lazy(() => import('@/pages/doctor/PatientRecord'))
const DoctorReviews = lazy(() => import('@/pages/doctor/Reviews'))
const DoctorProfile = lazy(() => import('@/pages/doctor/Profile'))
const AdminProfile = lazy(() => import('@/pages/admin/Profile'))
const DoctorSchedule = lazy(() => import('@/pages/doctor/Schedule'))
const AdminStats = lazy(() => import('@/pages/admin/Stats'))
const DoctorSchedules = lazy(() => import('@/pages/admin/DoctorSchedules'))
const AdminVisits = lazy(() => import('@/pages/admin/Visits'))
const Cancellations = lazy(() => import('@/pages/admin/Cancellations'))

/**
 * In a single page app the scroll position is kept when the page changes. This puts every new page at the very top.
 * It jumps again a moment later, because the new page (a lazily loaded chunk) may appear after the first jump.
 * Back / forward buttons keep the browser's own behaviour, and an address with #anchor is left to its page.
 */
function ScrollToTop() {
  const { pathname, hash } = useLocation()
  const type = useNavigationType()
  useLayoutEffect(() => {
    if (hash || type === 'POP') return
    const jump = () => window.scrollTo(0, 0)
    jump()
    const timers = [60, 200].map((ms) => window.setTimeout(jump, ms))
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [pathname, hash, type])
  return null
}

export default function App() {
  const { pathname } = useLocation()
  return (
    <ErrorBoundary resetKey={pathname}>
    <OfflineBanner />
    <ScrollToTop />
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        {/* Public + patient area */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/doctors/:id" element={<DoctorDetail />} />
          <Route path="/403" element={<Forbidden />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardRedirect />} />
          </Route>
          <Route element={<ProtectedRoute roles={['patient']} />}>
            <Route path="/book/:doctorId" element={<Book />} />
            <Route path="/checkout/:id" element={<Checkout />} />
            <Route path="/my-appointments" element={<MyAppointments />} />
            <Route path="/my-appointments/:id" element={<VisitDetail />} />
            <Route path="/profile" element={<PatientProfile />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Doctor workspace */}
        <Route element={<ProtectedRoute roles={['doctor']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
            <Route path="/doctor/calendar" element={<DoctorCalendar />} />
            <Route path="/doctor/schedule" element={<DoctorSchedule />} />
            <Route path="/doctor/patients" element={<DoctorPatients />} />
            <Route path="/doctor/patients/:id" element={<PatientRecord />} />
            <Route path="/doctor/reviews" element={<DoctorReviews />} />
            <Route path="/doctor/profile" element={<DoctorProfile />} />
            <Route path="/doctor/visits/:id" element={<VisitDetail />} />
          </Route>
        </Route>

        {/* Admin workspace */}
        <Route element={<ProtectedRoute roles={['admin']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/admin/stats" element={<AdminStats />} />
            <Route path="/admin/schedule" element={<DoctorSchedules />} />
            <Route path="/admin/visits" element={<AdminVisits />} />
            <Route path="/admin/cancellations" element={<Cancellations />} />
            <Route path="/admin/profile" element={<AdminProfile />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
    </ErrorBoundary>
  )
}
