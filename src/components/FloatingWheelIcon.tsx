import { useState, useRef } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";

const FloatingWheelIcon = () => {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);
  const rotate = useTransform(y, [-200, 200], [-15, 15]);

  const handleTap = () => {
    if (!isDragging) {
      navigate("/rewards-wheel");
    }
  };

  return (
    <>
      {/* Drag constraint area - full screen height on the right */}
      <div
        ref={constraintsRef}
        className="fixed right-0 top-20 bottom-24 w-20 z-[60] pointer-events-none"
      />

      <motion.div
        drag="y"
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setTimeout(() => setIsDragging(false), 100)}
        style={{ y, rotate }}
        className="fixed right-3 top-[45%] z-[60] cursor-pointer"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleTap}
      >
        {/* Pulse ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.3), transparent 70%)",
          }}
          animate={{
            scale: [1, 1.6, 1],
            opacity: [0.6, 0, 0.6],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Main icon container */}
        <div className="relative w-14 h-14">
          {/* Outer glow ring */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: "conic-gradient(from 0deg, #FFD700, hsl(var(--primary)), #FFD700, hsl(var(--primary)), #FFD700)",
              padding: "2.5px",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          >
            <div className="w-full h-full rounded-full bg-black" />
          </motion.div>

          {/* Inner wheel design */}
          <div className="absolute inset-[3px] rounded-full overflow-hidden">
            {/* Wheel background */}
            <div
              className="w-full h-full rounded-full flex items-center justify-center"
              style={{
                background: "conic-gradient(from 0deg, #1a1a2e, hsl(var(--primary) / 0.3), #1a1a2e, #FFD700 / 0.2, #1a1a2e, hsl(var(--primary) / 0.3), #1a1a2e, #FFD700 / 0.2)",
              }}
            >
              {/* Center jewel */}
              <motion.div
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{
                  background: "radial-gradient(circle at 30% 30%, #FFD700, #B8860B)",
                  boxShadow: "0 0 12px #FFD70080, inset 0 -2px 4px #00000040",
                }}
                animate={{ rotate: -360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-4 h-4 text-black" />
              </motion.div>
            </div>
          </div>

          {/* Shine effect */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%, transparent 100%)",
            }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>

        {/* Label */}
        <motion.div
          className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={{
              background: "linear-gradient(135deg, #FFD700, #B8860B)",
              color: "#000",
              textShadow: "0 0 4px #FFD70060",
            }}
          >
            عجلة الحظ
          </span>
        </motion.div>
      </motion.div>
    </>
  );
};

export default FloatingWheelIcon;
