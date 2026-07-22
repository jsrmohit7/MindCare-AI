"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider, Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useEmotion } from "@/context/EmotionContext";
import { useCreateAssessment, useAssessments, useDeleteAssessment } from "@/hooks/useAssessments";
import { AssessmentRequest } from "@/types/assessment";

import { AssessmentHero } from "@/components/assessments/AssessmentHero";
import { AssessmentSelector } from "@/components/assessments/AssessmentSelector";
import { ProgressRing } from "@/components/assessments/ProgressRing";
import { QuestionCard } from "@/components/assessments/QuestionCard";
import { AssessmentCompanion } from "@/components/assessments/AssessmentCompanion";
import { AssessmentTimeline } from "@/components/assessments/AssessmentTimeline";
import { AssessmentEmptyState } from "@/components/assessments/AssessmentEmptyState";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

// =========================================================
// Zod Form Validation Schema
// =========================================================
const validationSchema = z.object({
  personal_info: z.object({
    occupation: z.string().min(1, "Occupation is required"),
    education: z.string().min(1, "Education is required"),
    marital_status: z.string().min(1, "Marital status is required"),
  }),
  phq9: z.object({
    q1: z.coerce.number().min(0).max(3),
    q2: z.coerce.number().min(0).max(3),
    q3: z.coerce.number().min(0).max(3),
    q4: z.coerce.number().min(0).max(3),
    q5: z.coerce.number().min(0).max(3),
    q6: z.coerce.number().min(0).max(3),
    q7: z.coerce.number().min(0).max(3),
    q8: z.coerce.number().min(0).max(3),
    q9: z.coerce.number().min(0).max(3),
  }),
  gad7: z.object({
    q1: z.coerce.number().min(0).max(3),
    q2: z.coerce.number().min(0).max(3),
    q3: z.coerce.number().min(0).max(3),
    q4: z.coerce.number().min(0).max(3),
    q5: z.coerce.number().min(0).max(3),
    q6: z.coerce.number().min(0).max(3),
    q7: z.coerce.number().min(0).max(3),
  }),
  stress: z.array(
    z.object({
      question: z.string(),
      answer: z.coerce.number().min(1).max(5),
    })
  ).length(4),
  sleep: z.object({
    duration: z.coerce.number().min(0, "Duration cannot be negative").max(24, "Max 24 hours"),
    quality: z.string().min(1, "Quality is required"),
    night_awakenings: z.coerce.number().min(0, "Cannot be negative"),
    difficulty_falling_asleep: z.boolean(),
  }),
  lifestyle: z.object({
    exercise: z.string().min(1, "Exercise frequency is required"),
    screen_time: z.coerce.number().min(0).max(24),
    alcohol: z.string().min(1, "Alcohol level is required"),
    smoking: z.boolean(),
    water_intake: z.coerce.number().min(0, "Cannot be negative"),
    diet: z.string().min(1, "Diet description is required"),
  }),
  wellbeing: z.object({
    happiness: z.coerce.number().min(1).max(10),
    energy: z.coerce.number().min(1).max(10),
    motivation: z.coerce.number().min(1).max(10),
    concentration: z.coerce.number().min(1).max(10),
    social_support: z.string().min(1, "Social support level is required"),
  }),
});

type FormValues = z.infer<typeof validationSchema>;

const PHQ9_QUESTIONS = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
  "Trouble concentrating on things, such as reading the newspaper or watching television",
  "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual",
  "Thoughts that you would be better off dead or of hurting yourself in some way",
];

const GAD7_QUESTIONS = [
  "Feeling nervous, anxious, or on edge",
  "Not being able to stop or control worrying",
  "Worrying too much about different things",
  "Trouble relaxing",
  "Being so restless that it is hard to sit still",
  "Becoming easily annoyed or irritable",
  "Feeling afraid as if something awful might happen",
];

const STRESS_QUESTIONS = [
  "How often have you felt unable to control the important things in your life?",
  "How often have you felt confident about your ability to handle your personal problems?",
  "How often have you felt that things were going your way?",
  "How often have you felt difficulties were piling up so high that you could not overcome them?",
];

const frequencyOptions = [
  { value: 0, label: "Not at all" },
  { value: 1, label: "Several days" },
  { value: 2, label: "More than half" },
  { value: 3, label: "Nearly every day" },
];

const stressOptions = [
  { value: 1, label: "Never" },
  { value: 2, label: "Almost Never" },
  { value: 3, label: "Sometimes" },
  { value: 4, label: "Fairly Often" },
  { value: 5, label: "Very Often" },
];

