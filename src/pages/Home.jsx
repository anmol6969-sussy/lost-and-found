import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { SearchIcon, ShieldCheck, MessageSquare } from "lucide-react";
import { Navbar } from "@/components/Navbar";

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: SearchIcon,
      title: "Smart Search",
      description: "Find items quickly with our advanced filtering and category system",
    },
    {
      icon: ShieldCheck,
      title: "Secure & Private",
      description: "Your personal information stays protected with our secure chat system",
    },
    {
      icon: MessageSquare,
      title: "Direct Communication",
      description: "Connect with finders or owners through our built-in messaging",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Navbar />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Lost Something?
            <span className="block text-primary mt-2">We'll Help You Find It</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            A modern platform connecting people who have lost items with those who have found them. 
            Report, search, and reunite with your belongings easily.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate("/items")}
              className="text-lg px-8"
            >
              <SearchIcon className="mr-2 h-5 w-5" />
              Browse Items
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate("/report")}
              className="text-lg px-8"
            >
              Report an Item
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12">
          Why Choose FindIt?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="p-8 hover:shadow-lg transition-shadow">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                <feature.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="p-12 bg-primary text-primary-foreground text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of users who have successfully reunited with their lost items
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => navigate("/auth?mode=signup")}
            className="text-lg px-8"
          >
            Create Free Account
          </Button>
        </Card>
      </section>
    </div>
  );
};

export default Home;
