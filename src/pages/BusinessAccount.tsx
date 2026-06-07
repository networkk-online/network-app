
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { BusinessSettings } from '@/components/BusinessSettings';
import SeoHead from '@/components/seo/SeoHead';

const BusinessAccount = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SeoHead route="/business" />
      <Header />
      <main className="max-w-4xl mx-auto pt-20 pb-8 px-4">
        <BusinessSettings />
      </main>
    </div>
  );
};

export default BusinessAccount;
