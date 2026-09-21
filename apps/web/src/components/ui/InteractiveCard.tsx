'use client';

import React, { useRef } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

interface InteractiveCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  enableTilt?: boolean;
}

export default function InteractiveCard({
  children,
  className = '',
  onClick,
  enableTilt = true,
}: InteractiveCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Mouse position values for 3D tilt
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth out tilt with spring physics
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [10, -10]), {
    stiffness: 300,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), {
    stiffness: 300,
    damping: 30,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableTilt || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        rotateX: enableTilt ? rotateX : 0,
        rotateY: enableTilt ? rotateY : 0,
        transformStyle: 'preserve-3d',
      }}
      whileHover={{
        y: -8,
        scale: 1.015,
        transition: { type: 'spring', stiffness: 400, damping: 22 },
      }}
      whileTap={{
        scale: 0.97,
        transition: { type: 'spring', stiffness: 500, damping: 25 },
      }}
      className={`relative cursor-pointer transition-shadow duration-300 ${className}`}
    >
      <div style={{ transform: 'translateZ(15px)' }}>{children}</div>
    </motion.div>
  );
}
