'use client';

import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white pt-16 pb-24">
        
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-8 animate-fade-in-up">
              <span className="block text-zinc-900">AutoReach Monitor</span>
              <span className="block bg-gradient-to-r from-[#090376] to-[#170DF2] bg-clip-text text-transparent">
                AI Brand Visibility Platform
              </span>
            </h1>
            <p className="text-xl lg:text-2xl text-zinc-600 max-w-3xl mx-auto mb-6 animate-fade-in-up animation-delay-200">
              Track how AI models rank your brand against competitors
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-400">
              <Link
                href="/brand-monitor"
                className="btn-firecrawl-orange inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-base font-medium transition-all duration-200 h-12 px-8"
              >
                Start Brand Analysis
              </Link>
              {/* <Link
                href="/plans"
                className="btn-firecrawl-default inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-base font-medium transition-all duration-200 h-12 px-8"
              >
                View Pricing
              </Link> */}
            </div>
            <p className="mt-6 text-sm text-zinc-500 animate-fade-in-up animation-delay-600">
              Powered by AI • Real-time Analysis • Competitor Tracking • SEO Insights
            </p>
          </div>

          {/* Stats */}
          <div className="mt-20 bg-zinc-900 rounded-[20px] p-12 animate-fade-in-scale animation-delay-800">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center animate-fade-in-up animation-delay-1000">
                <div className="text-4xl font-bold text-white">ChatGPT</div>
                <div className="text-sm text-zinc-400 mt-1">Claude, Perplexity & More</div>
              </div>
              <div className="text-center animate-fade-in-up animation-delay-1000" style={{animationDelay: '1100ms'}}>
                <div className="text-4xl font-bold text-white">Real-time</div>
                <div className="text-sm text-zinc-400 mt-1">Analysis</div>
              </div>
              <div className="text-center animate-fade-in-up animation-delay-1000" style={{animationDelay: '1200ms'}}>
                <div className="text-4xl font-bold text-white">Competitor</div>
                <div className="text-sm text-zinc-400 mt-1">Tracking</div>
              </div>
              <div className="text-center animate-fade-in-up animation-delay-1000" style={{animationDelay: '1300ms'}}>
                <div className="text-4xl font-bold text-white">Actionable</div>
                <div className="text-sm text-zinc-400 mt-1">Insights</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/*  */}


      {/* CTA Section 1 */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-[30px] p-16 text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              See How AI Models Rank Your Brand
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Monitor your brand visibility across ChatGPT, Claude, Perplexity and more
            </p>
            <Link
              href="/brand-monitor"
              className="btn-firecrawl-default inline-flex items-center justify-center whitespace-nowrap rounded-[10px] text-base font-medium transition-all duration-200 h-12 px-8"
            >
              Start Free Analysis
            </Link>
          </div>
        </div>
      </section>


      {/* FAQs */}
      {/* Final CTA */}
      <section className="py-24 bg-zinc-900">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Start Monitoring Your AI Brand Visibility
          </h2>
          <p className="text-xl text-zinc-400 mb-8">
            Take control of how AI models present your brand
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/brand-monitor"
              className="btn-firecrawl-orange inline-flex items-center justify-center whitespace-nowrap rounded-[10px] text-base font-medium transition-all duration-200 h-12 px-8"
            >
              Analyze Your Brand
            </Link>
            <Link
              href="/plans"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-[10px] text-base font-medium transition-all duration-200 h-12 px-8 bg-zinc-800 text-white hover:bg-zinc-700"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}