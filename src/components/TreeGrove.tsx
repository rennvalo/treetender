import React from 'react';
import { TreePine, TreeDeciduous } from 'lucide-react';
import { Tree as ApiTree } from '@/lib/api';

interface TreeGroveProps {
  trees: ApiTree[];
  currentTreeId?: number;
  onTreeSelect?: (treeId: number) => void;
}

const TreeGrove: React.FC<TreeGroveProps> = ({ trees, currentTreeId, onTreeSelect }) => {
  // Filter to only full-grown trees
  const fullGrownTrees = trees.filter(tree => tree.growth_stage === 'full_tree');

  const getTreeIcon = (speciesName?: string) => {
    // You can customize icons based on species
    switch (speciesName?.toLowerCase()) {
      case 'pine':
        return TreePine;
      case 'oak':
      default:
        return TreeDeciduous;
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-center space-x-2 mb-2">
        <h3 className="text-lg font-semibold text-green-800">Your Tree Grove</h3>
        <span className="text-sm text-gray-600">({fullGrownTrees.length} trees)</span>
      </div>
      {fullGrownTrees.length === 0 ? (
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No full grown trees yet. Keep caring for your trees to grow your grove!</p>
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-3">
          {fullGrownTrees.map((tree) => {
            const IconComponent = getTreeIcon(tree.tree_species?.name);
            const isCurrent = tree.id === currentTreeId;

            return (
              <div
                key={tree.id}
                className={`
                  relative p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer
                  ${isCurrent
                    ? 'border-green-500 bg-green-50 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-md'
                  }
                `}
                onClick={() => onTreeSelect?.(tree.id)}
                title={`${tree.tree_species?.name || 'Tree'} - ${tree.growth_stage}`}
              >
                <IconComponent
                  className={`
                    h-8 w-8 transition-colors duration-200
                    ${isCurrent ? 'text-green-600' : 'text-green-500 hover:text-green-600'}
                  `}
                />
                {isCurrent && (
                  <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <div className="h-2 w-2 bg-white rounded-full"></div>
                  </div>
                )}
                <div className="text-xs text-center mt-1 text-gray-600">
                  {tree.tree_species?.name || 'Tree'}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {fullGrownTrees.length > 0 && (
        <div className="text-center mt-2">
          <p className="text-sm text-gray-600">
            Click on a tree to switch to it • Grow more trees to expand your grove!
          </p>
        </div>
      )}
    </div>
  );
};

export default TreeGrove;