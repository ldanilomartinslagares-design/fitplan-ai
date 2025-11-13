import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { image, weightGoal } = await request.json();

    if (!image || !weightGoal) {
      return NextResponse.json(
        { error: "Imagem e meta de peso são obrigatórios" },
        { status: 400 }
      );
    }

    // Análise da imagem com GPT-4 Vision
    const analysisResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analise esta foto corporal e forneça uma avaliação breve e motivadora sobre a composição corporal atual da pessoa. Seja profissional, respeitoso e encorajador. Foque em aspectos positivos e áreas de melhoria. Máximo 3 frases.`,
            },
            {
              type: "image_url",
              image_url: {
                url: image,
              },
            },
          ],
        },
      ],
      max_tokens: 300,
    });

    const analysis = analysisResponse.choices[0].message.content || "Análise não disponível";

    // Gerar plano de treino
    const workoutResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Você é um personal trainer especializado em treinos em casa. Crie um plano de treino semanal completo e detalhado para perda de ${weightGoal}kg. O plano deve incluir exercícios que podem ser feitos em casa sem equipamentos ou com equipamentos básicos (garrafas, cadeiras, etc).

Retorne APENAS um JSON válido no seguinte formato:
{
  "weeklySchedule": [
    {
      "day": "Segunda-feira - Treino A",
      "exercises": [
        {
          "name": "Nome do exercício",
          "sets": "3 séries",
          "reps": "12-15 reps",
          "rest": "60s descanso"
        }
      ]
    }
  ],
  "tips": [
    "Dica 1",
    "Dica 2",
    "Dica 3"
  ]
}

Crie um plano de 5 dias (Segunda a Sexta) com 5-6 exercícios por dia. Inclua aquecimento e alongamento. Seja específico e prático.`,
        },
        {
          role: "user",
          content: `Crie um plano de treino em casa para perder ${weightGoal}kg.`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
    });

    const workoutPlan = JSON.parse(workoutResponse.choices[0].message.content || "{}");

    // Gerar plano alimentar
    const mealResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Você é um nutricionista especializado em emagrecimento saudável. Crie um plano alimentar diário completo e balanceado para perda de ${weightGoal}kg.

Retorne APENAS um JSON válido no seguinte formato:
{
  "dailyCalories": 1800,
  "meals": [
    {
      "time": "07:00",
      "name": "Café da Manhã",
      "foods": [
        "Alimento 1 com quantidade",
        "Alimento 2 com quantidade"
      ],
      "calories": 400
    }
  ],
  "tips": [
    "Dica nutricional 1",
    "Dica nutricional 2",
    "Dica nutricional 3"
  ]
}

Crie 5-6 refeições por dia (café, lanche manhã, almoço, lanche tarde, jantar, ceia opcional). Seja específico com quantidades e calorias. Foque em alimentos saudáveis, acessíveis e práticos.`,
        },
        {
          role: "user",
          content: `Crie um plano alimentar para perder ${weightGoal}kg de forma saudável.`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
    });

    const mealPlan = JSON.parse(mealResponse.choices[0].message.content || "{}");

    return NextResponse.json({
      analysis,
      workoutPlan,
      mealPlan,
    });
  } catch (error) {
    console.error("Erro ao gerar plano:", error);
    return NextResponse.json(
      { error: "Erro ao gerar plano. Tente novamente." },
      { status: 500 }
    );
  }
}
