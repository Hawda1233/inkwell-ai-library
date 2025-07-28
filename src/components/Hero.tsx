import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Users, 
  BarChart3, 
  Smartphone, 
  Shield, 
  Zap,
  Library,
  GraduationCap,
  QrCode,
  Bell
} from "lucide-react";

export const Hero = () => {
  const features = [
    {
      icon: BookOpen,
      title: "Smart Book Management",
      description: "Advanced cataloging with Google Books API integration and intelligent categorization"
    },
    {
      icon: QrCode,
      title: "QR Code System",
      description: "Digital library IDs and seamless book issuing with QR/NFC scanning"
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Real-time insights on borrowing trends, popular books, and library usage"
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description: "Automated overdue alerts and real-time updates via multiple channels"
    },
    {
      icon: Smartphone,
      title: "Mobile Optimized",
      description: "Responsive design ensuring perfect experience across all devices"
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "JWT authentication with role-based access and data protection"
    }
  ];

  const stats = [
    { value: "10,000+", label: "Books Managed" },
    { value: "5,000+", label: "Students Served" },
    { value: "99.9%", label: "Uptime" },
    { value: "24/7", label: "Support" }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 academic-gradient opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <Zap className="w-4 h-4 mr-2" />
                Next-Generation Library Management
              </Badge>
            </div>
            
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-6 animate-fade-in">
              Smart Digital
              <span className="block academic-gradient bg-clip-text text-transparent">
                Library System
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 animate-fade-in">
              Revolutionizing library management for Indian colleges and public libraries with 
              AI-powered features, QR code integration, and modern user experience that surpasses 
              traditional systems like Koha.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16 animate-fade-in">
              <Button size="lg" variant="academic" className="text-lg px-8">
                <GraduationCap className="w-5 h-5 mr-2" />
                Get Started Free
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8">
                <Library className="w-5 h-5 mr-2" />
                View Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
              {stats.map((stat, index) => (
                <div key={index} className="stat-card text-center animate-scale-in">
                  <div className="text-2xl sm:text-3xl font-bold text-primary mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Powerful Features Built for Modern Libraries
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage your library efficiently, from book cataloging 
              to student management and analytics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="library-card group">
                <div className="p-6">
                  <div className="w-12 h-12 academic-gradient rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 smooth-transition">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="glass-card p-12 rounded-2xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
              Ready to Transform Your Library?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join hundreds of libraries across India that have modernized their 
              operations with our smart digital management system.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" variant="academic" className="text-lg px-8">
                Start Free Trial
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8">
                Schedule Demo
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};