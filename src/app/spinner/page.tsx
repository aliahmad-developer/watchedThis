'use client';
import { useState } from 'react';

export default function Spinner() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);

  const sections = 12;
  const colors = [
    '#FF6B8A', // pink
    '#00D4DD', // cyan
    '#FF8C42', // orange
    '#FF69B4', // hot pink
    '#A78BFA', // purple
    '#FCD34D', // yellow
    '#34D399', // green
    '#60A5FA', // blue
    '#FF8A80', // coral
    '#A3E635', // lime
    '#38BDF8', // light blue
    '#C084FC', // lavender
  ];

  const handleSpin = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    const spins = 5 + Math.random() * 3;
    const extraDegrees = Math.random() * 360;
    const newRotation = rotation + (spins * 360) + extraDegrees;
    
    setRotation(newRotation);
    
    setTimeout(() => {
      setIsSpinning(false);
 
      const normalizedRotation = newRotation % 360;
      const pointerAngle = (360 - normalizedRotation + 90) % 360; 
      const degreesPerSection = 360 / sections;
      const landedSection = Math.floor(pointerAngle / degreesPerSection) + 1;
      
      alert(`Landed on Section ${landedSection}!`);
    }, 4000);
  };

  const degreesPerSection = 360 / sections;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="relative w-96 h-96 mb-8">
      
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-30">
          <svg width="30" height="30" viewBox="0 0 30 30">
            <path d="M15 25 L5 5 L25 5 Z" fill="#374151" />
          </svg>
        </div>

        <div className="absolute inset-0 rounded-full shadow-2xl overflow-hidden">
          <svg 
            className="w-full h-full"
            viewBox="0 0 200 200"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
            }}
          >
            {Array.from({ length: sections }).map((_, index) => {
              const startAngle = (degreesPerSection * index - 90) * (Math.PI / 180);
              const endAngle = (degreesPerSection * (index + 1) - 90) * (Math.PI / 180);
              
              const x1 = 100 + 100 * Math.cos(startAngle);
              const y1 = 100 + 100 * Math.sin(startAngle);
              const x2 = 100 + 100 * Math.cos(endAngle);
              const y2 = 100 + 100 * Math.sin(endAngle);
              
              const pathData = `M 100 100 L ${x1} ${y1} A 100 100 0 0 1 ${x2} ${y2} Z`;
              
              return (
                <path
                  key={index}
                  d={pathData}
                  fill={colors[index]}
                  stroke="white"
                  strokeWidth="0.5"
                />
              );
            })}
          </svg>
        </div>
        
        <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-white rounded-full shadow-md transform -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-gray-800 rounded-full"></div>
        </div>
      </div>
      
      <button
        onClick={handleSpin}
        disabled={isSpinning}
        className={`px-12 py-3 text-lg font-semibold rounded-lg shadow-md transform transition-all ${
          isSpinning 
            ? 'bg-gray-400 cursor-not-allowed' 
            : ''
        } text-white uppercase tracking-wide`}
      >
        {isSpinning ? 'Spinning...' : 'Spin'}
      </button>
    </div>
  );
}