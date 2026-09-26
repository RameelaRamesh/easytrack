import React from 'react';

interface EasyTrackLogoProps {
  iconOnly?: boolean;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}

export const EasyTrackLogo: React.FC<EasyTrackLogoProps> = ({
  iconOnly = false,
  className = "flex items-center space-x-2.5",
  iconClassName = "h-6 w-6 text-teal-400",
  textClassName = "text-xl font-extrabold tracking-tight text-white"
}) => {
  return (
    <div className={className}>
      <svg className={iconClassName} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 12l10 10 10-10L12 2z" className="text-teal-400" fill="currentColor" fillOpacity="0.25" />
        <path d="M12 6.5L6.5 12l5.5 5.5 5.5-5.5L12 6.5z" className="text-teal-400" fill="currentColor" />
      </svg>
      {!iconOnly && <span className={textClassName}>EasyTrack</span>}
    </div>
  );
};

export default EasyTrackLogo;
