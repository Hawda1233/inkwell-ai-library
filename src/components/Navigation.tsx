import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  BookOpen, 
  Users, 
  BarChart3, 
  Settings, 
  Moon, 
  Sun, 
  Menu, 
  X,
  GraduationCap,
  Library,
  Clock
} from "lucide-react";

interface NavigationProps {
  userRole?: 'admin' | 'student' | null;
}

export const Navigation = ({ userRole }: NavigationProps) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const adminNavItems = [
    { href: "/admin", icon: Home, label: "Dashboard" },
    { href: "/admin/books", icon: BookOpen, label: "Books" },
    { href: "/admin/students", icon: Users, label: "Students" },
    { href: "/admin/sessions", icon: Clock, label: "Sessions" },
    { href: "/admin/analytics", icon: BarChart3, label: "Analytics" },
    { href: "/admin/settings", icon: Settings, label: "Settings" }
  ];

  const studentNavItems = [
    { href: "/student", icon: Home, label: "Dashboard" },
    { href: "/student/catalog", icon: BookOpen, label: "Catalog" },
    { href: "/student/profile", icon: GraduationCap, label: "Profile" }
  ];

  const navItems = userRole === 'admin' ? adminNavItems : studentNavItems;

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="glass-card sticky top-0 z-50 border-b backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 smooth-transition hover:scale-105">
            <div className="w-10 h-10 academic-gradient rounded-lg flex items-center justify-center">
              <Library className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-xl text-foreground">SmartLibrary</h1>
              <p className="text-xs text-muted-foreground">Digital Management</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`nav-link flex items-center space-x-2 ${
                  isActive(item.href) ? 'active' : ''
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="w-9 h-9 rounded-full"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden w-9 h-9 rounded-full"
            >
              {isMobileMenuOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </Button>

            {/* User Actions */}
            {userRole ? (
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  {userRole === 'admin' ? 'Admin Panel' : 'My Profile'}
                </Button>
                <Button variant="academic" size="sm">
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="academic" size="sm">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border/50 py-4 animate-slide-up">
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`nav-link flex items-center space-x-3 ${
                    isActive(item.href) ? 'active' : ''
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};