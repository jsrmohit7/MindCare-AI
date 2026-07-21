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
      color: "from-blue-500/10 to-indigo-500/10 border-indigo-500/20 text-indigo-400",
    },
    {
      title: "Clinical Scoring Engine",
      description: "Incorporates standard PHQ-9 and GAD-7 assessment frameworks for clinically validated evaluation of anxiety and depressive severity indexes.",
      icon: Heart,
      color: "from-purple-500/10 to-pink-500/10 border-pink-500/20 text-pink-400",
    },
    {
      title: "Private & Secure",
      description: "Secure locally validated persistence layer backed by MongoDB, guaranteeing total confidentiality and privacy for your personal information.",
      icon: ShieldAlert,
      color: "from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-400",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center space-y-16 py-12 md:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-80 w-80 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none" />

      {/* Hero Header */}
      <div className="text-center max-w-3xl space-y-6 relative z-10">
        <div className="inline-flex items-center space-x-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 px-4 py-1.5 text-xs font-bold text-indigo-300">
          <Sparkles className="h-3.5 w-3.5 text-purple-400" />
          <span>Intelligent Mental Health Copilot</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight text-white">
          Understand Your Mind with{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Precision AI
          </span>
        </h1>
        <p className="text-sm md:text-base text-slate-400 leading-relaxed max-w-xl mx-auto font-medium">
          MindCare AI combines clinical standard evaluations with advanced AI to deliver personalized mental wellness feedback and actionable stress-relief strategies.
        </p>
        
        {/* Call to Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link href="/assessment" className="w-full sm:w-auto">
            <Button variant="primary" className="w-full sm:w-auto text-xs py-3 px-8 shadow-lg shadow-indigo-600/10 border border-indigo-500/30">
              <span>Start Assessment</span>
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/history" className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full sm:w-auto text-xs py-3 px-8">
              <History className="mr-1.5 h-4 w-4" />
              <span>View History</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="w-full max-w-6xl relative z-10">
        <h2 className="text-center text-xl md:text-2xl font-extrabold tracking-tight mb-12 text-white">
          Why Choose MindCare AI?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <Card key={idx} hoverEffect className="flex flex-col h-full space-y-4">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.color} border shrink-0`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <h3 className="text-sm font-bold text-slate-200">{feature.title}</h3>
                  <p className="text-xs leading-relaxed text-slate-400">{feature.description}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Trust Disclaimer Box */}
      <div className="w-full max-w-3xl rounded-3xl border border-white/[0.04] bg-slate-900/10 p-6 backdrop-blur-sm text-center relative z-10">
        <p className="text-[11px] text-slate-500 leading-relaxed font-semibold italic">
          <span className="font-bold text-slate-400 not-italic">Clinical Disclaimer:</span> MindCare AI is designed for informational purposes and stress coaching. It does not replace professional therapy, clinical diagnostics, or medical consultation. If you are experiencing a mental health emergency, please contact your local healthcare providers or helpline immediately.
        </p>
      </div>
    </div>
  );
}
