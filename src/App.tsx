import { BrowserRouter, Routes, Route, useSearchParams } from 'react-router-dom';
import { ChannelManagerProvider } from './context/ChannelManagerContext';
import { ChannelManagerPage } from './pages/ChannelManagerPage';
import { AccountDetailsPage } from './pages/AccountDetailsPage';
import { GuestHubPage } from './pages/GuestHubPage';
import { BookingWebsiteSettingsPage } from './pages/BookingWebsiteSettingsPage';
import { BookingWebsiteEditor } from './pages/BookingWebsiteEditor';

// Useberry entry: root URL with ?task=N renders the editor directly
const USEBERRY_SITE = { id: 'useberry-test', name: 'Default Booking Site', status: 'Published' as const, website: null, listings: 0, lastPublished: null }

function RootRoute() {
  const [params] = useSearchParams()
  const task = params.get('task')
  if (task) {
    return <BookingWebsiteEditor site={USEBERRY_SITE} onBack={() => {}} task={task} />
  }
  return <ChannelManagerPage />
}

export default function App() {
  return (
    <BrowserRouter>
      <ChannelManagerProvider>
        <Routes>
          <Route path="/" element={<RootRoute />} />
          <Route path="/accounts/:accountId" element={<AccountDetailsPage />} />
          <Route path="/guest-hub" element={<GuestHubPage />} />
          <Route path="/booking-website" element={<BookingWebsiteSettingsPage />} />
        </Routes>
      </ChannelManagerProvider>
    </BrowserRouter>
  );
}
