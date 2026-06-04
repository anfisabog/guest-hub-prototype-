import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ChannelManagerProvider } from './context/ChannelManagerContext'
import { GuestHubPage, BookingWebsitesView } from './pages/GuestHubPage'
import { ChannelManagerPage } from './pages/ChannelManagerPage'
import { PageShell } from './components/channel-manager'
import { NAV_ITEMS } from './lib/navItems'

function BookingWebsitePage() {
  return (
    <PageShell sidebarActiveIndex={10}>
      <BookingWebsitesView />
    </PageShell>
  )
}

/**
 * Slugs that have their own dedicated page component.
 * Everything else falls through to ChannelManagerPage.
 */
const DEDICATED: Record<string, JSX.Element> = {
  'post-booking-experience': <GuestHubPage />,
  'booking-website': <BookingWebsitePage />,
}

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
              element={DEDICATED[item.slug] ?? <ChannelManagerPage />}
            />
          ))}

          {/* Unknown routes → default landing */}
          <Route path="*" element={<Navigate to="/post-booking-experience" replace />} />
        </Routes>
      </ChannelManagerProvider>
    </HashRouter>
  )
}
