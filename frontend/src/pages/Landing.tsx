import { ChefHat, Clock, Camera, Mic } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

const features = [
  {
    icon: <Clock className="w-6 h-6" />,
    title: 'Real-time Guidance',
    description: 'Step-by-step instructions synchronized with your cooking timeline'
  },
  {
    icon: <Camera className="w-6 h-6" />,
    title: 'Vision Monitoring',
    description: 'AI-powered visual feedback to track your cooking progress'
  },
  {
    icon: <Mic className="w-6 h-6" />,
    title: 'Voice Commands',
    description: 'Hands-free interaction while you focus on cooking'
  }
];

export function Landing() {
  const navigate = useNavigate();
  
  const handleStartDemo = () => {
    navigate('/session/demo');
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center mb-6">
            <motion.div
              className="p-4 bg-primary rounded-full text-primary-foreground"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <ChefHat className="w-12 h-12" />
            </motion.div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Live Cooking Assistant
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Your AI-powered sous chef that provides real-time guidance, visual monitoring, 
            and seamless timing coordination for perfect cooking results.
          </p>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              size="lg" 
              onClick={handleStartDemo}
              className="text-lg px-8 py-6"
            >
              Start Demo Session
            </Button>
          </motion.div>
        </motion.div>
        
        {/* How it Works */}
        <motion.div 
          className="mb-16"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="max-w-4xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl mb-2">How It Works</CardTitle>
              <CardDescription>
                Experience cooking with intelligent, real-time assistance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-8">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                  >
                    <div className="flex items-center justify-center mb-4">
                      <div className="p-3 bg-primary/10 rounded-full text-primary">
                        {feature.icon}
                      </div>
                    </div>
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Demo Features */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Demo Session Features</CardTitle>
              <CardDescription>
                Try out the full cooking assistant experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm">Interactive timeline with real-time progress</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm">Step-by-step cooking instructions</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm">Simulated vision monitoring with sample images</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm">Real-time action log and transport controls</span>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <Button onClick={handleStartDemo} className="w-full">
                  Start Demo Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Footer */}
        <motion.div 
          className="text-center mt-16 text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <p>
            Demo session includes mock data and simulated real-time updates. 
            In production, this would connect to your cooking hardware and AI vision system.
          </p>
        </motion.div>
      </div>
    </div>
  );
}