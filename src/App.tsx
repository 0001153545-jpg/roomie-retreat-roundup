import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Index from "./pages/Index";
import SearchRooms from "./pages/SearchRooms";
import RoomDetail from "./pages/RoomDetail";
import Explore from "./pages/Explore";
import Advertise from "./pages/Advertise";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import MyReservations from "./pages/MyReservations";
import Favorites from "./pages/Favorites";
import MyRooms from "./pages/MyRooms";
import NotFound from "./pages/NotFound";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminRooms from "@/pages/admin/AdminRooms";
import AdminFinancial from "@/pages/admin/AdminFinancial";
import AdminResilience from "@/pages/admin/AdminResilience";

const queryClient = new QueryClient();

const AdminWrapper = ({ children }: { children: React.ReactNode }) => (
  <AdminGuard>
    <AdminLayout>{children}</AdminLayout>
  </AdminGuard>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ThemeProvider>
          <LanguageProvider>
            <CurrencyProvider>
              <AuthProvider>
                <Routes>
                  {/* Admin routes - no Header/Footer */}
                  <Route path="/admin" element={<AdminWrapper><AdminDashboard /></AdminWrapper>} />
                  <Route path="/admin/usuarios" element={<AdminWrapper><AdminUsers /></AdminWrapper>} />
                  <Route path="/admin/quartos" element={<AdminWrapper><AdminRooms /></AdminWrapper>} />
                  <Route path="/admin/financeiro" element={<AdminWrapper><AdminFinancial /></AdminWrapper>} />
                  <Route path="/admin/resiliencia" element={<AdminWrapper><AdminResilience /></AdminWrapper>} />

                  {/* Public routes */}
                  <Route path="*" element={
                    <>
                      <Header />
                      <main className="min-h-screen">
                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route path="/buscar" element={<SearchRooms />} />
                          <Route path="/quarto/:id" element={<RoomDetail />} />
                          <Route path="/explorar" element={<Explore />} />
                          <Route path="/anunciar" element={<Advertise />} />
                          <Route path="/sobre" element={<About />} />
                          <Route path="/contato" element={<Contact />} />
                          <Route path="/login" element={<Login />} />
                          <Route path="/cadastro" element={<Register />} />
                          <Route path="/termos" element={<Terms />} />
                          <Route path="/privacidade" element={<Privacy />} />
                          <Route path="/minhas-reservas" element={<MyReservations />} />
                          <Route path="/favoritos" element={<Favorites />} />
                          <Route path="/meus-quartos" element={<MyRooms />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </main>
                      <Footer />
                    </>
                  } />
                </Routes>
              </AuthProvider>
            </CurrencyProvider>
          </LanguageProvider>
        </ThemeProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
