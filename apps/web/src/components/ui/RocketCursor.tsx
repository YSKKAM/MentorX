'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SmokeParticle {
  id: number;
  x: number;
  y: number;
  size: number;
}

export function RocketCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [angle, setAngle] = useState(-45);
  const [isVisible, setIsVisible] = useState(false);
  const [smokeList, setSmokeList] = useState<SmokeParticle[]>([]);
  const prevPos = useRef({ x: -100, y: -100 });

  useEffect(() => {
    // Hide default body cursor on login page
    document.body.style.cursor = 'none';

    const handleMouseMove = (e: MouseEvent) => {
      setIsVisible(true);
      const newX = e.clientX;
      const newY = e.clientY;

      // Calculate movement angle so rocket points in direction of cursor travel
      const dx = newX - prevPos.current.x;
      const dy = newY - prevPos.current.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 5) {
        const rad = Math.atan2(dy, dx);
        const deg = (rad * 180) / Math.PI + 45; // 45deg offset for rocket emoji
        setAngle(deg);

        // Emit smoke particles behind rocket
        if (dist > 12) {
          setSmokeList((prev) => [
            ...prev.slice(-25), // keep last 25 smoke clouds
            {
              id: Date.now() + Math.random(),
              x: prevPos.current.x,
              y: prevPos.current.y,
              size: Math.random() * 10 + 12,
            },
          ]);
        }
        prevPos.current = { x: newX, y: newY };
      }

      setPos({ x: newX, y: newY });
    };

    const handleMouseLeave = () => setIsVisible(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      // Revert cursor back to default when unmounted (e.g. after login)
      document.body.style.cursor = 'auto';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {/* Smoke Particles Trail */}
      <AnimatePresence>
        {smokeList.map((smoke) => (
          <motion.div
            key={smoke.id}
            initial={{ opacity: 0.8, scale: 0.5, x: smoke.x, y: smoke.y }}
            animate={{
              opacity: 0,
              scale: 2.5,
              x: smoke.x + (Math.random() - 0.5) * 20,
              y: smoke.y + (Math.random() - 0.5) * 20,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              left: 0,
              top: 0,
              width: `${smoke.size}px`,
              height: `${smoke.size}px`,
              marginLeft: `-${smoke.size / 2}px`,
              marginTop: `-${smoke.size / 2}px`,
            }}
            className="rounded-full bg-slate-400/50 dark:bg-slate-300/40 blur-sm"
          />
        ))}
      </AnimatePresence>

      {/* Floating Rocket Cursor */}
      <div
        style={{
          position: 'fixed',
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          transform: `translate(-50%, -50%) rotate(${angle}deg)`,
          transition: 'transform 0.08s ease-out',
        }}
        className="text-3xl select-none filter drop-shadow-lg"
      >
        🚀
      </div>
    </div>
  );
}
