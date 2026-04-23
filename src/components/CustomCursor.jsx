import { useState, useEffect } from 'react';

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPointer, setIsPointer] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
      
      const target = e.target;
      setIsPointer(window.getComputedStyle(target).cursor === 'pointer');
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <>
      <div 
        className="cursor-glow"
        style={{ 
          left: `${position.x}px`, 
          top: `${position.y}px`,
          width: isPointer ? '600px' : '400px',
          height: isPointer ? '600px' : '400px',
          opacity: isPointer ? 0.2 : 0.15
        }}
      />
      <div 
        className="fixed w-2 h-2 bg-emerald-400 rounded-full pointer-events-none z-[10000] -translate-x-1/2 -translate-y-1/2 mix-blend-difference transition-transform duration-100 ease-out"
        style={{ 
          left: `${position.x}px`, 
          top: `${position.y}px`,
          transform: `translate(-50%, -50%) scale(${isPointer ? 2.5 : 1})`
        }}
      />
    </>
  );
}
