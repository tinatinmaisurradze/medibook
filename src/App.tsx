import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
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
const MyAppointments = lazy(() => import('@/pages/MyAppointments'))
const DashboardRedirect = lazy(() => import('@/pages/DashboardRedirect'))
const DoctorSchedule = lazy(() => import('@/pages/doctor/Schedule'))
const AdminStats = lazy(() => import('@/pages/admin/Stats'))
const DoctorSchedules = lazy(() => import('@/pages/admin/DoctorSchedules'))
const Rooms = lazy(() => import('@/pages/admin/Rooms'))
const Cancellations = lazy(() => import('@/pages/admin/Cancellations'))

export default function App() {
  return (
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
            <Route path="/my-appointments" element={<MyAppointments />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Doctor workspace */}
        <Route element={<ProtectedRoute roles={['doctor']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/doctor/schedule" element={<DoctorSchedule />} />
          </Route>
        </Route>

        {/* Admin workspace */}
        <Route element={<ProtectedRoute roles={['admin']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/admin/stats" element={<AdminStats />} />
            <Route path="/admin/schedule" element={<DoctorSchedules />} />
            <Route path="/admin/rooms" element={<Rooms />} />
            <Route path="/admin/cancellations" element={<Cancellations />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  )
}
