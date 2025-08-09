
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Award, Sparkles } from 'lucide-react';
import FireworksDisplay from './FireworksDisplay';
import TreeCertificate from './TreeCertificate';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  treeName: string;
  userName: string;
}

const CelebrationModal: React.FC<CelebrationModalProps> = ({
  isOpen,
  onClose,
  treeName,
  userName
}) => {
  const [showCertificate, setShowCertificate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowCertificate(false);
    }
  }, [isOpen]);

  const handleShowCertificate = () => {
    setShowCertificate(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 bg-gradient-to-br from-green-50 to-blue-50">
        {!showCertificate ? (
          <div className="relative p-8 text-center">
            <FireworksDisplay />
            
            <div className="relative z-10">
              <DialogHeader className="mb-6">
                <DialogTitle className="text-4xl font-bold text-green-800 mb-4">
                  🎉 Congratulations! 🎉
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="text-6xl animate-bounce">🌲</div>
                
                <h2 className="text-2xl font-bold text-green-700">
                  Your {treeName} has grown into a magnificent full tree!
                </h2>
                
                <p className="text-lg text-gray-700 max-w-2xl mx-auto">
                  Through your dedicated care and nurturing, you've successfully guided your tree 
                  through all stages of growth. Your commitment to consistent watering, providing 
                  sunlight, feeding, and showing love has paid off!
                </p>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 mx-auto max-w-md shadow-lg">
                  <h3 className="text-xl font-semibold text-green-800 mb-3">
                    🌍 Environmental Impact
                  </h3>
                  <p className="text-gray-700">
                    A tree has been planted in your name to celebrate this achievement! 
                    You're now contributing to a greener planet.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button 
                    onClick={handleShowCertificate}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
                  >
                    <Award className="mr-2 h-5 w-5" />
                    View Certificate
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={onClose}
                    className="px-8 py-3 text-lg"
                  >
                    Continue Caring
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <TreeCertificate 
            treeName={treeName}
            userName={userName}
            onClose={onClose}
            onBack={() => setShowCertificate(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CelebrationModal;
