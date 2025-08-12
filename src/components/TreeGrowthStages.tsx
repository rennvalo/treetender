import React, { useEffect, useState } from 'react';
import { GrowthStage } from '@/lib/api';

interface TreeGrowthStagesProps {
  currentStage: GrowthStage;
  className?: string;
  refreshKey?: number; // Add refreshKey prop
}

const TreeGrowthStages: React.FC<TreeGrowthStagesProps> = ({ currentStage, className = "", refreshKey }) => {
  const [displayStage, setDisplayStage] = useState(currentStage);

  // Update display stage whenever currentStage prop changes OR refreshKey changes
  useEffect(() => {
    console.log("🌱 TreeGrowthStages - currentStage prop changed to:", currentStage, "refreshKey:", refreshKey);
    setDisplayStage(currentStage);
  }, [currentStage, refreshKey]); // Add refreshKey to dependencies

  const stages = [
    { 
      key: 'seedling' as const, 
      label: 'Seedling',
      icon: '🌱',
      description: 'Just planted'
    },
    { 
      key: 'sprout' as const, 
      label: 'Sprout',
      icon: '🌿',
      description: 'First leaves'
    },
    { 
      key: 'sapling' as const, 
      label: 'Sapling',
      icon: '🌳',
      description: 'Young tree'
    },
    { 
      key: 'full_tree' as const, 
      label: 'Full Tree',
      icon: '🌲',
      description: 'Mature tree'
    }
  ];

  const getCurrentStageIndex = () => {
    const index = stages.findIndex(stage => stage.key === displayStage);
    console.log("🌱 TreeGrowthStages - current stage index:", index, "for stage:", displayStage);
    return Math.max(0, index); // Ensure we never return -1
  };

  const currentIndex = getCurrentStageIndex();

  return (
    <div className={`w-full ${className}`}>
      <h3 className="text-lg font-semibold text-green-800 mb-4 text-center">Growth Progress</h3>
      
      {/* Debug info */}
      <div className="text-xs text-gray-500 text-center mb-2">
        Current Stage: {displayStage} (Index: {currentIndex}) - RefreshKey: {refreshKey}
      </div>
      
      {/* Visual Growth Timeline */}
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-8 left-0 right-0 h-1 bg-gray-200 rounded-full">
          <div 
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${currentIndex >= 0 ? (currentIndex / (stages.length - 1)) * 100 : 0}%` }}
          />
        </div>
        
        {/* Stage Icons and Labels */}
        <div className="flex justify-between items-start relative">
          {stages.map((stage, index) => {
            const isCurrentStage = stage.key === displayStage;
            const isCompleted = index < currentIndex;
            const isPending = index > currentIndex;
            
            console.log(`🌱 Stage ${stage.key}: isCurrent=${isCurrentStage}, isCompleted=${isCompleted}, isPending=${isPending}, index=${index}, currentIndex=${currentIndex}`);
            
            // Determine the styling based on stage state
            let circleClasses = "w-16 h-16 rounded-full flex items-center justify-center text-2xl relative z-10 transition-all duration-300";
            let labelClasses = "font-medium text-sm";
            let descriptionClasses = "text-xs mt-1";
            
            if (isCurrentStage) {
              // Current/Active stage - bright green with pulse
              circleClasses += " bg-green-500 text-white shadow-lg scale-110";
              labelClasses += " text-green-700";
              descriptionClasses += " text-green-600";
            } else if (isCompleted) {
              // Completed stages - lighter green
              circleClasses += " bg-green-400 text-white";
              labelClasses += " text-green-600";
              descriptionClasses += " text-green-500";
            } else {
              // Future/Pending stages - gray
              circleClasses += " bg-gray-200 text-gray-400";
              labelClasses += " text-gray-500";
              descriptionClasses += " text-gray-400";
            }
            
            return (
              <div key={stage.key} className="flex flex-col items-center">
                {/* Stage Icon Circle */}
                <div className={circleClasses}>
                  {stage.icon}
                  {isCurrentStage && (
                    <div className="absolute -inset-1 rounded-full bg-green-400 animate-pulse -z-10" />
                  )}
                </div>
                
                {/* Stage Label */}
                <div className="mt-3 text-center">
                  <p className={labelClasses}>
                    {stage.label}
                  </p>
                  <p className={descriptionClasses}>
                    {stage.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Current Stage Info */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Your tree is currently a <span className="font-semibold text-green-700 capitalize">{displayStage}</span>
        </p>
        {displayStage !== 'full_tree' && (
          <p className="text-xs text-gray-500 mt-1">
            Keep caring for your tree to help it grow to the next stage!
          </p>
        )}
      </div>
    </div>
  );
};

export default TreeGrowthStages;
