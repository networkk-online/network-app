import { NetworkkAssistantChat } from '@/components/NetworkkAssistantChat';
import BottomNav from '@/components/BottomNav';

const NetworkkAssistant = () => {
  return (
    <div className="h-[100dvh] bg-black flex flex-col overflow-hidden">
      <main className="flex-1 min-h-0 max-w-2xl w-full mx-auto">
        <NetworkkAssistantChat />
      </main>
      <BottomNav />
    </div>
  );
};

export default NetworkkAssistant;
