'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface SmokeParticle {
  id: number;
  x: number;
  y: number;
  size: number;
}

export function FlyingRocket() {
  const [particles, setParticles] = useState<SmokeParticle[]>([]);

  useEffect(() => {
    // Generate expanding grey smoke puffs behind the rocket
    const interval = setInterval(() => {
      setParticles((prev) => [
        ...prev.slice(-15), // keep last 15 smoke particles
        {
          id: Date.now() + Math.random(),
          x: Math.random() * 8 - 4,
          y: Math.random() * 6 - 3,
          size: Math.random() * 8 + 12,
        },
      ]);
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative inline-block ml-2 pointer-events-none">
      {/* Animated Rocket Wrapper */}
      <motion.div
        animate={{
          x: [0, 12, 0, -8, 0],
          y: [0, -6, 2, -4, 0],
          rotate: [0, 8, -4, 6, 0],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="relative inline-flex items-center justify-center z-10"
      >
        <span className="text-3xl sm:text-4xl inline-block transform -rotate-12 filter drop-shadow-md">
          🚀
        </span>

        {/* Smoke Trail Emitter behind rocket nozzle */}
        <div className="absolute -left-6 bottom-1 flex items-center gap-1 z-0">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0.75, scale: 0.4, x: 0, y: 0 }}
              animate={{
                opacity: 0,
                scale: 2.2,
                x: -35 - Math.random() * 20,
                y: (Math.random() - 0.5) * 16,
              }}
              transition={{ duration: 1.4, ease: 'easeOut' }}
              style={{
                width: `${p.size}px`,
                height: `${p.size}px`,
              }}
              className="absolute rounded-full bg-slate-400/40 dark:bg-slate-300/30 blur-sm pointer-events-none"
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
