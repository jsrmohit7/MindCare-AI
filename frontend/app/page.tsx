import Link from "next/link";
import { BrainCircuit, Heart, ShieldAlert, Sparkles, History, ArrowRight } from "lucide-react";
import Button from "@/components/Button";
import Card from "@/components/Card";

export default function HomePage() {
  const features = [
    {
      title: "Granite AI Inference",
      description: "Harnesses state-of-the-art IBM Watsonx Granite models to generate qualitative evaluations, stress assessments, and custom-tailored recommendations.",
      icon: BrainCircuit,
      color: "from-blue-500 to-indigo-500",
    },
    {
      title: "Clinical Scoring Engine",
      description: "Incorporates standard PHQ-9 and GAD-7 assessment frameworks for clinically validated evaluation of anxiety and depressive severity indexes.",
      icon: Heart,
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "Private & Secure",
      description: "Secure locally validated persistence layer backed by MongoDB, guaranteeing total confidentiality and privacy for your personal information.",
      icon: ShieldAlert,
      color: "from-amber-500 to-orange-500",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center space-y-16 py-12 md:py-20">
      {/* Hero Header */}
      <div className="text-center max-w-3xl space-y-6">
        <div className="inline-flex items-center space-x-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm font-semibold text-indigo-300">
          <Sparkles className="h-4 w-4 animate-spin text-purple-400" />
          <span>Intelligent Mental Health Copilot</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
          Understand Your Mind with{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Precision AI
          </span>
        </h1>
        <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
          MindCare AI combines clinical standard evaluations with advanced AI to deliver personalized mental wellness feedback and actionable stress-relief strategies.
        </p>
        
        {/* Call to Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
          <Link href="/assessment" className="w-full sm:w-auto">
            <Button variant="primary" className="w-full sm:w-auto text-base py-3 px-8">
              <span>Start Assessment</span>
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/history" className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full sm:w-auto text-base py-3 px-8">
              <History className="mr-2 h-5 w-5" />
              <span>View History</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="w-full max-w-6xl">
        <h2 className="text-center text-2xl md:text-3xl font-bold tracking-tight mb-12">
          Why Choose MindCare AI?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <Card key={idx} hoverEffect className="flex flex-col h-full">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} text-white shadow-lg mb-6`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-100 mb-2">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-slate-400 flex-1">{feature.description}</p>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Trust Disclaimer Box */}
      <div className="w-full max-w-3xl rounded-2xl border border-white/5 bg-slate-900/20 p-6 backdrop-blur-sm text-center">
        <p className="text-xs text-slate-500 leading-relaxed">
          <span className="font-semibold text-slate-400">Clinical Disclaimer:</span> MindCare AI is designed for informational purposes and stress coaching. It does not replace professional therapy, clinical diagnostics, or medical consultation. If you are experiencing a mental health emergency, please contact your local healthcare providers or helpline immediately.
        </p>
      </div>
    </div>
  );
}
