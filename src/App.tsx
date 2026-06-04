import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ChannelManagerProvider } from './context/ChannelManagerContext'
import { GuestHubPage } from './pages/GuestHubPage'
import { ChannelManagerPage } from './pages/ChannelManagerPage'
import { NAV_ITEMS } from './lib/navItems'

/**
 * Slugs that have their own dedicated page component.
 * Everything else falls through to ChannelManagerPage, which derives the
 * active sub-view from the URL slug (Calendar / Reservation / Reviews / …).
 */
const DEDICATED = new Set<string>(['post-booking-experience'])

export default function App() {
  return (
    <HashRouter>
      <ChannelManagerProvider>
        <Routes>
          {/* Default + legacy entries → post-booking-experience */}
          <Route path="/"          element={<Navigate to="/post-booking-experience" replace />} />
          <Route path="/guest-hub" element={<Navigate to="/post-booking-experience" replace />} />

          {/* Every sidebar slug gets a route */}
          {NAV_ITEMS.map(item => (
            <Route
              key={item.slug}
              path={`/${item.slug}`}
              element={
                DEDICATED.has(item.slug) ? <GuestHubPage /> : <ChannelManagerPage />
              }
            />
          ))}

          {/* Booking-website sub-routes (e.g. settings panels) */}
          <Route path="/booking-website/*" element={<ChannelManagerPage />} />

          {/* Unknown routes → default landing */}
          <Route path="*" element={<Navigate to="/post-booking-experience" replace />} />
        </Routes>
      </ChannelManagerProvider>
    </HashRouter>
  )
}
