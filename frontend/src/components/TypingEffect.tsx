'use client';

import React, { useState, useEffect } from 'react';

const phrases = [
  "Detecting weapons in real-time.",
  "Protecting students and staff.",
  "AI-powered school security.",
  "Instant threat alerts."
];

const TypingEffect: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [text, setText] = useState('');
  const typingSpeed = 100;
  const deletingSpeed = 50;
  const pauseDuration = 1500;

  useEffect(() => {
    if (index >= phrases.length) {
        setIndex(0); // Loop back to the first phrase
        return;
    }

    const currentPhrase = phrases[index];

    // Typing logic
    if (!isDeleting && subIndex < currentPhrase.length) {
      const timeout = setTimeout(() => {
        setText(text + currentPhrase[subIndex]);
        setSubIndex(subIndex + 1);
      }, typingSpeed);
      return () => clearTimeout(timeout);
    }

    // Pause after typing
    if (!isDeleting && subIndex === currentPhrase.length) {
      const timeout = setTimeout(() => {
        setIsDeleting(true);
      }, pauseDuration);
      return () => clearTimeout(timeout);
    }

    // Deleting logic
    if (isDeleting && subIndex > 0) {
      const timeout = setTimeout(() => {
        setText(text.slice(0, -1));
        setSubIndex(subIndex - 1);
      }, deletingSpeed);
      return () => clearTimeout(timeout);
    }

    // Move to next phrase after deleting
    if (isDeleting && subIndex === 0) {
      setIsDeleting(false);
      setIndex((prevIndex) => (prevIndex + 1)); // Move to the next phrase index
       // No need to loop here, handled at the start of useEffect
    }

  }, [subIndex, isDeleting, text, index]);

  return (
    <span 
        className="text-lg md:text-xl font-semibold text-blue-100 transition-all duration-[1500ms] ease-out inline-block h-[1.5em]"
        style={{ textShadow: '0 0 8px rgba(130, 170, 255, 0.8)' }}
    >
      {text}
      <span 
        className="cursor-blink text-blue-200"
        style={{
          animation: 'blink 1s step-end infinite',
        }}
      >|</span>
    </span>
  );
};

export default TypingEffect;
