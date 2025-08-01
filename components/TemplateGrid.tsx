import React, { useState, useEffect, useRef } from 'react';
import { TemplateSlot, Photo } from '../types';

interface TemplateGridProps {
  templateSlots: TemplateSlot[];
  photos: Photo[];
  selectedSlot: TemplateSlot | null;
  onSlotClick: (slot: TemplateSlot) => void;
  onSwapTemplate?: (template: { templateId: string; templateName: string; slots: TemplateSlot[] }) => void;
  onDeleteTemplate?: (templateId: string) => void;
  onDownloadTemplate?: (template: { templateId: string; templateName: string; slots: TemplateSlot[] }) => void;
  TemplateVisual: React.ComponentType<any>;
  layout?: 'horizontal' | 'vertical' | 'main' | 'coverflow';
  showActions?: boolean;
  isEditingMode?: boolean;
  editingSlot?: TemplateSlot | null;
}

export default function TemplateGrid({
  templateSlots,
  photos,
  selectedSlot,
  onSlotClick,
  onSwapTemplate,
  onDeleteTemplate,
  onDownloadTemplate,
  TemplateVisual,
  layout = 'horizontal',
  showActions = true,
  isEditingMode = false,
  editingSlot = null
}: TemplateGridProps) {
  
  // Cover Flow state
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Touch swipe state for coverflow navigation
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  
  // Container-aware sizing state
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  
  // Dynamic sizing calculation based on actual available space
  const calculateOptimalSize = () => {
    const availableWidth = containerSize.width || windowSize.width || 1024;
    const availableHeight = containerSize.height || windowSize.height || 768;
    
    // Calculate optimal template width based on available space
    // Leave margins for navigation arrows and padding
    const horizontalMargin = 120; // Space for side arrows and padding
    const verticalMargin = 100;   // Space for buttons and padding
    
    const maxWidth = availableWidth - horizontalMargin;
    const maxHeight = availableHeight - verticalMargin;
    
    // Template aspect ratio for 4R (typical photo template)
    const templateAspectRatio = 2/3; // width/height ratio
    
    // Calculate width-constrained and height-constrained sizes
    const widthConstrainedWidth = Math.min(maxWidth, 600); // Cap at reasonable maximum
    const widthConstrainedHeight = widthConstrainedWidth / templateAspectRatio;
    
    const heightConstrainedHeight = Math.min(maxHeight, 800); // Cap at reasonable maximum  
    const heightConstrainedWidth = heightConstrainedHeight * templateAspectRatio;
    
    // Use the smaller of the two to ensure template fits in both dimensions
    const optimalWidth = Math.min(widthConstrainedWidth, heightConstrainedWidth);
    const optimalSpacing = Math.max(100, optimalWidth * 0.4); // Spacing proportional to template size
    
    return {
      width: Math.max(250, Math.min(optimalWidth, 600)), // Min 250px, max 600px
      spacing: optimalSpacing
    };
  };

  // Group slots by template
  const templateGroups = Object.values(
    templateSlots.reduce((acc, slot) => {
      if (!acc[slot.templateId]) {
        acc[slot.templateId] = {
          templateId: slot.templateId,
          templateName: slot.templateName,
          slots: [],
        };
      }
      acc[slot.templateId].slots.push(slot);
      return acc;
    }, {} as Record<string, { templateId: string; templateName: string; slots: TemplateSlot[] }>)
  );

  // Cover Flow navigation
  const navigateToTemplate = (index: number) => {
    if (isEditingMode) {
      console.log('🚫 Template navigation blocked - editing in progress');
      return;
    }
    if (index >= 0 && index < templateGroups.length) {
      setCurrentIndex(index);
    }
  };

  // Window resize listener for responsive sizing
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Set initial size
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Container ResizeObserver for precise container measurements
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width: Math.round(width), height: Math.round(height) });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Keyboard navigation for Cover Flow
  useEffect(() => {
    if (layout !== 'coverflow') return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateToTemplate(currentIndex - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateToTemplate(currentIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [layout, currentIndex, templateGroups.length]);

  const containerClasses = layout === 'horizontal' 
    ? "flex space-x-2 sm:space-x-3 overflow-x-auto h-full pb-2" 
    : layout === 'main'
    ? "grid grid-cols-1 md:grid-cols-2 gap-6 p-4"
    : layout === 'coverflow'
    ? "relative w-full h-full flex items-center justify-center overflow-hidden"
    : "space-y-2";

  const itemClasses = layout === 'horizontal' 
    ? "flex-shrink-0 relative pt-4" 
    : layout === 'main'
    ? "relative bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
    : layout === 'coverflow'
    ? "absolute transition-all duration-500 ease-in-out cursor-pointer"
    : "relative";

  const itemStyle = layout === 'horizontal' 
    ? { width: '180px' } 
    : {};

  const visualHeight = layout === 'horizontal' 
    ? undefined 
    : undefined; // Let aspectRatio CSS property control dimensions instead of fixed heights

  // Cover Flow item positioning and styling
  const getCoverFlowStyle = (index: number) => {
    if (layout !== 'coverflow') return {};
    
    const offset = index - currentIndex;
    const absOffset = Math.abs(offset);
    
    // Use dynamic container-aware sizing instead of hardcoded breakpoints
    const { width: baseWidth, spacing } = calculateOptimalSize();
    
    // Determine if this is a mobile-like screen for rotation/scale adjustments
    const isMobileSize = baseWidth <= 400;
    
    // Center item
    if (offset === 0) {
      return {
        transform: 'translateX(0px) scale(1) rotateY(0deg)',
        zIndex: 10,
        opacity: 1,
        width: `${baseWidth}px`,
      };
    }
    
    // Side items
    const translateX = offset * spacing; // Spacing between items
    const scale = Math.max(isMobileSize ? 0.7 : 0.6, 1 - absOffset * 0.2);
    const rotateY = offset > 0 ? (isMobileSize ? 15 : 25) : (isMobileSize ? -15 : -25);
    const opacity = Math.max(0.3, 1 - absOffset * 0.3);
    const zIndex = 10 - absOffset;
    
    return {
      transform: `translateX(${translateX}px) scale(${scale}) rotateY(${rotateY}deg)`,
      zIndex,
      opacity,
      width: `${baseWidth}px`,
    };
  };

  // Touch swipe handlers for coverflow navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    if (layout !== 'coverflow') return;
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    setTouchEnd(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (layout !== 'coverflow') return;
    const touch = e.touches[0];
    setTouchEnd({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = () => {
    if (layout !== 'coverflow' || !touchStart || !touchEnd) return;
    
    const deltaX = touchStart.x - touchEnd.x;
    const deltaY = touchStart.y - touchEnd.y;
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
    const minSwipeDistance = 50;

    if (isHorizontalSwipe && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // Swiped left - go to next template
        navigateToTemplate(currentIndex + 1);
      } else {
        // Swiped right - go to previous template
        navigateToTemplate(currentIndex - 1);
      }
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  return (
    <div 
      ref={containerRef}
      className={containerClasses} 
      style={{ 
        touchAction: layout === 'horizontal' ? 'pan-x' : layout === 'coverflow' ? 'pan-x' : 'auto',
        perspective: layout === 'coverflow' ? '1000px' : 'none'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {templateGroups.map(({ templateId, templateName, slots }, index) => {
        // Check if this template contains the currently editing slot
        const isCurrentEditingTemplate = editingSlot && slots.some(slot => slot.id === editingSlot.id);
        const shouldBlock = isEditingMode && !isCurrentEditingTemplate;
        
        return (
          <div 
            key={templateId} 
            className={`${itemClasses} ${shouldBlock ? 'pointer-events-none brightness-75' : ''}`}
            style={{
              ...itemStyle,
              ...getCoverFlowStyle(index)
            }}
            onClick={() => layout === 'coverflow' ? navigateToTemplate(index) : undefined}
          >
          {/* Title and action buttons at same height */}
          <div className="flex justify-between items-center mb-2 px-3 sm:px-4 md:px-6">
            <h3 className={`font-semibold leading-tight truncate flex-1 ${
              layout === 'horizontal' ? 'text-xs' : 'text-sm'
            }`}>
              {templateName}
            </h3>
            
            {showActions && (
              <div className="flex items-center space-x-1 sm:space-x-2 ml-2">
                {/* Download button for all templates */}
                {onDownloadTemplate && (
                  <button
                    onClick={() => {
                      if (isEditingMode) {
                        console.log('🚫 Download blocked - editing in progress');
                        return;
                      }
                      onDownloadTemplate({ templateId, templateName, slots });
                    }}
                    title="Download Template"
                    className={`bg-gray-500 text-white rounded-full p-1 sm:p-1.5 shadow-sm hover:bg-gray-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 ${
                      isEditingMode ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`${layout === 'horizontal' ? 'h-3 w-3' : 'h-4 w-4'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                )}
                
                {/* Change Template button for all templates */}
                {onSwapTemplate && (
                  <button
                    onClick={() => {
                      if (isEditingMode) {
                        console.log('🚫 Template swap blocked - editing in progress');
                        return;
                      }
                      onSwapTemplate({ templateId, templateName, slots });
                    }}
                    className={`bg-gray-500 text-white px-2 sm:px-3 py-1 rounded-md text-xs font-medium hover:bg-gray-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 shadow-sm ${
                      isEditingMode ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    Change Template
                  </button>
                )}
                
                {/* Delete button for additional templates only */}
                {onDeleteTemplate && templateName.includes('(Additional)') && (
                  <button
                    onClick={() => {
                      if (isEditingMode) {
                        console.log('🚫 Template delete blocked - editing in progress');
                        return;
                      }
                      onDeleteTemplate(templateId);
                    }}
                    title="Delete Print"
                    className={`bg-red-600 text-white rounded-full p-1 sm:p-1.5 shadow-sm hover:bg-red-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                      isEditingMode ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`${layout === 'horizontal' ? 'h-3 w-3' : 'h-4 w-4'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
          
          <div className="w-full overflow-hidden border border-gray-200" style={visualHeight}>
            <TemplateVisual
              key={`template-visual-${templateId}-${slots[0]?.templateType || templateId.split('_')[0]}`}
              template={{ id: slots[0]?.templateType || templateId.split('_')[0], name: templateName, slots: slots.length }}
              slots={slots}
              onSlotClick={onSlotClick}
              photos={photos}
              selectedSlot={selectedSlot}
            />
          </div>
        </div>
        );
      })}
      
      {/* Side Navigation Arrows */}
      {layout === 'coverflow' && (
        <>
          {/* Left Arrow - Previous Template */}
          {currentIndex > 0 && (
            <button
              onClick={() => {
                if (isEditingMode) {
                  console.log('🚫 Previous template blocked - editing in progress');
                  return;
                }
                navigateToTemplate(currentIndex - 1);
              }}
              className={`absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-20 hover:bg-opacity-40 text-white rounded-full p-3 transition-all duration-200 z-30 ${
                isEditingMode ? 'opacity-30 cursor-not-allowed' : ''
              }`}
              title="Previous template"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          
          {/* Right Arrow - Next Template */}
          {currentIndex < templateGroups.length - 1 && (
            <button
              onClick={() => {
                if (isEditingMode) {
                  console.log('🚫 Next template blocked - editing in progress');
                  return;
                }
                navigateToTemplate(currentIndex + 1);
              }}
              className={`absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-20 hover:bg-opacity-40 text-white rounded-full p-3 transition-all duration-200 z-30 ${
                isEditingMode ? 'opacity-30 cursor-not-allowed' : ''
              }`}
              title="Next template"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </>
      )}
    </div>
  );
}