function AssessmentPage() {
  const router = useRouter();
  const { detectedEmotion, explanation, motivation } = useEmotion();
  
  // Queries & Mutations
  const { data: pastAssessments = [], isLoading: loadingHistory } = useAssessments(10);
  const createAssessmentMutation = useCreateAssessment();
  const deleteAssessmentMutation = useDeleteAssessment();

  // Cinematic Entrance Animation
  const [mounted, setMounted] = useState(false);
  const [entranceStep, setEntranceStep] = useState(0);

  // Active view: "selector" | "questionnaire"
  const [viewMode, setViewMode] = useState<"selector" | "questionnaire">("selector");
  const [selectedBattery, setSelectedBattery] = useState<"full" | "phq9" | "gad7">("full");

  // Step progression
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  // Sub-step question indices
  const [phq9Index, setPhq9Index] = useState(0);
  const [gad7Index, setGad7Index] = useState(0);
  const [stressIndex, setStressIndex] = useState(0);
  const [showSleep, setShowSleep] = useState(false);
  const [showWellbeing, setShowWellbeing] = useState(false);

  // Form Methods
  const methods = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      personal_info: { occupation: "", education: "", marital_status: "" },
      phq9: { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0, q6: 0, q7: 0, q8: 0, q9: 0 },
      gad7: { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0, q6: 0, q7: 0 },
      stress: STRESS_QUESTIONS.map((q) => ({ question: q, answer: 3 })),
      sleep: { duration: 7, quality: "Good", night_awakenings: 0, difficulty_falling_asleep: false },
      lifestyle: { exercise: "Weekly", screen_time: 4, alcohol: "Socially", smoking: false, water_intake: 2, diet: "Balanced" },
      wellbeing: { happiness: 7, energy: 6, motivation: 7, concentration: 7, social_support: "Strong" },
    },
    mode: "onChange",
  });

  const { trigger, setValue } = methods;

  // Staggered Entrance Animation Pipeline
  useEffect(() => {
    setMounted(true);
    const timers = [
      setTimeout(() => setEntranceStep(1), 150),
      setTimeout(() => setEntranceStep(2), 350),
      setTimeout(() => setEntranceStep(3), 600),
      setTimeout(() => setEntranceStep(4), 850),
    ];
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  // Step Navigation Logic
  const handleNext = async () => {
    if (step === 1) {
      const isValid = await trigger("personal_info");
      if (isValid) {
        setStep(2);
        setPhq9Index(0);
      }
    } else if (step === 2) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isValid = await trigger(`phq9.q${phq9Index + 1}` as any);
      if (isValid) {
        if (phq9Index < 8) {
          setPhq9Index((prev) => prev + 1);
        } else {
          setStep(3);
          setGad7Index(0);
        }
      }
    } else if (step === 3) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isValid = await trigger(`gad7.q${gad7Index + 1}` as any);
      if (isValid) {
        if (gad7Index < 6) {
          setGad7Index((prev) => prev + 1);
        } else {
          setStep(4);
          setStressIndex(0);
          setShowSleep(false);
        }
      }
    } else if (step === 4) {
      if (!showSleep) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isValid = await trigger(`stress.${stressIndex}.answer` as any);
        if (isValid) {
          if (stressIndex < 3) {
            setStressIndex((prev) => prev + 1);
          } else {
            setShowSleep(true);
          }
        }
      } else {
        const isValid = await trigger("sleep");
        if (isValid) {
          setStep(5);
          setShowWellbeing(false);
        }
      }
    } else if (step === 5) {
      if (!showWellbeing) {
        const isValid = await trigger("lifestyle");
        if (isValid) {
          setShowWellbeing(true);
        }
      }
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrev = () => {
    if (step === 1) {
      setViewMode("selector");
      return;
    }
    if (step === 2) {
      if (phq9Index > 0) {
        setPhq9Index((prev) => prev - 1);
      } else {
        setStep(1);
      }
    } else if (step === 3) {
      if (gad7Index > 0) {
        setGad7Index((prev) => prev - 1);
      } else {
        setStep(2);
        setPhq9Index(8);
      }
    } else if (step === 4) {
      if (showSleep) {
        setShowSleep(false);
        setStressIndex(3);
      } else {
        if (stressIndex > 0) {
          setStressIndex((prev) => prev - 1);
        } else {
          setStep(3);
          setGad7Index(6);
        }
      }
    } else if (step === 5) {
      if (showWellbeing) {
        setShowWellbeing(false);
      } else {
        setStep(4);
        setShowSleep(true);
      }
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Option selection auto-advance handlers
  const handleSelectPhq9Option = (val: number) => {
    setValue(`phq9.q${phq9Index + 1}` as Path<FormValues>, val, { shouldValidate: true });
    setTimeout(() => handleNext(), 150);
  };

  const handleSelectGad7Option = (val: number) => {
    setValue(`gad7.q${gad7Index + 1}` as Path<FormValues>, val, { shouldValidate: true });
    setTimeout(() => handleNext(), 150);
  };

  const handleSelectStressOption = (val: number) => {
    setValue(`stress.${stressIndex}.answer` as Path<FormValues>, val, { shouldValidate: true });
    setTimeout(() => handleNext(), 150);
  };

  // Form Submission
  const handleFormSubmit = () => {
    methods.handleSubmit(async (values) => {
      const requestData: AssessmentRequest = {
        ...values,
        status: "submitted",
      };

      createAssessmentMutation.mutate(requestData, {
        onSuccess: (data) => {
          router.push(`/results/${data.id}`);
        },
      });
    })();
  };

  // Delete Assessment Record Handler
  const handleDeleteRecord = async (id: string) => {
    if (!confirm("Are you sure you want to delete this clinical record?")) return;
    deleteAssessmentMutation.mutate(id);
  };

  // Start Assessment Battery Handler
  const handleStartBattery = (type: "full" | "phq9" | "gad7") => {
    setSelectedBattery(type);
    setStep(1);
    setPhq9Index(0);
    setGad7Index(0);
    setStressIndex(0);
    setShowSleep(false);
    setShowWellbeing(false);
    setViewMode("questionnaire");
  };

  const lastCompletionDate = pastAssessments[0]?.created_at || pastAssessments[0]?.metadata?.generated_at;

  return (
    <ProtectedRoute>
      <div
        className={`max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-8 transition-all duration-700 ${
          mounted ? "opacity-100 scale-100" : "opacity-0 scale-[0.98]"
        }`}
      >
        {/* Step Header / Back link */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          {viewMode === "questionnaire" ? (
            <button
              onClick={() => setViewMode("selector")}
              className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Change Assessment Battery</span>
            </button>
          ) : (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Return to Dashboard</span>
            </Link>
          )}

          {viewMode === "questionnaire" && (
            <div className="flex items-center gap-3">
              <ProgressRing currentStep={step} totalSteps={totalSteps} size={48} strokeWidth={4} />
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider hidden sm:inline">
                Step {step} of {totalSteps}
              </span>
            </div>
          )}
        </div>

        {/* Step 1: Living Hero */}
        <div className={`transition-all duration-500 ${entranceStep >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <AssessmentHero
            emotion={detectedEmotion}
            totalAssessments={pastAssessments.length}
            lastCompletionDate={lastCompletionDate}
            scorePreview={84}
            motivationSnippet={motivation || explanation}
          />
        </div>

        {/* VIEW 1: Assessment Battery Selector & Clinical History */}
        {viewMode === "selector" && (
          <div className="space-y-8">
            <div className={`transition-all duration-500 ${entranceStep >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              <AssessmentSelector
                onStartAssessment={handleStartBattery}
                activeType={selectedBattery}
                hasHistory={pastAssessments.length > 0}
              />
            </div>

            {pastAssessments.length === 0 && !loadingHistory ? (
              <AssessmentEmptyState
                emotion={detectedEmotion}
                onStartAssessment={() => handleStartBattery("full")}
              />
            ) : (
              <div className={`transition-all duration-500 ${entranceStep >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
                <AssessmentTimeline
                  assessments={pastAssessments}
                  onDelete={handleDeleteRecord}
                />
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: Questionnaire Flow Workspace */}
        {viewMode === "questionnaire" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Main Question Card Column */}
            <div className={`lg:col-span-8 space-y-6 transition-all duration-500 ${entranceStep >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              <FormProvider {...methods}>
                <QuestionCard
                  step={step}
                  totalSteps={totalSteps}
                  phq9Index={phq9Index}
                  gad7Index={gad7Index}
                  stressIndex={stressIndex}
                  showSleep={showSleep}
                  showWellbeing={showWellbeing}
                  phq9Questions={PHQ9_QUESTIONS}
                  gad7Questions={GAD7_QUESTIONS}
                  stressQuestions={STRESS_QUESTIONS}
                  frequencyOptions={frequencyOptions}
                  stressOptions={stressOptions}
                  methods={methods}
                  onSelectPhq9={handleSelectPhq9Option}
                  onSelectGad7={handleSelectGad7Option}
                  onSelectStress={handleSelectStressOption}
                  onNext={handleNext}
                  onPrev={handlePrev}
                  onSubmitForm={handleFormSubmit}
                  submitting={createAssessmentMutation.isPending}
                />
              </FormProvider>
            </div>

            {/* AI Companion Side Column */}
            <div className={`lg:col-span-4 space-y-6 transition-all duration-500 ${entranceStep >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              <AssessmentCompanion
                currentStep={step}
                emotion={detectedEmotion}
                submitting={createAssessmentMutation.isPending}
              />
            </div>

          </div>
        )}

      </div>
    </ProtectedRoute>
  );
}

export default function ProtectedAssessmentPage() {
  return <AssessmentPage />;
}
