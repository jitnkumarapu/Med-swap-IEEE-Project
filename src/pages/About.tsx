import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FileText, Sparkles, Users, TrendingUp, Heart, Pill, DollarSign, Search, ArrowLeft } from 'lucide-react';

const About = () => {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <Header />
        
        {/* Hero Section */}
        <section className="relative py-16 px-4 medical-gradient">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/20"></div>
          <div className="relative container mx-auto">
            <Link to="/">
              <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white hover:text-primary backdrop-blur-sm mb-6 interactive-element">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
              </Button>
            </Link>
            <div className="text-center animate-fade-up">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                About MedSwap
              </h2>
              <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto">
                Smart alternative medicine finder designed to make healthcare more affordable and accessible
              </p>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-lg mx-auto">
              <p className="lead text-xl text-muted-foreground mb-8">
                MedSwap is a smart alternative medicine finder designed to make healthcare more affordable and accessible. 
                The platform helps users discover safe, effective, and cost-friendly alternatives to branded medicines by 
                analyzing salt compositions, therapeutic uses, and pricing differences.
              </p>

              <h3 className="text-2xl font-semibold text-foreground mt-10 mb-6">With MedSwap, users can:</h3>
              
              <div className="grid md:grid-cols-2 gap-6 mb-10">
                <div className="flex items-start gap-4 p-6 rounded-lg border bg-card">
                  <Search className="w-8 h-8 text-primary shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Search Medicines</h4>
                    <p className="text-muted-foreground">by name, salt, or disease</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-6 rounded-lg border bg-card">
                  <Pill className="w-8 h-8 text-primary shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Compare Alternatives</h4>
                    <p className="text-muted-foreground">that share the same active ingredients or therapeutic effects</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-6 rounded-lg border bg-card">
                  <DollarSign className="w-8 h-8 text-primary shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Save Money</h4>
                    <p className="text-muted-foreground">by finding lower-cost options from trusted manufacturers</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-6 rounded-lg border bg-card">
                  <Sparkles className="w-8 h-8 text-primary shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Get Intelligent Suggestions</h4>
                    <p className="text-muted-foreground">powered by fuzzy matching, synonyms, and salt-to-disease mapping</p>
                  </div>
                </div>
              </div>

              <h3 className="text-2xl font-semibold text-foreground mt-10 mb-6">Technology Behind MedSwap</h3>
              
              <p>
                MedSwap is powered by advanced technology and algorithms designed for speed and accuracy. 
                It uses sophisticated preprocessing pipelines to normalize medicine data, handle synonyms, and eliminate duplicates. 
                The platform employs cutting-edge techniques like NLP-based fuzzy matching, inverted indexing, and efficient data structures 
                to deliver lightning-fast search results even with spelling mistakes or partial queries.
              </p>

              <div className="bg-secondary/50 p-6 rounded-lg border mt-10 mb-10">
                <h3 className="text-xl font-semibold text-foreground mb-4">MedSwap's mission is simple:</h3>
                <p className="text-lg">
                  👉 Provide clarity, choice, and affordability in medicines — empowering patients to make informed healthcare decisions.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      <Toaster />
    </TooltipProvider>
  );
};

export default About;