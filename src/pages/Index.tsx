
import { Button } from "@/components/ui/button";
import { Leaf, Plus, Star } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800 font-sans">
      {/* Header */}
      <header className="w-full py-4 px-6 md:px-12 bg-white/80 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Leaf className="h-8 w-8 text-green-600" />
            <h1 className="text-2xl font-bold text-green-800">TendATree</h1>
          </div>
          <nav className="space-x-2">
            <Button asChild variant="ghost">
              <Link to="/auth">Log In</Link>
            </Button>
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <Link to="/auth">Sign Up</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow">
        <section className="bg-green-50">
          <div className="container mx-auto px-6 md:px-12 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
            <div className="text-center md:text-left">
              <h2 className="text-4xl md:text-6xl font-extrabold text-green-900 leading-tight mb-4">
                Adopt a Virtual Tree,
                <br />
                <span className="text-green-600">Grow a Real Forest.</span>
              </h2>
              <p className="text-lg md:text-xl text-gray-600 max-w-xl mx-auto md:mx-0 mb-8">
                Join TendATree and nurture your own digital tree from a seedling to full bloom. Your virtual success contributes to real-world reforestation projects.
              </p>
              <Button asChild size="lg" className="bg-green-600 hover:bg-green-700 text-lg px-8 py-3">
                <Link to="/auth">Plant Your First Tree</Link>
              </Button>
            </div>
            <div className="flex justify-center">
                <img 
                    src="https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?q=80&w=1200&auto=format&fit=crop" 
                    alt="Lush green tree" 
                    className="rounded-lg shadow-xl max-h-[500px] object-cover"
                />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-white py-20">
          <div className="container mx-auto px-6 md:px-12">
            <h3 className="text-3xl font-bold text-center text-green-800 mb-12">How It Works</h3>
            <div className="grid md:grid-cols-3 gap-12 text-center">
              <div className="flex flex-col items-center">
                <div className="bg-green-100 rounded-full p-4 mb-4">
                  <Plus className="h-10 w-10 text-green-600" />
                </div>
                <h4 className="text-xl font-semibold mb-2">Care For Your Tree</h4>
                <p className="text-gray-600">
                  Water and feed your tree daily. Consistent care helps it grow faster and healthier.
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-green-100 rounded-full p-4 mb-4">
                  <Leaf className="h-10 w-10 text-green-600" />
                </div>
                <h4 className="text-xl font-semibold mb-2">Watch It Grow</h4>
                <p className="text-gray-600">
                  See your tree progress through different stages, from a tiny seedling to a magnificent tree.
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-green-100 rounded-full p-4 mb-4">
                  <Star className="h-10 w-10 text-green-600" />
                </div>
                <h4 className="text-xl font-semibold mb-2">Make a Real Impact</h4>
                <p className="text-gray-600">
                  For every tree you grow to maturity, we partner with non-profits to plant a real tree.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-green-900 text-green-100 py-6">
        <div className="container mx-auto text-center">
          <p>&copy; 2025 TendATree. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
