import React from 'react';
import { Star, Sparkles } from 'lucide-react';
interface InstructorCardProps {
  id: string;
  name: string;
  title: string;
  bio: string;
  expertise: string[];
  image: string;
}
const InstructorCard: React.FC<InstructorCardProps> = ({
  name,
  title,
  bio,
  expertise,
  image
}) => {
  return <div className="bg-gradient-to-b from-purple-900/80 to-indigo-900/80 backdrop-blur-md border border-purple-400/30 rounded-3xl p-8 max-w-md shadow-2xl transform hover:scale-[1.02] transition-all">
      <div className="relative mb-6">
        <img src="https://d64gsuwffb70l.cloudfront.net/68f1691de1f12dbc13ceb089_1762548713234_50e953d3.JPG" alt={name} className="w-48 h-48 rounded-full mx-auto object-cover border-4 border-amber-400/50 shadow-xl" />
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-purple-600/20 to-transparent"></div>
      </div>
      <h3 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">{name}</h3>
      <p className="text-purple-200 text-center mb-4 text-lg">{title}</p>
      <p className="text-purple-100 mb-6 text-center leading-relaxed">{bio}</p>
      <div className="flex flex-wrap gap-2 justify-center">
        {expertise.map((skill, index) => <span key={index} className="px-4 py-2 bg-gradient-to-r from-purple-700/50 to-indigo-700/50 text-amber-300 rounded-full text-sm font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {skill}
          </span>)}
      </div>
    </div>;
};
export default InstructorCard;