import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ChannelManagerProvider } from './context/ChannelManagerContext';
import { ChannelManagerPage } from './pages/ChannelManagerPage';
import { AccountDetailsPage } from './pages/AccountDetailsPage';
import { GuestHubPage } from './pages/GuestHubPage';
import { BookingWebsiteSettingsPage } from './pages/BookingWebsiteSettingsPage';
import { BookingWebsiteEditor } from './pages/BookingWebsiteEditor';
import { PageShell } from './components/channel-manager';

const USEBERRY_SITE = { id: 'useberry-test', name: 'Default Booking Site', status: 'Published' as const, website: null, listings: 0, lastPublished: null }

export default function App() {
  // Read task param directly — bypass BrowserRouter so our pushState calls
  // are clean and Useberry's script can intercept them without React Router interference.
  const task = new URLSearchParams(window.location.search).get('task')
  if (task) {
    return (
      <ChannelManagerProvider>
        <PageShell sidebarActiveIndex={10}>
          <BookingWebsiteEditor site={USEBERRY_SITE} onBack={() => {}} task={task} />
        </PageShell>
      </ChannelManagerProvider>
    )
  }

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <ChannelManagerProvider>
        <Routes>
          <Route path="/" element={<ChannelManagerPage />} />
          <Route path="/accounts/:accountId" element={<AccountDetailsPage />} />
          <Route path="/guest-hub" element={<GuestHubPage />} />
          <Route path="/booking-website" element={<BookingWebsiteSettingsPage />} />
        </Routes>
      </ChannelManagerProvider>
    </BrowserRouter>
  );
}
