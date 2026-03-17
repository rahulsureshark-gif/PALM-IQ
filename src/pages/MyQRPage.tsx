import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, Download, Copy, Check, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import palmLogo from '@/assets/palm-iq-logo.png';

export default function MyQRPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [copied, setCopied] = useState(false);

  const userName = user?.displayName || 'Demo User';
  const userPhone = '7338547046';
  const upiId = `palmiq@upi`;

  // Generate QR data - in real app this would be a proper UPI deep link
  const qrData = amount 
    ? `upi://pay?pa=${upiId}&pn=${encodeURIComponent(userName)}&am=${amount}&cu=INR`
    : `upi://pay?pa=${upiId}&pn=${encodeURIComponent(userName)}&cu=INR`;

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    toast.success('UPI ID copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Pay via Palm IQ',
      text: amount 
        ? `Pay ₹${amount} to ${userName}\nUPI ID: ${upiId}`
        : `Pay ${userName} via UPI\nUPI ID: ${upiId}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        navigator.clipboard.writeText(shareData.text);
        toast.success('Payment details copied!');
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        navigator.clipboard.writeText(shareData.text);
        toast.success('Payment details copied!');
      }
    }
  };

  const handleDownload = () => {
    const svg = document.getElementById('payment-qr');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = 300;
      canvas.height = 300;
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 300, 300);
        ctx.drawImage(img, 0, 0, 300, 300);
        
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `palm-iq-payment-qr.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
        toast.success('QR code downloaded!');
      }
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <MobileLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-secondary/80 backdrop-blur">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-display font-semibold text-lg">Receive Payment</h1>
          <button onClick={handleShare} className="p-2 rounded-full bg-secondary/80">
            <Share2 className="w-6 h-6" />
          </button>
        </div>

        {/* QR Code Section */}
        <motion.div 
          className="flex flex-col items-center px-6 py-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* QR Card */}
          <div className="w-full max-w-xs bg-white rounded-3xl p-6 shadow-lg">
            {/* User Info */}
            <div className="flex items-center gap-3 mb-6">
              <img src={palmLogo} alt="Palm IQ" className="w-10 h-10 rounded-xl" />
              <div>
                <h2 className="font-semibold text-gray-900">{userName}</h2>
                <p className="text-sm text-gray-500">{upiId}</p>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex justify-center p-4 bg-white rounded-2xl">
              <QRCodeSVG
                id="payment-qr"
                value={qrData}
                size={200}
                level="H"
                includeMargin={true}
                imageSettings={{
                  src: palmLogo,
                  height: 40,
                  width: 40,
                  excavate: true,
                }}
              />
            </div>

            {/* Amount Display */}
            {amount && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500">Amount</p>
                <p className="text-2xl font-bold text-gray-900">₹{amount}</p>
              </div>
            )}
          </div>

          {/* UPI ID Copy */}
          <button
            onClick={handleCopyUPI}
            className="flex items-center gap-2 mt-6 px-4 py-2 rounded-full bg-secondary"
          >
            <span className="text-sm font-medium">{upiId}</span>
            {copied ? (
              <Check className="w-4 h-4 text-palm-success" />
            ) : (
              <Copy className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {/* Set Amount */}
          <div className="w-full max-w-xs mt-8">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Set Amount (Optional)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold">₹</span>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="pl-8 h-14 text-xl font-semibold text-center"
              />
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              QR code will update with the amount
            </p>
          </div>
        </motion.div>

        {/* Bottom Actions */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background to-transparent">
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1 h-14"
              onClick={handleDownload}
            >
              <Download className="w-5 h-5 mr-2" />
              Save QR
            </Button>
            <Button 
              className="flex-1 h-14 btn-gradient"
              onClick={handleShare}
            >
              <Share2 className="w-5 h-5 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
