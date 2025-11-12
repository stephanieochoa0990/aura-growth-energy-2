import React, { useState } from 'react';
import { Card } from '@/components/ui/card';

interface ChakraInfo {
  name: string;
  sanskrit: string;
  planet: string;
  color: string;
  element: string;
  mantra: string;
  position: { top: string; left: string };
  chakraColor: string;
  description: string;
}

const chakras: ChakraInfo[] = [
  {
    name: 'Crown',
    sanskrit: 'Sahasrara',
    planet: 'Sun',
    color: 'Violet/White',
    element: 'Cosmic Energy',
    mantra: 'OM or AUM',
    position: { top: '8%', left: '50%' },
    chakraColor: '#9F7AEA',
    description: 'Connection to divine consciousness'
  },
  {
    name: 'Third Eye',
    sanskrit: 'Ajna',
    planet: 'Moon',
    color: 'Indigo',
    element: 'Light',
    mantra: 'SHAM',
    position: { top: '18%', left: '50%' },
    chakraColor: '#6B46C1',
    description: 'Intuition and inner wisdom'
  },
  {
    name: 'Throat',
    sanskrit: 'Vishuddha',
    planet: 'Mercury',
    color: 'Blue',
    element: 'Ether',
    mantra: 'HAM',
    position: { top: '28%', left: '50%' },
    chakraColor: '#3182CE',
    description: 'Communication and self-expression'
  },
  {
    name: 'Heart',
    sanskrit: 'Anahata',
    planet: 'Venus',
    color: 'Green',
    element: 'Air',
    mantra: 'YAM',
    position: { top: '40%', left: '50%' },
    chakraColor: '#48BB78',
    description: 'Love and compassion'
  },
  {
    name: 'Solar Plexus',
    sanskrit: 'Manipura',
    planet: 'Mars',
    color: 'Yellow',
    element: 'Fire',
    mantra: 'RAM',
    position: { top: '52%', left: '50%' },
    chakraColor: '#F6E05E',
    description: 'Personal power and will'
  },
  {
    name: 'Sacral',
    sanskrit: 'Svadhisthana',
    planet: 'Jupiter',
    color: 'Orange',
    element: 'Water',
    mantra: 'VAM',
    position: { top: '64%', left: '50%' },
    chakraColor: '#ED8936',
    description: 'Creativity and emotions'
  },
  {
    name: 'Root',
    sanskrit: 'Muladhara',
    planet: 'Saturn',
    color: 'Red',
    element: 'Earth',
    mantra: 'LAM',
    position: { top: '76%', left: '50%' },
    chakraColor: '#E53E3E',
    description: 'Grounding and stability'
  }
];

export default function ChakraMap() {
  const [selectedChakra, setSelectedChakra] = useState<ChakraInfo | null>(null);
  const [hoveredChakra, setHoveredChakra] = useState<string | null>(null);

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Body Diagram */}
        <div className="relative bg-gradient-to-b from-purple-50 to-blue-50 rounded-2xl p-8 min-h-[600px]">
          <div className="relative w-full h-full max-w-[300px] mx-auto">
            {/* Body Silhouette SVG */}
            <svg viewBox="0 0 200 500" className="w-full h-full opacity-10">
              <path d="M100 30 C120 30, 130 50, 130 70 L130 180 L150 250 L150 350 L130 450 L120 490 L100 490 L80 490 L70 450 L50 350 L50 250 L70 180 L70 70 C70 50, 80 30, 100 30 Z" 
                fill="currentColor" />
            </svg>
            
            {/* Chakra Points */}
            {chakras.map((chakra) => (
              <div
                key={chakra.name}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                style={{ top: chakra.position.top, left: chakra.position.left }}
                onClick={() => setSelectedChakra(chakra)}
                onMouseEnter={() => setHoveredChakra(chakra.name)}
                onMouseLeave={() => setHoveredChakra(null)}
              >
                <div className="relative">
                  <div 
                    className={`w-12 h-12 rounded-full transition-all duration-300 ${
                      hoveredChakra === chakra.name ? 'scale-125' : ''
                    }`}
                    style={{ backgroundColor: chakra.chakraColor }}
                  >
                    {hoveredChakra === chakra.name && (
                      <>
                        <div className="absolute inset-0 rounded-full animate-ping opacity-75"
                          style={{ backgroundColor: chakra.chakraColor }} />
                        <div className="absolute inset-0 rounded-full animate-pulse"
                          style={{ backgroundColor: chakra.chakraColor, opacity: 0.5 }} />
                      </>
                    )}
                  </div>
                  <span className="absolute top-1/2 left-14 -translate-y-1/2 whitespace-nowrap text-sm font-medium">
                    {chakra.name}
                  </span>
                </div>
              </div>
            ))}
            
            {/* Connecting Line */}
            <div className="absolute left-1/2 top-[8%] bottom-[24%] w-0.5 bg-gradient-to-b from-purple-400 via-blue-400 to-red-400 opacity-30 -translate-x-1/2" />
          </div>
        </div>

        {/* Information Panel */}
        <div className="space-y-4">
          {selectedChakra ? (
            <Card className="p-6 border-2 transition-all duration-300"
              style={{ borderColor: selectedChakra.chakraColor }}>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full"
                    style={{ backgroundColor: selectedChakra.chakraColor }} />
                  <div>
                    <h3 className="text-xl font-bold">{selectedChakra.name} Chakra</h3>
                    <p className="text-sm text-gray-600">{selectedChakra.sanskrit}</p>
                  </div>
                </div>
                
                <p className="text-gray-700">{selectedChakra.description}</p>
                
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div>
                    <p className="text-sm text-gray-500">Planetary Energy</p>
                    <p className="font-semibold">{selectedChakra.planet}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Color</p>
                    <p className="font-semibold">{selectedChakra.color}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Element</p>
                    <p className="font-semibold">{selectedChakra.element}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Mantra</p>
                    <p className="font-semibold">{selectedChakra.mantra}</p>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-6 border-2 border-gray-200">
              <p className="text-center text-gray-500">
                Click on any chakra to view its details
              </p>
            </Card>
          )}
          
          {/* All Chakras List */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg mb-3">All Energy Centers</h3>
            {chakras.map((chakra) => (
              <button
                key={chakra.name}
                onClick={() => setSelectedChakra(chakra)}
                className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                  selectedChakra?.name === chakra.name 
                    ? 'bg-opacity-20' 
                    : 'hover:bg-gray-50'
                }`}
                style={{
                  backgroundColor: selectedChakra?.name === chakra.name 
                    ? `${chakra.chakraColor}20` 
                    : undefined
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: chakra.chakraColor }} />
                  <div className="flex-1">
                    <span className="font-medium">{chakra.name}</span>
                    <span className="text-gray-500 text-sm ml-2">– {chakra.planet}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}