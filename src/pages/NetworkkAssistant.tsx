import { NetworkkAssistantChat } from '@/components/NetworkkAssistantChat';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';

const NetworkkAssistant = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 max-w-2xl w-full mx-auto pb-20">
        <div className="h-[calc(100vh-8rem)]">
          <NetworkkAssistantChat />
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default NetworkkAssistant;
