import { HashRouter } from 'react-router-dom';
import { ChannelManagerProvider } from './context/ChannelManagerContext';
import { GuestHubPage } from './pages/GuestHubPage';

export default function App() {
  return (
    <HashRouter>
      <ChannelManagerProvider>
        <GuestHubPage />
      </ChannelManagerProvider>
    </HashRouter>
  );
}
