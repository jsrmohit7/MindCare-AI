import React from "react";
import { UseFormReturn, Path } from "react-hook-form";
import { HelpCircle, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import Button from "@/components/Button";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FormValues = any;

interface QuestionCardProps {
  step: number;
  totalSteps: number;
  phq9Index: number;
  gad7Index: number;
  stressIndex: number;
  showSleep: boolean;
  showWellbeing: boolean;
  phq9Questions: string[];
  gad7Questions: string[];
  stressQuestions: string[];
  frequencyOptions: { value: number; label: string }[];
  stressOptions: { value: number; label: string }[];
  methods: UseFormReturn<FormValues>;
  onSelectPhq9: (val: number) => void;
  onSelectGad7: (val: number) => void;
  onSelectStress: (val: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onSubmitForm: () => void;
  submitting: boolean;
}

export function QuestionCard({
  step,
  totalSteps,
  phq9Index,
  gad7Index,
  stressIndex,
  showSleep,
  showWellbeing,
  phq9Questions,
  gad7Questions,
  stressQuestions,
  frequencyOptions,
  stressOptions,
  methods,
  onSelectPhq9,
  onSelectGad7,
  onSelectStress,
  onNext,
  onPrev,
  onSubmitForm,
  submitting,
}: QuestionCardProps) {
  const { register, watch, formState: { errors } } = methods;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const errs = errors as any;

  return (
    <div className="rounded-3xl border border-white/[0.08] bg-slate-950/40 p-6 sm:p-8 backdrop-blur-3xl shadow-2xl space-y-6 relative overflow-hidden animate-fadeIn">
      
      {/* STEP 1: Personal Profile Context */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="border-b border-white/[0.06] pb-4">
            <span className="text-[10px] font-bold text-accent uppercase tracking-wider block mb-1">
              Step 1 of {totalSteps}
            </span>
            <h2 className="text-xl font-bold tracking-tight text-white">General Profile Context</h2>
            <p className="text-xs text-slate-400 mt-1">Please clarify your active occupation and marital status to calibrate the clinical baseline.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Occupation</label>
              <select
                {...register("personal_info.occupation")}
                className="w-full rounded-2xl border border-white/[0.08] bg-slate-900/60 px-4 py-3 text-slate-200 text-xs outline-none focus:border-accent/40 transition-colors"
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
              {errs.personal_info?.occupation && (
                <p className="text-[10px] text-rose-400 font-medium">{String(errs.personal_info.occupation.message)}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Education Level</label>
              <select
                {...register("personal_info.education")}
                className="w-full rounded-2xl border border-white/[0.08] bg-slate-900/60 px-4 py-3 text-slate-200 text-xs outline-none focus:border-accent/40 transition-colors"
              >
                <option value="">Select Education</option>
                <option value="High School">High School</option>
                <option value="Bachelor's Degree">Bachelor&apos;s Degree</option>
                <option value="Master's Degree">Master&apos;s Degree</option>
                <option value="PhD">PhD / Doctorate</option>
                <option value="Other">Other</option>
              </select>
              {errs.personal_info?.education && (
                <p className="text-[10px] text-rose-400 font-medium">{String(errs.personal_info.education.message)}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Marital Status</label>
              <select
                {...register("personal_info.marital_status")}
                className="w-full rounded-2xl border border-white/[0.08] bg-slate-900/60 px-4 py-3 text-slate-200 text-xs outline-none focus:border-accent/40 transition-colors"
              >
                <option value="">Select Marital Status</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
              </select>
              {errs.personal_info?.marital_status && (
                <p className="text-[10px] text-rose-400 font-medium">{String(errs.personal_info.marital_status.message)}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: PHQ-9 Focused Question */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div>
              <span className="text-[10px] font-bold text-accent uppercase tracking-wider block mb-1">
                PHQ-9 Item {phq9Index + 1} of 9
              </span>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <HelpCircle className="h-4.5 w-4.5 text-accent" />
                Depression Symptom Severity Scale
              </h2>
            </div>
          </div>

          <div className="py-4 space-y-6 text-center">
            <p className="text-base sm:text-lg font-bold text-white max-w-xl mx-auto leading-relaxed italic">
              &ldquo;{phq9Questions[phq9Index]}&rdquo;
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-2">
              {frequencyOptions.map((opt) => {
                const activeVal = Number(watch(`phq9.q${phq9Index + 1}`));
                const isSelected = activeVal === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onSelectPhq9(opt.value)}
                    className={`p-4 rounded-2xl border text-center transition-all duration-200 ${
                      isSelected
                        ? "bg-accent border-accent/40 text-white shadow-lg shadow-accent/20 scale-105"
                        : "bg-white/[0.02] border-white/[0.06] text-slate-300 hover:border-white/20 hover:bg-white/[0.04]"
                    }`}
                  >
                    <span className="text-xs font-bold">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: GAD-7 Focused Question */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div>
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block mb-1">
                GAD-7 Item {gad7Index + 1} of 7
              </span>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <HelpCircle className="h-4.5 w-4.5 text-purple-400" />
                Anxiety Symptom Severity Scale
              </h2>
            </div>
          </div>

          <div className="py-4 space-y-6 text-center">
            <p className="text-base sm:text-lg font-bold text-white max-w-xl mx-auto leading-relaxed italic">
              &ldquo;{gad7Questions[gad7Index]}&rdquo;
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-2">
              {frequencyOptions.map((opt) => {
                const activeVal = Number(watch(`gad7.q${gad7Index + 1}`));
                const isSelected = activeVal === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onSelectGad7(opt.value)}
                    className={`p-4 rounded-2xl border text-center transition-all duration-200 ${
                      isSelected
                        ? "bg-purple-600 border-purple-500/40 text-white shadow-lg shadow-purple-500/20 scale-105"
                        : "bg-white/[0.02] border-white/[0.06] text-slate-300 hover:border-white/20 hover:bg-white/[0.04]"
                    }`}
                  >
                    <span className="text-xs font-bold">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Stress Perception & Sleep */}
      {step === 4 && (
        <div className="space-y-6">
          {!showSleep ? (
            <div className="space-y-6">
              <div className="border-b border-white/[0.06] pb-4">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                  Stress Item {stressIndex + 1} of 4
                </span>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <HelpCircle className="h-4.5 w-4.5 text-amber-400" />
                  Stress Perception Index
                </h2>
              </div>

              <div className="py-4 space-y-6 text-center">
                <p className="text-base sm:text-lg font-bold text-white max-w-xl mx-auto leading-relaxed italic">
                  &ldquo;{stressQuestions[stressIndex]}&rdquo;
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 max-w-3xl mx-auto pt-2">
                  {stressOptions.map((opt) => {
                    const activeVal = Number(watch(`stress.${stressIndex}.answer`));
                    const isSelected = activeVal === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => onSelectStress(opt.value)}
                        className={`py-3.5 px-3 rounded-2xl border text-center transition-all duration-200 ${
                          isSelected
                            ? "bg-amber-500 border-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20 scale-105"
                            : "bg-white/[0.02] border-white/[0.06] text-slate-300 hover:border-white/20"
                        }`}
                      >
                        <span className="text-xs font-bold">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="border-b border-white/[0.06] pb-4">
                <h2 className="text-xl font-bold tracking-tight text-white">Sleep Evaluation</h2>
                <p className="text-xs text-slate-400 mt-1">Assess your rest duration, latency, and subjective quality.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Sleep Duration (Hours per night)</label>
                  <input
                    type="number"
                    step="0.5"
                    {...register("sleep.duration")}
                    className="w-full rounded-2xl border border-white/[0.08] bg-slate-900/60 px-4 py-3 text-slate-200 text-xs outline-none focus:border-accent/40 transition-colors"
                  />
                  {errs.sleep?.duration && (
                    <p className="text-[10px] text-rose-400 font-medium">{String(errs.sleep.duration.message)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Sleep Quality</label>
                  <select
                    {...register("sleep.quality")}
                    className="w-full rounded-2xl border border-white/[0.08] bg-slate-900/60 px-4 py-3 text-slate-200 text-xs outline-none focus:border-accent/40 transition-colors"
                  >
                    <option value="">Select Quality</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                  {errs.sleep?.quality && (
                    <p className="text-[10px] text-rose-400 font-medium">{String(errs.sleep.quality.message)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Nightly Awakenings</label>
                  <input
                    type="number"
                    {...register("sleep.night_awakenings")}
                    className="w-full rounded-2xl border border-white/[0.08] bg-slate-900/60 px-4 py-3 text-slate-200 text-xs outline-none focus:border-accent/40 transition-colors"
                  />
                </div>

                <div className="flex items-center space-x-3 pt-6">
                  <input
                    type="checkbox"
                    id="sleep-difficulty"
                    {...register("sleep.difficulty_falling_asleep")}
                    className="h-5 w-5 rounded border-white/[0.08] bg-slate-950 text-accent focus:ring-accent accent-accent"
                  />
                  <label htmlFor="sleep-difficulty" className="text-xs font-semibold text-slate-300 select-none cursor-pointer">
                    Difficulty falling asleep (Takes &gt; 30 min)
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 5: Lifestyle & Wellbeing */}
      {step === 5 && (
        <div className="space-y-6">
          {!showWellbeing ? (
            <div className="space-y-6">
              <div className="border-b border-white/[0.06] pb-4">
                <h2 className="text-xl font-bold tracking-tight text-white">Lifestyle Metrics</h2>
                <p className="text-xs text-slate-400 mt-1">Physical activities, dietary guidelines, and hydration details.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Exercise Frequency</label>
                  <select
                    {...register("lifestyle.exercise")}
                    className="w-full rounded-2xl border border-white/[0.08] bg-slate-900/60 px-4 py-3 text-slate-200 text-xs outline-none focus:border-accent/40 transition-colors"
                  >
                    <option value="">Select Frequency</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly (2-3 times)</option>
                    <option value="Rarely">Rarely</option>
                    <option value="Never">Never</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Daily Screen Time (Hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    {...register("lifestyle.screen_time")}
                    className="w-full rounded-2xl border border-white/[0.08] bg-slate-900/60 px-4 py-3 text-slate-200 text-xs outline-none focus:border-accent/40 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Alcohol Intake</label>
                  <select
                    {...register("lifestyle.alcohol")}
                    className="w-full rounded-2xl border border-white/[0.08] bg-slate-900/60 px-4 py-3 text-slate-200 text-xs outline-none focus:border-accent/40 transition-colors"
                  >
                    <option value="">Select Level</option>
                    <option value="None">None</option>
                    <option value="Socially">Socially</option>
                    <option value="Frequently">Frequently</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Diet Description</label>
                  <select
                    {...register("lifestyle.diet")}
                    className="w-full rounded-2xl border border-white/[0.08] bg-slate-900/60 px-4 py-3 text-slate-200 text-xs outline-none focus:border-accent/40 transition-colors"
                  >
                    <option value="">Select Diet Type</option>
                    <option value="Healthy">Healthy (Fresh produce, lean protein)</option>
                    <option value="Balanced">Balanced (Mixed healthy and processed)</option>
                    <option value="Unhealthy">Unhealthy (High processed food)</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="border-b border-white/[0.06] pb-4">
                <h2 className="text-xl font-bold tracking-tight text-white">Subjective Wellbeing</h2>
                <p className="text-xs text-slate-400 mt-1">Self-rate these attributes from 1 (Low) to 10 (High).</p>
              </div>

              <div className="space-y-5">
                {[
                  { name: "wellbeing.happiness" as Path<FormValues>, label: "General Happiness / Life Satisfaction" },
                  { name: "wellbeing.energy" as Path<FormValues>, label: "Energy Level & Vitality" },
                  { name: "wellbeing.motivation" as Path<FormValues>, label: "Motivation & Goal Drive" },
                  { name: "wellbeing.concentration" as Path<FormValues>, label: "Mental Focus & Concentration" },
                ].map((slider) => {
                  const val = Number(watch(slider.name) || 7);
                  return (
                    <div key={slider.name} className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold text-slate-300">
                        <span>{slider.label}</span>
                        <span className="text-accent font-bold">{val} / 10</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        {...register(slider.name)}
                        className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-accent"
                      />
                    </div>
                  );
                })}

                <div className="space-y-2 pt-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Social Support Network</label>
                  <select
                    {...register("wellbeing.social_support")}
                    className="w-full rounded-2xl border border-white/[0.08] bg-slate-900/60 px-4 py-3 text-slate-200 text-xs outline-none focus:border-accent/40 transition-colors"
                  >
                    <option value="">Select Level</option>
                    <option value="Strong">Strong (Daily contact, high help)</option>
                    <option value="Moderate">Moderate (Weekly contact, average help)</option>
                    <option value="Weak">Weak (Rare contact, minimal help)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
        {step > 1 ? (
          <Button type="button" variant="secondary" onClick={onPrev} size="sm">
            <ChevronLeft className="mr-1.5 h-3.5 w-3.5" />
            <span>Back</span>
          </Button>
        ) : (
          <div />
        )}

        {step === 5 && showWellbeing ? (
          <Button
            type="button"
            onClick={onSubmitForm}
            disabled={submitting}
            variant="primary"
            className="bg-accent border border-accent/40 shadow-lg shadow-accent/20 hover:bg-accent/90 active:scale-95"
            size="sm"
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            <span>{submitting ? "Analyzing Pipeline..." : "Submit Clinical Evaluation"}</span>
          </Button>
        ) : (
          <Button type="button" variant="primary" onClick={onNext} size="sm">
            <span>Continue</span>
            <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        )}
      </div>

    </div>
  );
}
