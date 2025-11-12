import React from 'react';

interface WhiteLotusProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const WhiteLotus: React.FC<WhiteLotusProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-16 w-16',
    lg: 'h-24 w-24',
    xl: 'h-32 w-32'
  };

  return (
    <img 
      src="https://d64gsuwffb70l.cloudfront.net/68f1691de1f12dbc13ceb089_1762904659748_05042e0c.jpg"
      alt="White Lotus"
      className={`${sizeClasses[size]} object-contain ${className}`}
    />
  );
};

export default WhiteLotus;
export { WhiteLotus };