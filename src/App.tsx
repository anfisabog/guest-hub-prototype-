import { BrowserRouter } from 'react-router-dom';
import { ChannelManagerProvider } from './context/ChannelManagerContext';
import { GuestHubPage } from './pages/GuestHubPage';

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <ChannelManagerProvider>
        <GuestHubPage />
      </ChannelManagerProvider>
    </BrowserRouter>
  );
}
