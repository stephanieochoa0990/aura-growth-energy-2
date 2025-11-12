import React from 'react';

interface ClassCardProps {
  title: string;
  instructor: string;
  level: string;
  duration: string;
  price: number;
  date: string;
  time: string;
  capacity: number;
  enrolled: number;
  image: string;
  type: string;
  onBook: () => void;
}

const ClassCard: React.FC<ClassCardProps> = ({
  title,
  instructor,
  level,
  duration,
  price,
  date,
  time,
  capacity,
  enrolled,
  image,
  type,
  onBook,
}) => {
  const spotsLeft = capacity - enrolled;
  const isAlmostFull = spotsLeft <= 3;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-purple-100">
      <div className="relative h-48 overflow-hidden">
        <img src={image} alt={title} className="w-full h-full object-cover" />
        <div className="absolute top-3 right-3 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
          {level}
        </div>
      </div>
      <div className="p-6">
        <div className="text-xs text-purple-600 font-semibold mb-2 uppercase tracking-wide">{type}</div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm mb-4">with {instructor}</p>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <span className="mr-2">📅</span>
            <span>{date} at {time}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <span className="mr-2">⏱️</span>
            <span>{duration}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl font-bold text-purple-600">${price}</span>
          <span className={`text-sm ${isAlmostFull ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
            {spotsLeft} spots left
          </span>
        </div>

        <button
          onClick={onBook}
          disabled={spotsLeft === 0}
          className={`w-full py-3 rounded-lg font-semibold transition-all ${
            spotsLeft === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-md hover:shadow-lg'
          }`}
        >
          {spotsLeft === 0 ? 'Fully Booked' : 'Book Now'}
        </button>
      </div>
    </div>
  );
};

export default ClassCard;
