
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LiveBroadcast from '@/components/LiveBroadcast';

const Broadcast = () => {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/');
  };

  return <LiveBroadcast onClose={handleClose} />;
};

export default Broadcast;
