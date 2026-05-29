import { ChannelManagerProvider } from './context/ChannelManagerContext';
import { GuestHubPage } from './pages/GuestHubPage';

export default function App() {
  return (
    <ChannelManagerProvider>
      <GuestHubPage />
    </ChannelManagerProvider>
  );
}
