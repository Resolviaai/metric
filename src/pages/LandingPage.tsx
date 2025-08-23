import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Timer, BarChart3, Moon, Sun, Smartphone, Wifi, Shield } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

export const LandingPage = () => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const features = [
    {
      icon: Timer,
      title: 'Smart Focus Timer',
      description: 'Track your productivity with intelligent inactivity detection and alerts.',
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Visualize your productivity patterns with detailed charts and insights.',
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your data is protected with enterprise-grade security.',
    },
    {
      icon: Smartphone,
      title: 'Mobile Responsive',
      description: 'Works seamlessly across all your devices.',
    },
    {
      icon: Wifi,
      title: 'Offline Support',
      description: 'Continue tracking even without internet connection.',
    },
    {
      icon: theme === 'dark' ? Sun : Moon,
      title: 'Dark/Light Mode',
      description: 'Choose the theme that works best for you.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Timer className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold gradient-text">Metric</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            
            {user ? (
              <Button asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link to="/auth">Get Started</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Master Your{' '}
            <span className="gradient-text">Focus</span>
          </h1>
          <p className="text-xl md:text-2xl text-foreground-secondary mb-8 max-w-2xl mx-auto">
            Track your productivity, analyze your patterns, and achieve peak performance with intelligent focus management.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button size="lg" className="text-lg px-8 py-6" asChild>
              <Link to="/auth">Start Focusing Now</Link>
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              Learn More
            </Button>
          </div>

          {/* Hero Image Placeholder */}
          <div className="relative mx-auto max-w-4xl">
            <Card className="glass-effect border-border/50 overflow-hidden">
              <CardContent className="p-8">
                <div className="aspect-video bg-gradient-primary rounded-lg flex items-center justify-center">
                  <div className="text-center text-primary-foreground">
                    <Timer className="h-16 w-16 mx-auto mb-4 opacity-80" />
                    <p className="text-lg">Metric Dashboard Preview</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything You Need to{' '}
            <span className="gradient-text">Succeed</span>
          </h2>
          <p className="text-xl text-foreground-secondary max-w-2xl mx-auto">
            Powerful features designed to help you understand and improve your productivity patterns.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="card-hover glass-effect border-border/50">
              <CardContent className="p-8 text-center">
                <feature.icon className="h-12 w-12 text-primary mx-auto mb-6" />
                <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                <p className="text-foreground-secondary">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24">
        <Card className="glass-effect border-border/50 max-w-4xl mx-auto">
          <CardContent className="p-16 text-center">
            <h2 className="text-4xl font-bold mb-6">
              Ready to <span className="gradient-text">Transform</span> Your Productivity?
            </h2>
            <p className="text-xl text-foreground-secondary mb-8 max-w-2xl mx-auto">
              Join thousands of users who have already improved their focus and achieved their goals with Metric.
            </p>
            <Button size="lg" className="text-lg px-12 py-6" asChild>
              <Link to="/auth">Get Started for Free</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Timer className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold">Metric</span>
            </div>
            <p className="text-foreground-secondary text-sm">
              © 2024 Metric. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};