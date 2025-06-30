
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import BusinessSettings from '@/components/BusinessSettings';

const BusinessAccount = () => {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main className="pt-20 pb-8">
        <BusinessSettings onClose={handleClose} />
      </main>
    </div>
  );
};

export default BusinessAccount;
