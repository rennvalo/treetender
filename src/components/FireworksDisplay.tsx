
import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

const FireworksDisplay: React.FC = () => {
  const [fireworks, setFireworks] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    const createFireworks = () => {
      const newFireworks = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x: Math.random() * 80 + 10, // 10% to 90% of container width
        y: Math.random() * 60 + 10, // 10% to 70% of container height
        delay: Math.random() * 2000, // 0-2 second delay
      }));
      setFireworks(newFireworks);
    };

    createFireworks();
    const interval = setInterval(createFireworks, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {fireworks.map((firework) => (
        <div
          key={firework.id}
          className="absolute animate-ping"
          style={{
            left: `${firework.x}%`,
            top: `${firework.y}%`,
            animationDelay: `${firework.delay}ms`,
            animationDuration: '1.5s',
          }}
        >
          <Sparkles 
            className="h-8 w-8 text-yellow-400 drop-shadow-lg" 
            style={{
              filter: 'drop-shadow(0 0 8px rgba(255, 255, 0, 0.8))',
            }}
          />
        </div>
      ))}
      
      {/* Additional sparkle effects */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={`sparkle-${i}`}
          className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-pulse"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3000}ms`,
            animationDuration: `${1 + Math.random() * 2}s`,
          }}
        />
      ))}
    </div>
  );
};

export default FireworksDisplay;
