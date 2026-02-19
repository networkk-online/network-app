import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LiveBroadcast from '@/components/LiveBroadcast';

const Broadcast = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const joinRoomId = searchParams.get('join') || undefined;

  const handleClose = () => {
    navigate('/');
  };

  return <LiveBroadcast onClose={handleClose} joinRoomId={joinRoomId} />;
};

export default Broadcast;
