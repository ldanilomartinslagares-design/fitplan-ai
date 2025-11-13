"use client";

import { useState } from "react";
import { Upload, Target, Dumbbell, Utensils, Camera, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface WorkoutPlan {
  weeklySchedule: {
    day: string;
    exercises: {
      name: string;
      sets: string;
      reps: string;
      rest: string;
    }[];
  }[];
  tips: string[];
}

interface MealPlan {
  dailyCalories: number;
  meals: {
    time: string;
    name: string;
    foods: string[];
    calories: number;
  }[];
  tips: string[];
}

interface UserPlan {
  photo: string;
  weightGoal: number;
  currentAnalysis: string;
  workoutPlan: WorkoutPlan;
  mealPlan: MealPlan;
  createdAt: string;
}

export default function Home() {
  const [step, setStep] = useState<"upload" | "generating" | "results">("upload");
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [weightGoal, setWeightGoal] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("A foto deve ter no máximo 5MB");
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!photoFile || !weightGoal) {
      toast.error("Por favor, envie uma foto e defina sua meta de peso");
      return;
    }

    const goal = parseFloat(weightGoal);
    if (isNaN(goal) || goal <= 0 || goal > 50) {
      toast.error("Meta de peso deve ser entre 0.1 e 50 kg");
      return;
    }

    setLoading(true);
    setStep("generating");

    try {
      // Converter foto para base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;

        // Chamar API para análise e geração de planos
        const response = await fetch("/api/generate-plan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image: base64Image,
            weightGoal: goal,
          }),
        });

        if (!response.ok) {
          throw new Error("Erro ao gerar plano");
        }

        const data = await response.json();

        const plan: UserPlan = {
          photo: base64Image,
          weightGoal: goal,
          currentAnalysis: data.analysis,
          workoutPlan: data.workoutPlan,
          mealPlan: data.mealPlan,
          createdAt: new Date().toISOString(),
        };

        // Salvar no localStorage
        localStorage.setItem("fitnessPlan", JSON.stringify(plan));
        setUserPlan(plan);
        setStep("results");
        toast.success("Plano gerado com sucesso!");
      };

      reader.readAsDataURL(photoFile);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar plano. Tente novamente.");
      setStep("upload");
    } finally {
      setLoading(false);
    }
  };

  const resetPlan = () => {
    setStep("upload");
    setPhotoPreview("");
    setPhotoFile(null);
    setWeightGoal("");
    setUserPlan(null);
    localStorage.removeItem("fitnessPlan");
  };

  // Carregar plano salvo ao montar
  useState(() => {
    const saved = localStorage.getItem("fitnessPlan");
    if (saved) {
      try {
        const plan = JSON.parse(saved);
        setUserPlan(plan);
        setStep("results");
      } catch (error) {
        console.error("Erro ao carregar plano salvo:", error);
      }
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <Dumbbell className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            FitPlan AI
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base max-w-2xl mx-auto">
            Seu personal trainer e nutricionista com inteligência artificial
          </p>
        </div>

        {/* Upload Step */}
        {step === "upload" && (
          <div className="max-w-2xl mx-auto">
            <Card className="border-2 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
                  <Camera className="w-6 h-6 text-blue-600" />
                  Comece sua transformação
                </CardTitle>
                <CardDescription>
                  Envie uma foto e defina sua meta para receber um plano personalizado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Upload de Foto */}
                <div className="space-y-2">
                  <Label htmlFor="photo" className="text-base font-semibold">
                    Foto do corpo atual
                  </Label>
                  <div className="relative">
                    <Input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="photo"
                      className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300"
                    >
                      {photoPreview ? (
                        <div className="relative w-full h-full">
                          <img
                            src={photoPreview}
                            alt="Preview"
                            className="w-full h-full object-cover rounded-xl"
                          />
                          <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <p className="text-white font-semibold">Clique para trocar</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8">
                          <Upload className="w-12 h-12 text-gray-400 mb-3" />
                          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">
                            Clique para enviar uma foto
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG até 5MB</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Meta de Peso */}
                <div className="space-y-2">
                  <Label htmlFor="weight" className="text-base font-semibold flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-600" />
                    Quanto deseja perder? (kg)
                  </Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="Ex: 5"
                    value={weightGoal}
                    onChange={(e) => setWeightGoal(e.target.value)}
                    min="0.1"
                    max="50"
                    step="0.1"
                    className="text-lg h-12"
                  />
                  <p className="text-xs text-gray-500">
                    Recomendamos metas realistas de 0.5 a 1kg por semana
                  </p>
                </div>

                {/* Botão Submit */}
                <Button
                  onClick={handleSubmit}
                  disabled={!photoFile || !weightGoal || loading}
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Gerando plano...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Gerar meu plano personalizado
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Generating Step */}
        {step === "generating" && (
          <div className="max-w-2xl mx-auto">
            <Card className="border-2 shadow-xl">
              <CardContent className="py-16">
                <div className="flex flex-col items-center justify-center space-y-6">
                  <div className="relative">
                    <div className="w-24 h-24 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                    <Dumbbell className="w-10 h-10 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-bold">Analisando sua foto...</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Estamos criando um plano personalizado para você
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                      Analisando composição corporal
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse delay-100" />
                      Gerando plano de treino
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-pink-600 rounded-full animate-pulse delay-200" />
                      Criando plano alimentar
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results Step */}
        {step === "results" && userPlan && (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Análise */}
            <Card className="border-2 shadow-xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
                  <Camera className="w-6 h-6 text-blue-600" />
                  Análise Corporal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <img
                      src={userPlan.photo}
                      alt="Foto corporal"
                      className="w-full h-64 object-cover rounded-xl shadow-lg"
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Meta de perda de peso</p>
                      <p className="text-3xl font-bold text-purple-600">{userPlan.weightGoal} kg</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
                      <p className="text-sm font-semibold mb-2">Análise:</p>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                        {userPlan.currentAnalysis}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Planos */}
            <Tabs defaultValue="workout" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-auto p-1">
                <TabsTrigger value="workout" className="flex items-center gap-2 py-3">
                  <Dumbbell className="w-5 h-5" />
                  <span className="hidden sm:inline">Plano de Treino</span>
                  <span className="sm:hidden">Treino</span>
                </TabsTrigger>
                <TabsTrigger value="meal" className="flex items-center gap-2 py-3">
                  <Utensils className="w-5 h-5" />
                  <span className="hidden sm:inline">Plano Alimentar</span>
                  <span className="sm:hidden">Alimentação</span>
                </TabsTrigger>
              </TabsList>

              {/* Workout Plan */}
              <TabsContent value="workout" className="space-y-4 mt-6">
                {userPlan.workoutPlan.weeklySchedule.map((day, idx) => (
                  <Card key={idx} className="border-2 shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
                      <CardTitle className="text-lg md:text-xl">{day.day}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {day.exercises.map((exercise, exIdx) => (
                          <div
                            key={exIdx}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <div className="mb-2 sm:mb-0">
                              <h4 className="font-semibold text-base">{exercise.name}</h4>
                            </div>
                            <div className="flex flex-wrap gap-3 text-sm">
                              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                                {exercise.sets}
                              </span>
                              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full font-medium">
                                {exercise.reps}
                              </span>
                              <span className="px-3 py-1 bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 rounded-full font-medium">
                                {exercise.rest}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Workout Tips */}
                <Card className="border-2 shadow-lg bg-blue-50 dark:bg-gray-800">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-blue-600" />
                      Dicas Importantes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {userPlan.workoutPlan.tips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-blue-600 mt-1">•</span>
                          <span className="text-gray-700 dark:text-gray-300">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Meal Plan */}
              <TabsContent value="meal" className="space-y-4 mt-6">
                <Card className="border-2 shadow-lg bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-gray-800 dark:to-gray-900">
                  <CardHeader>
                    <CardTitle className="text-xl md:text-2xl">
                      Meta Diária: {userPlan.mealPlan.dailyCalories} calorias
                    </CardTitle>
                    <CardDescription>
                      Plano alimentar balanceado para atingir sua meta
                    </CardDescription>
                  </CardHeader>
                </Card>

                {userPlan.mealPlan.meals.map((meal, idx) => (
                  <Card key={idx} className="border-2 shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader className="bg-gradient-to-r from-orange-500 to-yellow-600 text-white rounded-t-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <CardTitle className="text-lg md:text-xl">{meal.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                            {meal.time}
                          </span>
                          <span className="text-sm bg-white/20 px-3 py-1 rounded-full font-semibold">
                            {meal.calories} kcal
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <ul className="space-y-2">
                        {meal.foods.map((food, foodIdx) => (
                          <li
                            key={foodIdx}
                            className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                          >
                            <span className="w-2 h-2 bg-orange-500 rounded-full" />
                            <span className="text-gray-700 dark:text-gray-300">{food}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}

                {/* Meal Tips */}
                <Card className="border-2 shadow-lg bg-orange-50 dark:bg-gray-800">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-orange-600" />
                      Dicas Nutricionais
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {userPlan.mealPlan.tips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-orange-600 mt-1">•</span>
                          <span className="text-gray-700 dark:text-gray-300">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Reset Button */}
            <div className="flex justify-center pt-6">
              <Button
                onClick={resetPlan}
                variant="outline"
                className="border-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Criar novo plano
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
