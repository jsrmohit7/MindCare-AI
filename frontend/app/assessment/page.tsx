"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ChevronLeft, ChevronRight, Sparkles, HelpCircle } from "lucide-react";

import Button from "@/components/Button";
import ProtectedRoute from "@/components/ProtectedRoute";
import Card from "@/components/Card";
import ProgressBar from "@/components/ProgressBar";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorState from "@/components/ErrorState";
import { useCreateAssessment } from "@/hooks/useAssessments";
import { AssessmentRequest } from "@/types/assessment";

// =========================================================
// Zod Form Validation Schemas
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
  { value: 2, label: "More than half the days" },
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
  const [step, setStep] = useState(1);
  const router = useRouter();
  const createAssessmentMutation = useCreateAssessment();

  // Paginated Questions sub-states
  const [phq9Index, setPhq9Index] = useState(0);
  const [gad7Index, setGad7Index] = useState(0);
  const [stressIndex, setStressIndex] = useState(0);
  const [showSleep, setShowSleep] = useState(false);
  const [showWellbeing, setShowWellbeing] = useState(false);

  const totalSteps = 5;
  const progress = ((step - 1) / (totalSteps - 1)) * 100;

  const methods = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      personal_info: { occupation: "", education: "", marital_status: "" },
      phq9: { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0, q6: 0, q7: 0, q8: 0, q9: 0 },
      gad7: { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0, q6: 0, q7: 0 },
      stress: STRESS_QUESTIONS.map((q) => ({ question: q, answer: 3 })),
      sleep: { duration: 7, quality: "", night_awakenings: 0, difficulty_falling_asleep: false },
      lifestyle: { exercise: "", screen_time: 4, alcohol: "", smoking: false, water_intake: 2, diet: "" },
      wellbeing: { happiness: 7, energy: 6, motivation: 7, concentration: 7, social_support: "" },
    },
    mode: "onChange",
  });

  const { register, handleSubmit, trigger, setValue, watch, formState: { errors } } = methods;

  const handleNext = async () => {
    if (step === 1) {
      const isValid = await trigger("personal_info");
      if (isValid) {
        setStep(2);
        setPhq9Index(0);
      }
    } else if (step === 2) {
      // Validate active PHQ-9 question
      const fieldName = `phq9.q${phq9Index + 1}` as "phq9.q1";
      const isValid = await trigger(fieldName);
      if (isValid) {
        if (phq9Index < 8) {
          setPhq9Index((prev) => prev + 1);
        } else {
          setStep(3);
          setGad7Index(0);
        }
      }
    } else if (step === 3) {
      // Validate active GAD-7 question
      const fieldName = `gad7.q${gad7Index + 1}` as "gad7.q1";
      const isValid = await trigger(fieldName);
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
        const fieldName = `stress.${stressIndex}.answer` as "stress.0.answer";
        const isValid = await trigger(fieldName);
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
    if (step === 1) return;
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

  const onSubmit = async (values: FormValues) => {
    const requestData: AssessmentRequest = {
      ...values,
      status: "submitted",
    };

    createAssessmentMutation.mutate(requestData, {
      onSuccess: (data) => {
        router.push(`/results/${data.id}`);
      },
    });
  };

  const handleSelectPhq9Option = async (val: number) => {
    const fieldName = `phq9.q${phq9Index + 1}` as "phq9.q1";
    setValue(fieldName, val, { shouldValidate: true });
    // Soft delay for smooth transition auto-advance
    setTimeout(() => {
      handleNext();
    }, 150);
  };

  const handleSelectGad7Option = async (val: number) => {
    const fieldName = `gad7.q${gad7Index + 1}` as "gad7.q1";
    setValue(fieldName, val, { shouldValidate: true });
    setTimeout(() => {
      handleNext();
    }, 150);
  };

  const handleSelectStressOption = async (val: number) => {
    const fieldName = `stress.${stressIndex}.answer` as "stress.0.answer";
    setValue(fieldName, val, { shouldValidate: true });
    setTimeout(() => {
      handleNext();
    }, 150);
  };

  if (createAssessmentMutation.isPending) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner message="Orchestrating AI Pipelines. Calculating clinical scores and Watsonx Granite AI predictions..." />
      </div>
    );
  }

  if (createAssessmentMutation.isError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <ErrorState
          title="Evaluation Pipeline Error"
          message={createAssessmentMutation.error.message || "An unexpected validation or AI gateway issue occurred."}
          onRetry={() => createAssessmentMutation.reset()}
        />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="max-w-3xl mx-auto space-y-8 py-6">
        {/* Step Header */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-indigo-400">
            <Sparkles className="h-4.5 w-4.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Step {step} of {totalSteps}</span>
          </div>
          <ProgressBar progress={progress} />
        </div>

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* STEP 1: Personal Info */}
            {step === 1 && (
              <Card className="space-y-6">
                <div className="border-b border-white/[0.04] pb-4">
                  <h2 className="text-xl font-bold tracking-tight text-white">General Profile Context</h2>
                  <p className="text-xs text-slate-400 mt-1">Please clarify your active occupation and marital status to calibrate the clinical baseline.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Occupation</label>
                    <select
                      {...register("personal_info.occupation")}
                      className="w-full rounded-xl border border-white/[0.08] bg-slate-950 px-4 py-3 text-slate-200 text-xs outline-none focus:border-indigo-500 transition-colors"
                    >
                      <option value="">Select Occupation</option>
                      <option value="Student">Student</option>
                      <option value="Software Engineer">Software Engineer</option>
                      <option value="Healthcare Professional">Healthcare Professional</option>
                      <option value="Educator">Educator / Teacher</option>
                      <option value="Manager / Business Leader">Manager / Business Leader</option>
                      <option value="Unemployed">Unemployed</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.personal_info?.occupation && (
                      <p className="text-[10px] text-rose-400 font-medium">{errors.personal_info.occupation.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Education Level</label>
                    <select
                      {...register("personal_info.education")}
                      className="w-full rounded-xl border border-white/[0.08] bg-slate-950 px-4 py-3 text-slate-200 text-xs outline-none focus:border-indigo-500 transition-colors"
                    >
                      <option value="">Select Education</option>
                      <option value="High School">High School</option>
                      <option value="Bachelor's Degree">Bachelor&apos;s Degree</option>
                      <option value="Master's Degree">Master&apos;s Degree</option>
                      <option value="PhD">PhD / Doctorate</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.personal_info?.education && (
                      <p className="text-[10px] text-rose-400 font-medium">{errors.personal_info.education.message}</p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Marital Status</label>
                    <select
                      {...register("personal_info.marital_status")}
                      className="w-full rounded-xl border border-white/[0.08] bg-slate-950 px-4 py-3 text-slate-200 text-xs outline-none focus:border-indigo-500 transition-colors"
                    >
                      <option value="">Select Marital Status</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                    {errors.personal_info?.marital_status && (
                      <p className="text-[10px] text-rose-400 font-medium">{errors.personal_info.marital_status.message}</p>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* STEP 2: PHQ-9 (Depression Scale) - Focused Single Question */}
            {step === 2 && (
              <Card className="space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                  PHQ-9 Question {phq9Index + 1} of 9
                </div>
                <div className="border-b border-white/[0.04] pb-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <HelpCircle className="h-4.5 w-4.5 text-indigo-400" />
                    Depression Symptom Severity Scale
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Over the last 2 weeks, how often have you been bothered by this concern?
                  </p>
                </div>

                <div className="py-6 space-y-6 text-center">
                  <p className="text-base sm:text-lg font-bold text-white max-w-xl mx-auto leading-relaxed">
                    &ldquo;{PHQ9_QUESTIONS[phq9Index]}&rdquo;
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-4">
                    {frequencyOptions.map((opt) => {
                      const fieldName = `phq9.q${phq9Index + 1}` as "phq9.q1";
                      const activeValue = Number(watch(fieldName));
                      const isSelected = activeValue === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleSelectPhq9Option(opt.value)}
                          className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all duration-200 ${
                            isSelected
                              ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-500/15"
                              : "bg-white/[0.01] border-white/[0.04] text-slate-400 hover:text-slate-200 hover:border-white/10"
                          }`}
                        >
                          <span className="text-xs font-bold">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Card>
            )}

            {/* STEP 3: GAD-7 (Anxiety Scale) - Focused Single Question */}
            {step === 3 && (
              <Card className="space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                  GAD-7 Question {gad7Index + 1} of 7
                </div>
                <div className="border-b border-white/[0.04] pb-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <HelpCircle className="h-4.5 w-4.5 text-indigo-400" />
                    Anxiety Symptom Severity Scale
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Over the last 2 weeks, how often have you been bothered by this concern?
                  </p>
                </div>

                <div className="py-6 space-y-6 text-center">
                  <p className="text-base sm:text-lg font-bold text-white max-w-xl mx-auto leading-relaxed">
                    &ldquo;{GAD7_QUESTIONS[gad7Index]}&rdquo;
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-4">
                    {frequencyOptions.map((opt) => {
                      const fieldName = `gad7.q${gad7Index + 1}` as "gad7.q1";
                      const activeValue = Number(watch(fieldName));
                      const isSelected = activeValue === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleSelectGad7Option(opt.value)}
                          className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all duration-200 ${
                            isSelected
                              ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-500/15"
                              : "bg-white/[0.01] border-white/[0.04] text-slate-400 hover:text-slate-200 hover:border-white/10"
                          }`}
                        >
                          <span className="text-xs font-bold">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Card>
            )}

            {/* STEP 4: Stress & Sleep */}
            {step === 4 && (
              <div className="space-y-6">
                {!showSleep ? (
                  /* Focused Stress Question */
                  <Card className="space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                      Stress Question {stressIndex + 1} of 4
                    </div>
                    <div className="border-b border-white/[0.04] pb-4">
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <HelpCircle className="h-4.5 w-4.5 text-indigo-400" />
                        Stress Perception Indexes
                      </h2>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Please answer based on your feelings during the last month.
                      </p>
                    </div>

                    <div className="py-6 space-y-6 text-center">
                      <p className="text-base sm:text-lg font-bold text-white max-w-xl mx-auto leading-relaxed">
                        &ldquo;{STRESS_QUESTIONS[stressIndex]}&rdquo;
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 max-w-3xl mx-auto pt-4">
                        {stressOptions.map((opt) => {
                          const fieldName = `stress.${stressIndex}.answer` as "stress.0.answer";
                          const activeValue = Number(watch(fieldName));
                          const isSelected = activeValue === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => handleSelectStressOption(opt.value)}
                              className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all duration-200 ${
                                isSelected
                                  ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-500/15"
                                  : "bg-white/[0.01] border-white/[0.04] text-slate-400 hover:text-slate-200 hover:border-white/10"
                              }`}
                            >
                              <span className="text-[10px] font-bold sm:text-xs">{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </Card>
                ) : (
                  /* Sleep Section */
                  <Card className="space-y-6">
                    <div className="border-b border-white/[0.04] pb-4">
                      <h2 className="text-xl font-bold tracking-tight text-white">Sleep Evaluation</h2>
                      <p className="text-xs text-slate-400 mt-1">Assess your rest duration,latency, and subjective quality.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Sleep Duration (Hours per night)</label>
                        <input
                          type="number"
                          step="0.5"
                          {...register("sleep.duration")}
                          className="w-full rounded-xl border border-white/[0.08] bg-slate-950 px-4 py-3 text-slate-200 text-xs outline-none focus:border-indigo-500 transition-colors"
                        />
                        {errors.sleep?.duration && (
                          <p className="text-[10px] text-rose-400 font-medium">{errors.sleep.duration.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Sleep Quality</label>
                        <select
                          {...register("sleep.quality")}
                          className="w-full rounded-xl border border-white/[0.08] bg-slate-950 px-4 py-3 text-slate-200 text-xs outline-none focus:border-indigo-500 transition-colors"
                        >
                          <option value="">Select Quality</option>
                          <option value="Excellent">Excellent</option>
                          <option value="Good">Good</option>
                          <option value="Fair">Fair</option>
                          <option value="Poor">Poor</option>
                        </select>
                        {errors.sleep?.quality && (
                          <p className="text-[10px] text-rose-400 font-medium">{errors.sleep.quality.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Nightly Awakenings</label>
                        <input
                          type="number"
                          {...register("sleep.night_awakenings")}
                          className="w-full rounded-xl border border-white/[0.08] bg-slate-950 px-4 py-3 text-slate-200 text-xs outline-none focus:border-indigo-500 transition-colors"
                        />
                        {errors.sleep?.night_awakenings && (
                          <p className="text-[10px] text-rose-400 font-medium">{errors.sleep.night_awakenings.message}</p>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 pt-6">
                        <input
                          type="checkbox"
                          id="sleep-difficulty"
                          {...register("sleep.difficulty_falling_asleep")}
                          className="h-5 w-5 rounded border-white/[0.08] bg-slate-950 text-indigo-600 focus:ring-indigo-500 accent-indigo-500"
                        />
                        <label htmlFor="sleep-difficulty" className="text-xs font-semibold text-slate-300 select-none cursor-pointer">
                          Difficulty falling asleep (Takes more than 30 min)
                        </label>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* STEP 5: Lifestyle & Wellbeing */}
            {step === 5 && (
              <div className="space-y-6">
                {!showWellbeing ? (
                  /* Lifestyle Section */
                  <Card className="space-y-6">
                    <div className="border-b border-white/[0.04] pb-4">
                      <h2 className="text-xl font-bold tracking-tight text-white">Lifestyle Metrics</h2>
                      <p className="text-xs text-slate-400 mt-1">Review physical activities, dietary guidelines, and hydration details.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Exercise Frequency</label>
                        <select
                          {...register("lifestyle.exercise")}
                          className="w-full rounded-xl border border-white/[0.08] bg-slate-950 px-4 py-3 text-slate-200 text-xs outline-none focus:border-indigo-500 transition-colors"
                        >
                          <option value="">Select Frequency</option>
                          <option value="Daily">Daily</option>
                          <option value="Weekly">Weekly (2-3 times)</option>
                          <option value="Rarely">Rarely (Less than once a week)</option>
                          <option value="Never">Never</option>
                        </select>
                        {errors.lifestyle?.exercise && (
                          <p className="text-[10px] text-rose-400 font-medium">{errors.lifestyle.exercise.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Daily Screen Time (Hours)</label>
                        <input
                          type="number"
                          step="0.5"
                          {...register("lifestyle.screen_time")}
                          className="w-full rounded-xl border border-white/[0.08] bg-slate-950 px-4 py-3 text-slate-200 text-xs outline-none focus:border-indigo-500 transition-colors"
                        />
                        {errors.lifestyle?.screen_time && (
                          <p className="text-[10px] text-rose-400 font-medium">{errors.lifestyle.screen_time.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Alcohol Intake</label>
                        <select
                          {...register("lifestyle.alcohol")}
                          className="w-full rounded-xl border border-white/[0.08] bg-slate-950 px-4 py-3 text-slate-200 text-xs outline-none focus:border-indigo-500 transition-colors"
                        >
                          <option value="">Select Level</option>
                          <option value="None">None</option>
                          <option value="Socially">Socially</option>
                          <option value="Frequently">Frequently</option>
                        </select>
                        {errors.lifestyle?.alcohol && (
                          <p className="text-[10px] text-rose-400 font-medium">{errors.lifestyle.alcohol.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Diet Description</label>
                        <select
                          {...register("lifestyle.diet")}
                          className="w-full rounded-xl border border-white/[0.08] bg-slate-950 px-4 py-3 text-slate-200 text-xs outline-none focus:border-indigo-500 transition-colors"
                        >
                          <option value="">Select Diet Type</option>
                          <option value="Healthy">Healthy (Fresh produce, lean protein)</option>
                          <option value="Balanced">Balanced (Mixed healthy and processed)</option>
                          <option value="Unhealthy">Unhealthy (High processed food/sugar)</option>
                        </select>
                        {errors.lifestyle?.diet && (
                          <p className="text-[10px] text-rose-400 font-medium">{errors.lifestyle.diet.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Water Intake (Liters per day)</label>
                        <input
                          type="number"
                          step="0.5"
                          {...register("lifestyle.water_intake")}
                          className="w-full rounded-xl border border-white/[0.08] bg-slate-950 px-4 py-3 text-slate-200 text-xs outline-none focus:border-indigo-500 transition-colors"
                        />
                        {errors.lifestyle?.water_intake && (
                          <p className="text-[10px] text-rose-400 font-medium">{errors.lifestyle.water_intake.message}</p>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 pt-6">
                        <input
                          type="checkbox"
                          id="lifestyle-smoking"
                          {...register("lifestyle.smoking")}
                          className="h-5 w-5 rounded border-white/[0.08] bg-slate-950 text-indigo-600 focus:ring-indigo-500 accent-indigo-500"
                        />
                        <label htmlFor="lifestyle-smoking" className="text-xs font-semibold text-slate-300 select-none cursor-pointer">
                          Active Smoking Status (Tobacco/Vape)
                        </label>
                      </div>
                    </div>
                  </Card>
                ) : (
                  /* Wellbeing Section */
                  <Card className="space-y-6">
                    <div className="border-b border-white/[0.04] pb-4">
                      <h2 className="text-xl font-bold tracking-tight text-white">Subjective Wellbeing</h2>
                      <p className="text-xs text-slate-400 mt-1">Self-rate these attributes from 1 (Low) to 10 (High).</p>
                    </div>

                    <div className="space-y-6">
                      {/* Sliders */}
                      {[
                        { name: "wellbeing.happiness", label: "General Happiness / Life Satisfaction", value: watch("wellbeing.happiness") },
                        { name: "wellbeing.energy", label: "Energy Level & Vitality", value: watch("wellbeing.energy") },
                        { name: "wellbeing.motivation", label: "Motivation & Goal Drive", value: watch("wellbeing.motivation") },
                        { name: "wellbeing.concentration", label: "Mental Focus & Concentration", value: watch("wellbeing.concentration") },
                      ].map((slider) => (
                        <div key={slider.name} className="space-y-2">
                          <div className="flex justify-between text-xs font-semibold text-slate-300">
                            <span>{slider.label}</span>
                            <span className="text-indigo-400 font-bold">{Number(slider.value)} / 10</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            {...register(slider.name as "wellbeing.happiness")}
                            className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                        </div>
                      ))}

                      <div className="space-y-2 pt-2">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Social Support Network</label>
                        <select
                          {...register("wellbeing.social_support")}
                          className="w-full rounded-xl border border-white/[0.08] bg-slate-950 px-4 py-3 text-slate-200 text-xs outline-none focus:border-indigo-500 transition-colors"
                        >
                          <option value="">Select Level</option>
                          <option value="Strong">Strong (Daily contact, high help)</option>
                          <option value="Moderate">Moderate (Weekly contact, average help)</option>
                          <option value="Weak">Weak (Rare contact, minimal help)</option>
                        </select>
                        {errors.wellbeing?.social_support && (
                          <p className="text-[10px] text-rose-400 font-medium">{errors.wellbeing.social_support.message}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* Navigation Action Buttons */}
            <div className="flex items-center justify-between pt-4">
              {step > 1 ? (
                <Button type="button" variant="secondary" onClick={handlePrev} size="sm">
                  <ChevronLeft className="mr-1.5 h-3.5 w-3.5" />
                  <span>Back</span>
                </Button>
              ) : (
                <div />
              )}

              {step === 5 && showWellbeing ? (
                <Button type="submit" variant="primary" className="bg-indigo-600 border border-indigo-500/30 hover:bg-indigo-500 shadow-md shadow-indigo-500/10 active:scale-95" size="sm">
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  <span>Submit Evaluation</span>
                </Button>
              ) : (
                <Button type="button" variant="primary" onClick={handleNext} size="sm">
                  <span>Continue</span>
                  <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </form>
        </FormProvider>
      </div>
    </ProtectedRoute>
  );
}

export default function ProtectedAssessmentPage() {
  return (
    <ProtectedRoute>
      <AssessmentPage />
    </ProtectedRoute>
  );
}
