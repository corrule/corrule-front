import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/services/api';
import {
  Shield,
  ArrowRight,
  CheckCircle2,
  BarChart3,
  Lock,
  Zap,
  BookOpen,
  Users,
  Loader2,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PlatformStats {
  totalRules: number;
  totalUsers: number;
  totalDownloads: number;
  totalEarnings: number;
}

interface Testimonial {
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
}

export default function Welcome() {
  const [stats, setStats] = useState<PlatformStats>({
    totalRules: 5000,
    totalUsers: 2500,
    totalDownloads: 150000,
    totalEarnings: 50000,
  });
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlatformStats();
    fetchTestimonials();
  }, []);

  const fetchPlatformStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/public/platform-stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.data || stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTestimonials = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/public/testimonials`);
      if (response.ok) {
        const data = await response.json();
        setTestimonials(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch testimonials:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-card/90 backdrop-blur-md border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold text-foreground">Corrule</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition text-sm font-medium">
                Features
              </a>
              <a href="#services" className="text-muted-foreground hover:text-foreground transition text-sm font-medium">
                Services
              </a>
              <a href="#stats" className="text-muted-foreground hover:text-foreground transition text-sm font-medium">
                Platform
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" className="text-foreground/90 hover:text-foreground">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-primary hover:brightness-90 text-primary-foreground">Get Started Free</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <Badge className="mb-4 inline-block bg-primary/10 text-primary border border-border/20">
              ✨ Trusted by Security Professionals
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Discover & Share{' '}
              <span className="bg-clip-text text-transparent gradient-text">Security Rules</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              The modern platform for cybersecurity professionals to discover, create, and monetize MITRE ATT&CK aligned security rules.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link to="/register">
                <Button className="bg-primary hover:brightness-90 text-primary-foreground h-12 px-8 text-lg flex items-center gap-2">
                  Start For Free <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  variant="outline"
                  className="h-12 px-8 text-lg border-border text-muted-foreground hover:bg-card/50"
                >
                  View Rules
                </Button>
              </Link>
            </div>

            {/* Platform Stats */}
            <div className="grid grid-cols-3 gap-6 md:gap-12 max-w-3xl mx-auto">
              <div className="text-center">
                {loading ? (
                  <Loader2 className="w-8 h-8 text-primary mx-auto mb-2 animate-spin" />
                ) : (
                  <>
                    <p className="text-3xl md:text-4xl font-bold text-primary">{stats.totalRules.toLocaleString()}</p>
                    <p className="text-muted-foreground text-sm md:text-base">Security Rules</p>
                  </>
                )}
              </div>
              <div className="text-center">
                {loading ? (
                  <Loader2 className="w-8 h-8 text-primary mx-auto mb-2 animate-spin" />
                ) : (
                  <>
                    <p className="text-3xl md:text-4xl font-bold text-primary">{stats.totalUsers.toLocaleString()}</p>
                    <p className="text-muted-foreground text-sm md:text-base">Active Users</p>
                  </>
                )}
              </div>
              <div className="text-center">
                {loading ? (
                  <Loader2 className="w-8 h-8 text-primary mx-auto mb-2 animate-spin" />
                ) : (
                  <>
                    <p className="text-3xl md:text-4xl font-bold text-primary">{(stats.totalDownloads)}</p>
                    <p className="text-muted-foreground text-sm md:text-base">Total Downloads</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Powerful Features</h2>
            <p className="text-lg text-muted-foreground">Everything you need to manage security rules effectively</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: BookOpen,
                title: 'Extensive Rule Library',
                description: 'Access thousands of pre-built security rules curated by experts, all aligned with MITRE ATT&CK framework',
              },
              {
                icon: BarChart3,
                title: 'Analytics Dashboard',
                description: 'Track rule performance with real-time analytics, downloads, views, and engagement metrics',
              },
              {
                icon: Shield,
                title: 'MITRE ATT&CK Aligned',
                description: 'All rules are mapped to MITRE ATT&CK tactics and techniques for standardized threat coverage',
              },
              {
                icon: Zap,
                title: 'Easy Rule Creation',
                description: 'Create custom rules with our intuitive editor and share them with the community',
              },
              {
                icon: Lock,
                title: 'Secure & Private',
                description: 'Enterprise-grade security with encrypted transactions and strict data privacy controls',
              },
              {
                icon: Users,
                title: 'Monetize Your Expertise',
                description: 'Earn revenue by creating and selling high-quality security rules to professionals',
              },
            ].map((feature, i) => (
              <Card key={i} className="glass hover:glow-primary transition">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-card/60 rounded-lg">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-lg text-foreground">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Our Services</h2>
            <p className="text-lg text-muted-foreground">Comprehensive solutions for your security needs</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: BookOpen,
                title: 'Rule Discovery & Marketplace',
                description: 'Browse thousands of security rules, filter by MITRE techniques, and purchase verified rules from trusted contributors.',
                features: ['Advanced Search', 'Verified Vendors', 'Community Reviews'],
              },
              {
                icon: Zap,
                title: 'Rule Creation & Publishing',
                description: 'Create sophisticated security rules with our visual editor, test them, and publish to reach a global audience of security professionals.',
                features: ['Visual Editor', 'MITRE Mapping', 'Version Control'],
              },
              {
                icon: Users,
                title: 'Community Collaboration',
                description: 'Connect with thousands of security experts, share knowledge, collaborate on rule development, and build your reputation.',
                features: ['Expert Network', 'Forum & Chat', 'Verified Badges'],
              },
              {
                icon: BarChart3,
                title: 'Analytics & Insights',
                description: 'Get deep insights into rule performance, user engagement, market trends, and optimization recommendations.',
                features: ['Real-time Stats', 'Performance Metrics', 'Growth Analytics'],
              },
            ].map((service, i) => (
              <Card key={i} className="glass">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-3 bg-card/60 rounded-lg">
                        <service.icon className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl text-foreground">{service.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6">{service.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {service.features.map((feature, j) => (
                      <Badge key={j} className="bg-card/60 text-muted-foreground border-border">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Trusted by Security Professionals</h2>
            <p className="text-lg text-muted-foreground">See what our users have to say</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.length > 0 ? (
              testimonials.map((testimonial, i) => (
                <Card key={i} className="glass">
                  <CardContent className="pt-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, j) => (
                        <span key={j} className="text-yellow-400">
                          ★
                        </span>
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4">"{testimonial.content}"</p>
                    <div>
                      <p className="font-semibold text-foreground">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.role} at {testimonial.company}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="md:col-span-3 text-center">
                <Loader2 className="w-8 h-8 text-primary mx-auto mb-2 animate-spin" />
                <p className="text-muted-foreground">Loading testimonials...</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats Highlight Section */}
      <section id="stats" className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-card to-background">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">Platform Growth</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <p className="text-4xl font-bold text-primary mb-2">{stats.totalRules.toLocaleString()}</p>
              <p className="text-muted-foreground">Security Rules</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-primary mb-2">{stats.totalUsers.toLocaleString()}</p>
              <p className="text-muted-foreground">Active Users</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-primary mb-2">{(stats.totalDownloads)}</p>
              <p className="text-muted-foreground">Total Downloads</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-primary mb-2">${(stats.totalEarnings / 1000).toFixed(0)}K</p>
              <p className="text-muted-foreground">Creator Earnings</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Get in Touch</h2>
            <p className="text-xl text-muted-foreground">Have questions? We'd love to hear from you.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Email */}
            <Card className="glass text-center">
              <CardContent className="pt-8">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Mail className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Email</h3>
                <p className="text-muted-foreground mb-4">Reach out to us via email</p>
                <a href="mailto:support@corrule.com" className="text-primary hover:text-primary/80 font-medium">
                  support@corrule.com
                </a>
              </CardContent>
            </Card>

            {/* Phone */}
            <Card className="glass text-center">
              <CardContent className="pt-8">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Phone className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Phone</h3>
                <p className="text-muted-foreground mb-4">Call us during business hours</p>
                <a href="tel:+994553763806" className="text-primary hover:text-primary/80 font-medium">
                  +994 55 376 3806
                </a>
              </CardContent>
            </Card>

            {/* Address */}
            <Card className="glass text-center">
              <CardContent className="pt-8">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <MapPin className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Office</h3>
                <p className="text-muted-foreground">
                  Bakikhanov<br />
                  Sakit Gojayev Street 25<br />
                  Baku, Azerbaijan
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <Button className="bg-primary hover:brightness-90 text-primary-foreground h-12 px-8 text-lg">
              Send us a Message
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-sidebar py-16 px-4 sm:px-6 lg:px-8 border-t border-sidebar-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-5 gap-12 mb-12">
            {/* Brand */}
            <div className="col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-6 h-6 text-primary" />
                <span className="font-bold text-foreground text-lg">Corrule</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                The modern platform for discovering, creating, and monetizing security rules aligned with MITRE ATT&CK.
              </p>
            </div>

            {/* Product */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Product</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#features" className="text-muted-foreground hover:text-foreground transition text-sm">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#services" className="text-muted-foreground hover:text-foreground transition text-sm">
                    Services
                  </a>
                </li>
                <li>
                  <a href="#stats" className="text-muted-foreground hover:text-foreground transition text-sm">
                    Platform Stats
                  </a>
                </li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Services</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition text-sm">
                    Rule Library
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition text-sm">
                    Rule Editor
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition text-sm">
                    Community Forum
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition text-sm">
                    API Documentation
                  </a>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Company</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition text-sm">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition text-sm">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition text-sm">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition text-sm">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Legal</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition text-sm">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition text-sm">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition text-sm">
                    Cookie Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition text-sm">
                    Security
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-sidebar-border pt-8 mt-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <p className="text-muted-foreground text-sm">© 2026 Corrule. All rights reserved.</p>
              <div className="flex items-center gap-6 mt-4 md:mt-0">
                <a href="#" className="text-muted-foreground hover:text-foreground transition">
                  <span className="text-sm">Twitter</span>
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition">
                  <span className="text-sm">GitHub</span>
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition">
                  <span className="text-sm">LinkedIn</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
