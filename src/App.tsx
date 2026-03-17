import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { WalletProvider } from "./contexts/WalletContext";
import { HealthProvider } from "./contexts/HealthContext";
import { PalmProvider } from "./contexts/PalmContext";
import { PinProvider } from "./contexts/PinContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { GlobalBackHandler } from "./components/GlobalBackHandler";

import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import HistoryPage from "./pages/HistoryPage";
import HealthPage from "./pages/HealthPage";
import PalmRegisterPage from "./pages/PalmRegisterPage";
import PalmIQPage from "./pages/PalmIQPage";
import ProfilePage from "./pages/ProfilePage";
import TerminalPage from "./pages/TerminalPage";
import NotificationsPage from "./pages/NotificationsPage";
import AddMoneyPage from "./pages/AddMoneyPage";
import ScanQRPage from "./pages/ScanQRPage";
import SendMoneyPage from "./pages/SendMoneyPage";
import AssistantPage from "./pages/AssistantPage";
import HelpSupportPage from "./pages/HelpSupportPage";
import PrivacySecurityPage from "./pages/PrivacySecurityPage";
import ChangePinPage from "./pages/ChangePinPage";
import ForgotPinPage from "./pages/ForgotPinPage";
import MobileRechargePage from "./pages/MobileRechargePage";
import ElectricityBillPage from "./pages/ElectricityBillPage";
import DTHRechargePage from "./pages/DTHRechargePage";
import FASTagPage from "./pages/FASTagPage";
import CreditCardBillPage from "./pages/CreditCardBillPage";
import GiftCardsPage from "./pages/GiftCardsPage";
import AllBillsPage from "./pages/AllBillsPage";
import BankTransferPage from "./pages/BankTransferPage";
import UpiTransferPage from "./pages/UpiTransferPage";
import SelfTransferPage from "./pages/SelfTransferPage";
import ContactTransferPage from "./pages/ContactTransferPage";
import MyQRPage from "./pages/MyQRPage";
import WindowsServerPage from "./pages/WindowsServerPage";
import HardwareSettingsPage from "./pages/HardwareSettingsPage";
import SDKDownloadPage from "./pages/SDKDownloadPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <WalletProvider>
          <HealthProvider>
            <PalmProvider>
              <PinProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <GlobalBackHandler />
                    <Routes>
                      <Route path="/auth" element={<AuthPage />} />
                      <Route path="/terminal" element={<TerminalPage />} />
                      <Route path="/server" element={<WindowsServerPage />} />
                      <Route path="/hardware-settings" element={<ProtectedRoute><HardwareSettingsPage /></ProtectedRoute>} />
                      <Route path="/sdk-download" element={<SDKDownloadPage />} />
                      <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                      <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
                      <Route path="/health" element={<ProtectedRoute><HealthPage /></ProtectedRoute>} />
                      <Route path="/palm-register" element={<ProtectedRoute><PalmRegisterPage /></ProtectedRoute>} />
                      <Route path="/palm-iq" element={<ProtectedRoute><PalmIQPage /></ProtectedRoute>} />
                      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
                      <Route path="/add-money" element={<ProtectedRoute><AddMoneyPage /></ProtectedRoute>} />
                      <Route path="/scan-qr" element={<ProtectedRoute><ScanQRPage /></ProtectedRoute>} />
                      <Route path="/my-qr" element={<ProtectedRoute><MyQRPage /></ProtectedRoute>} />
                      <Route path="/palm-pay" element={<ProtectedRoute><MyQRPage /></ProtectedRoute>} />
                      <Route path="/send-money" element={<ProtectedRoute><ContactTransferPage /></ProtectedRoute>} />
                      <Route path="/request-money" element={<ProtectedRoute><ContactTransferPage /></ProtectedRoute>} />
                      <Route path="/bank-transfer" element={<ProtectedRoute><BankTransferPage /></ProtectedRoute>} />
                      <Route path="/upi-transfer" element={<ProtectedRoute><UpiTransferPage /></ProtectedRoute>} />
                      <Route path="/self-transfer" element={<ProtectedRoute><SelfTransferPage /></ProtectedRoute>} />
                      <Route path="/assistant" element={<ProtectedRoute><AssistantPage /></ProtectedRoute>} />
                      <Route path="/help-support" element={<ProtectedRoute><HelpSupportPage /></ProtectedRoute>} />
                      <Route path="/privacy-security" element={<ProtectedRoute><PrivacySecurityPage /></ProtectedRoute>} />
                      <Route path="/change-pin" element={<ProtectedRoute><ChangePinPage /></ProtectedRoute>} />
                      <Route path="/forgot-pin" element={<ProtectedRoute><ForgotPinPage /></ProtectedRoute>} />
                      <Route path="/recharge" element={<ProtectedRoute><MobileRechargePage /></ProtectedRoute>} />
                      <Route path="/bills" element={<ProtectedRoute><AllBillsPage /></ProtectedRoute>} />
                      <Route path="/bills/electricity" element={<ProtectedRoute><ElectricityBillPage /></ProtectedRoute>} />
                      <Route path="/bills/dth" element={<ProtectedRoute><DTHRechargePage /></ProtectedRoute>} />
                      <Route path="/bills/fastag" element={<ProtectedRoute><FASTagPage /></ProtectedRoute>} />
                      <Route path="/bills/credit-card" element={<ProtectedRoute><CreditCardBillPage /></ProtectedRoute>} />
                      <Route path="/gift-cards" element={<ProtectedRoute><GiftCardsPage /></ProtectedRoute>} />
                      <Route path="/services" element={<ProtectedRoute><AllBillsPage /></ProtectedRoute>} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </BrowserRouter>
                </TooltipProvider>
              </PinProvider>
            </PalmProvider>
          </HealthProvider>
        </WalletProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
