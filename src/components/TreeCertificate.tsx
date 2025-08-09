
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download } from 'lucide-react';

interface TreeCertificateProps {
  treeName: string;
  userName: string;
  onClose: () => void;
  onBack: () => void;
}

const TreeCertificate: React.FC<TreeCertificateProps> = ({
  treeName,
  userName,
  onClose,
  onBack
}) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const handleDownload = () => {
    // This would typically trigger a download of the certificate
    // For now, we'll just show a toast or alert
    alert('Certificate download functionality would be implemented here');
  };

  return (
    <div className="p-8 bg-white">
      <div className="flex justify-between items-center mb-6">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleDownload} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
      </div>
      
      <div className="max-w-2xl mx-auto bg-gradient-to-br from-green-50 to-emerald-100 border-4 border-green-600 rounded-lg p-8 shadow-2xl">
        {/* Certificate Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🌲</div>
          <h1 className="text-3xl font-bold text-green-800 mb-2">Certificate of Achievement</h1>
          <div className="w-32 h-1 bg-green-600 mx-auto rounded"></div>
        </div>
        
        {/* Certificate Body */}
        <div className="text-center space-y-6">
          <p className="text-lg text-gray-700">This is to certify that</p>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border-2 border-green-300">
            <h2 className="text-2xl font-bold text-green-800">{userName}</h2>
          </div>
          
          <p className="text-lg text-gray-700">
            has successfully nurtured and grown a magnificent
          </p>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border-2 border-green-300">
            <h3 className="text-xl font-bold text-green-700">{treeName}</h3>
          </div>
          
          <p className="text-lg text-gray-700">
            from seedling to full maturity through dedicated care, 
            consistent nurturing, and environmental stewardship.
          </p>
          
          <div className="bg-green-100 rounded-lg p-4 border border-green-300">
            <p className="text-sm text-green-800 font-medium">
              🌍 In recognition of this achievement, a real tree has been planted 
              in your name, contributing to global reforestation efforts.
            </p>
          </div>
        </div>
        
        {/* Certificate Footer */}
        <div className="mt-8 flex justify-between items-end">
          <div className="text-left">
            <div className="text-sm text-gray-600">Date</div>
            <div className="font-semibold text-green-800">{currentDate}</div>
          </div>
          
          <div className="text-center">
            <div className="w-32 border-b-2 border-green-600 mb-2"></div>
            <div className="text-sm text-gray-600">TreeTend Foundation</div>
          </div>
          
          <div className="text-right">
            <div className="text-4xl text-green-600">🏆</div>
          </div>
        </div>
      </div>
      
      <div className="text-center mt-6">
        <Button onClick={onClose} className="bg-green-600 hover:bg-green-700 text-white px-8">
          Close Certificate
        </Button>
      </div>
    </div>
  );
};

export default TreeCertificate;
