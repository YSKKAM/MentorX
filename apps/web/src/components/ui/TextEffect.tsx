'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TextEffectProps {
  children: string;
  className?: string;
  per?: 'char' | 'word';
  variants?: any;
  trigger?: boolean;
  loop?: boolean;
  loopInterval?: number;
}

const defaultBlurSlideVariants = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.02 },
    },
    exit: {
      opacity: 0,
      transition: { staggerChildren: 0.01, staggerDirection: -1 },
    },
  },
  item: {
    hidden: {
      opacity: 0,
      filter: 'blur(10px) brightness(0%)',
      y: 0,
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px) brightness(100%)',
      transition: {
        duration: 0.4,
      },
    },
    exit: {
      opacity: 0,
      y: -30,
      filter: 'blur(10px) brightness(0%)',
      transition: {
        duration: 0.4,
      },
    },
  },
};

export function TextEffect({
  children,
  className = '',
  per = 'char',
  variants = defaultBlurSlideVariants,
  trigger: externalTrigger,
  loop = false,
  loopInterval = 3000,
}: TextEffectProps) {
  const [internalTrigger, setInternalTrigger] = useState(true);

  useEffect(() => {
    if (!loop) return;
    const interval = setInterval(() => {
      setInternalTrigger((prev) => !prev);
    }, loopInterval);
    return () => clearInterval(interval);
  }, [loop, loopInterval]);

  const activeTrigger = externalTrigger !== undefined ? externalTrigger : internalTrigger;

  const elements = per === 'char' ? children.split('') : children.split(' ');

  return (
    <AnimatePresence mode="wait">
      {activeTrigger && (
        <motion.span
          className={`inline-flex flex-wrap ${className}`}
          variants={variants.container}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {elements.map((el, index) => (
            <motion.span
              key={index}
              variants={variants.item}
              className="inline-block whitespace-pre"
            >
              {el === ' ' ? '\u00A0' : el}
            </motion.span>
          ))}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
