import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Phone, MessageCircle, ExternalLink, HelpCircle, FileText, Shield } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useNavigate, Link } from 'react-router-dom';

const supportOptions = [
  {
    icon: Mail,
    title: 'Email Support',
    description: 'palmiq24@gmail.com',
    action: 'mailto:palmiq24@gmail.com',
    color: 'bg-primary/20 text-primary',
  },
  {
    icon: Phone,
    title: 'Phone Support',
    description: '7338547046',
    action: 'tel:7338547046',
    color: 'bg-palm-success/20 text-palm-success',
  },
  {
    icon: MessageCircle,
    title: 'Chat with Assistant',
    description: 'Get instant answers to your questions',
    action: '/chatbot',
    isInternal: true,
    color: 'bg-palm-info/20 text-palm-info',
  },
];

const faqItems = [
  {
    question: 'How does palm vein payment work?',
    answer: 'Your palm vein pattern is unique like a fingerprint. When you scan at a terminal, it verifies your identity and processes payment from your Palm IQ wallet.',
  },
  {
    question: 'Is my palm data stored in the app?',
    answer: 'No. Your palm vein template is stored securely on the external hardware device, never in the app or cloud. This ensures maximum privacy and security.',
  },
  {
    question: 'What do the health readings mean?',
    answer: 'The app captures body temperature during palm scans. Heart rate and SpO2 are demo features. All readings are informational only and not for medical diagnosis.',
  },
  {
    question: 'How do I report a fraudulent transaction?',
    answer: 'Contact us immediately at palmiq24@gmail.com or call 7338547046. Also file a complaint with your bank and at cybercrime.gov.in if needed.',
  },
  {
    question: 'Can I use Palm IQ for real payments?',
    answer: 'No. This is a prototype demonstration app. All transactions use demo money only. No real banking or payment rails are connected.',
  },
];

export default function HelpSupportPage() {
  const navigate = useNavigate();

  return (
    <MobileLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-display font-bold">Help & Support</h1>
        </div>

        {/* Contact Options */}
        <div className="space-y-3">
          <h2 className="font-semibold text-muted-foreground px-1">Contact Us</h2>
          {supportOptions.map((option) => (
            option.isInternal ? (
              <Link
                key={option.title}
                to={option.action}
                className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/50 border border-border hover:bg-secondary transition-colors"
              >
                <div className={`p-3 rounded-xl ${option.color}`}>
                  <option.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{option.title}</h3>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </Link>
            ) : (
              <a
                key={option.title}
                href={option.action}
                className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/50 border border-border hover:bg-secondary transition-colors"
              >
                <div className={`p-3 rounded-xl ${option.color}`}>
                  <option.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{option.title}</h3>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </a>
            )
          ))}
        </div>

        {/* FAQs */}
        <div className="space-y-3">
          <h2 className="font-semibold text-muted-foreground px-1 flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqItems.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-2xl bg-secondary/50 border border-border"
              >
                <h3 className="font-semibold mb-2">{faq.question}</h3>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-3">
          <h2 className="font-semibold text-muted-foreground px-1">Quick Links</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/privacy-security"
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-secondary/50 border border-border hover:bg-secondary transition-colors"
            >
              <Shield className="w-6 h-6 text-primary" />
              <span className="text-sm font-medium">Privacy & Security</span>
            </Link>
            <Link
              to="/chatbot"
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-secondary/50 border border-border hover:bg-secondary transition-colors"
            >
              <FileText className="w-6 h-6 text-primary" />
              <span className="text-sm font-medium">RBI Guidelines</span>
            </Link>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="p-4 rounded-2xl bg-palm-warning/10 border border-palm-warning/20">
          <p className="text-sm text-palm-warning">
            <strong>Prototype Notice:</strong> Palm IQ is a demonstration app. No real money or banking 
            services are involved. For actual payment issues, contact your bank directly.
          </p>
        </div>
      </div>
    </MobileLayout>
  );
}
