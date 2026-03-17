import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, QrCode, Flashlight, ImageIcon, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';

export default function ScanQRPage() {
  const navigate = useNavigate();
  const [flashOn, setFlashOn] = useState(false);

  return (
    <MobileLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-secondary/80 backdrop-blur">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-display font-semibold text-lg">Scan QR</h1>
          <button 
            onClick={() => setFlashOn(!flashOn)}
            className={`p-2 rounded-full transition-colors ${flashOn ? 'bg-primary text-white' : 'bg-secondary/80'}`}
          >
            <Flashlight className="w-6 h-6" />
          </button>
        </div>

        {/* Scanner Area */}
        <div className="flex flex-col items-center justify-center px-6 py-10">
          <div className="relative w-72 h-72 mb-8">
            {/* Scanner Frame */}
            <div className="absolute inset-0 border-2 border-primary/30 rounded-3xl" />
            
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-3xl" />
            <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-3xl" />
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-3xl" />
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-3xl" />
            
            {/* Scan Line Animation */}
            <motion.div
              className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
              animate={{ top: ['10%', '90%', '10%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Center QR Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="p-6 rounded-2xl bg-secondary/50 backdrop-blur">
                <Camera className="w-12 h-12 text-muted-foreground" />
              </div>
            </div>
          </div>

          <p className="text-center text-muted-foreground mb-2">
            Point camera at QR code
          </p>
          <p className="text-center text-sm text-muted-foreground/70">
            Demo mode - camera access simulated
          </p>
        </div>

        {/* Bottom Actions */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background to-transparent">
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              className="flex-1 h-14"
              onClick={() => {}}
            >
              <ImageIcon className="w-5 h-5 mr-2" />
              Gallery
            </Button>
            <Button 
              className="flex-1 h-14 btn-gradient"
              onClick={() => navigate('/my-qr')}
            >
              <QrCode className="w-5 h-5 mr-2" />
              My QR
            </Button>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
