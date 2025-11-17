import { Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';

const FloatingAIButton = () => {
  const navigate = useNavigate();
  const [position, setPosition] = useState({ x: 24, y: window.innerHeight / 2 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleDragStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    dragStartPos.current = {
      x: clientX - position.x,
      y: clientY - position.y,
    };
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;

    const newX = clientX - dragStartPos.current.x;
    const newY = clientY - dragStartPos.current.y;

    // Keep button within viewport bounds
    const maxX = window.innerWidth - 24;
    const maxY = window.innerHeight - 24;

    setPosition({
      x: Math.max(24, Math.min(newX, maxX)),
      y: Math.max(24, Math.min(newY, maxY)),
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    // Only navigate if not dragging
    if (!isDragging) {
      navigate('/ai-tools');
    }
  };

  return (
    <Button
      ref={buttonRef}
      onClick={handleClick}
      onMouseDown={(e) => {
        e.preventDefault();
        handleDragStart(e.clientX, e.clientY);
      }}
      onMouseMove={(e) => handleDragMove(e.clientX, e.clientY)}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      onTouchStart={(e) => {
        const touch = e.touches[0];
        handleDragStart(touch.clientX, touch.clientY);
      }}
      onTouchMove={(e) => {
        const touch = e.touches[0];
        handleDragMove(touch.clientX, touch.clientY);
      }}
      onTouchEnd={handleDragEnd}
      className="fixed z-40 w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-0 shadow-lg hover:shadow-2xl group cursor-move select-none"
      size="icon"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -50%)',
        transition: isDragging ? 'none' : 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <Brain className={`w-6 h-6 text-white ${isDragging ? 'animate-spin' : 'animate-pulse'}`} />
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-20 animate-ping"></div>
    </Button>
  );
};

export default FloatingAIButton;