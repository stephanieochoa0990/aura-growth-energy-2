import React from 'react';
import { Star } from 'lucide-react';

interface TestimonialCardProps {
  name: string;
  text: string;
  rating: number;
  transformation: string;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ name, text, rating, transformation }) => {
  return (
    <div className="bg-gradient-to-r from-purple-900/80 to-indigo-900/80 backdrop-blur-md border border-purple-400/30 rounded-3xl p-10 shadow-2xl transform hover:scale-[1.01] transition-all">
      <div className="flex justify-center mb-6">
        {[...Array(rating)].map((_, i) => (
          <Star key={i} className="w-7 h-7 text-amber-400 fill-current" />
        ))}
      </div>
      <p className="text-xl text-purple-100 italic mb-8 text-center leading-relaxed">"{text}"</p>
      <div className="text-center">
        <p className="font-bold text-2xl text-amber-300 mb-2">{name}</p>
        <div className="inline-block px-6 py-2 bg-gradient-to-r from-purple-700/50 to-indigo-700/50 rounded-full">
          <p className="text-purple-200 font-medium">{transformation}</p>
        </div>
      </div>
    </div>
  );
};

export default TestimonialCard;