import React from 'react';
import { FiStar } from 'react-icons/fi';
import { FaStar, FaStarHalfAlt } from 'react-icons/fa';

const RatingStars = ({ rating, size = 'md', interactive = false, onChange }) => {
  const [hoverRating, setHoverRating] = React.useState(0);

  const sizes = {
    sm: 'text-sm',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  const getSizeClass = () => sizes[size] || sizes.md;

  const handleClick = (value) => {
    if (interactive && onChange) {
      onChange(value);
    }
  };

  const handleMouseEnter = (value) => {
    if (interactive) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };

  const renderStar = (index) => {
    const value = index + 1;
    const currentRating = hoverRating || rating;

    if (currentRating >= value) {
      // Full star
      return (
        <FaStar
          className={`${interactive ? 'cursor-pointer' : ''} text-yellow-500 transition-all`}
        />
      );
    } else if (currentRating >= value - 0.5) {
      // Half star
      return (
        <FaStarHalfAlt
          className={`${interactive ? 'cursor-pointer' : ''} text-yellow-500 transition-all`}
        />
      );
    } else {
      // Empty star
      return (
        <FiStar
          className={`${interactive ? 'cursor-pointer hover:text-yellow-500' : ''} text-gray-600 transition-all`}
        />
      );
    }
  };

  return (
    <div className={`flex items-center gap-1 ${getSizeClass()}`}>
      {[0, 1, 2, 3, 4].map((index) => (
        <span
          key={index}
          onClick={() => handleClick(index + 1)}
          onMouseEnter={() => handleMouseEnter(index + 1)}
          onMouseLeave={handleMouseLeave}
          className={interactive ? 'cursor-pointer' : ''}
        >
          {renderStar(index)}
        </span>
      ))}
      {rating > 0 && (
        <span className="ml-2 text-sm text-gray-400 font-medium">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default RatingStars;
