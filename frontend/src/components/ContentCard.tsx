import React from 'react';
import { Link } from 'react-router-dom';
import type { ContentPreview } from '../services/contentAggregation';

interface ContentCardProps {
  content: ContentPreview;
  className?: string;
}

const contentTypeIcons = {
  blog: '📝',
  music: '🎵',
  video: '🎥',
  audio: '🎧'
};

const contentTypeColors = {
  blog: 'bg-blue-50 text-blue-700 border-blue-200',
  music: 'bg-purple-50 text-purple-700 border-purple-200',
  video: 'bg-red-50 text-red-700 border-red-200',
  audio: 'bg-green-50 text-green-700 border-green-200'
};

export const ContentCard: React.FC<ContentCardProps> = ({ content, className = '' }) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  return (
    <Link 
      to={content.url}
      className={`block bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200 overflow-hidden ${className}`}
    >
      {/* Image/Thumbnail */}
      {content.imageUrl && (
        <div className="aspect-video w-full overflow-hidden">
          <img
            src={content.imageUrl}
            alt={content.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
            loading="lazy"
          />
        </div>
      )}
      
      {/* Content */}
      <div className="p-4">
        {/* Content type badge */}
        <div className="flex items-center justify-between mb-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${contentTypeColors[content.contentType]}`}>
            <span className="mr-1">{contentTypeIcons[content.contentType]}</span>
            {content.contentType.charAt(0).toUpperCase() + content.contentType.slice(1)}
          </span>
          <time className="text-xs text-gray-500" dateTime={content.publishDate.toISOString()}>
            {formatDate(content.publishDate)}
          </time>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
          {content.title}
        </h3>

        {/* Description */}
        {content.description && (
          <p className="text-sm text-gray-600 line-clamp-3">
            {content.description}
          </p>
        )}
      </div>
    </Link>
  );
};