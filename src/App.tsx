import { HashRouter, Routes, Route } from 'react-router-dom';
import { ChannelManagerProvider } from './context/ChannelManagerContext';
import { GuestHubPage } from './pages/GuestHubPage';
import { ChannelManagerPage } from './pages/ChannelManagerPage';

export default function App() {
  return (
    <HashRouter>
      <ChannelManagerProvider>
        <Routes>
          <Route path="/" element={<GuestHubPage />} />
          <Route path="/booking-website" element={<ChannelManagerPage />} />
          <Route path="/booking-website/*" element={<ChannelManagerPage />} />
        </Routes>
      </ChannelManagerProvider>
    </HashRouter>
  );
}
