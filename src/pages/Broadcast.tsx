import { useNavigate, useSearchParams } from 'react-router-dom';
import LiveScreenV3 from '@/components/live/v3/LiveScreenV3';

const Broadcast = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const joinRoomId = searchParams.get('join') || undefined;

  return <LiveScreenV3 joinRoomId={joinRoomId} onClose={() => navigate('/')} />;
};

export default Broadcast;
