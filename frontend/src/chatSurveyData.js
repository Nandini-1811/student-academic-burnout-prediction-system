// Each subscale: a set of representative items (0-4 Likert scale),
// plus how to scale the raw sum into the range our trained model expects.

export const LIKERT_OPTIONS = [
  { label: "Never", emoji: "😄", value: 0 },
  { label: "Rarely", emoji: "🙂", value: 1 },
  { label: "Sometimes", emoji: "😐", value: 2 },
  { label: "Often", emoji: "😣", value: 3 },
  { label: "Always", emoji: "😩", value: 4 },
];

export const CHAT_QUESTIONS = [
  { id: "ex1", subscale: "mbi_exhaustion", text: "I feel emotionally drained from my studies." },
  { id: "ex2", subscale: "mbi_exhaustion", text: "I feel tired when I get up and have to face another day of studies." },

  { id: "cy1", subscale: "mbi_cynicism", text: "I have become less interested in my studies since starting college." },
  { id: "cy2", subscale: "mbi_cynicism", text: "I doubt the significance of my studies." },

  { id: "ef1", subscale: "mbi_efficacy", text: "I can effectively solve problems that arise in my studies." },
  { id: "ef2", subscale: "mbi_efficacy", text: "I feel confident that I am effective at getting things done in my studies." },

  { id: "de1", subscale: "dass_depression", text: "I felt that I had nothing to look forward to." },
  { id: "de2", subscale: "dass_depression", text: "I found it difficult to feel positive about anything." },

  { id: "an1", subscale: "dass_anxiety", text: "I felt scared without any good reason." },
  { id: "an2", subscale: "dass_anxiety", text: "I felt close to panic." },

  { id: "st1", subscale: "dass_stress", text: "I found it hard to wind down." },
  { id: "st2", subscale: "dass_stress", text: "I felt that I was using a lot of nervous energy just to get through the day." },

  { id: "co1", subscale: "cope_score", text: "I try to think of a strategy about what to do when things get hard." },
  { id: "co2", subscale: "cope_score", text: "I take action to try to make my situation better." },
];


// How to convert each subscale's raw sum into the 0-X range the trained model expects
export const SCALING_CONFIG = {
  mbi_exhaustion: { itemCount: 2, min: 0, max: 54 },
  mbi_cynicism: { itemCount: 2, min: 0, max: 45 },
  mbi_efficacy: { itemCount: 2, min: 0, max: 48 },
  dass_depression: { itemCount: 2, min: 0, max: 42 },
  dass_anxiety: { itemCount: 2, min: 0, max: 42 },
  dass_stress: { itemCount: 2, min: 0, max: 42 },
  cope_score: { itemCount: 2, min: 10, max: 60 },
};

// Takes {questionId: likertValue} answers and returns the 7 scaled subscale scores
export function computeSubscaleScores(answers) {
  const subscaleRawSums = {};

  CHAT_QUESTIONS.forEach((q) => {
    const value = answers[q.id] ?? 0;
    subscaleRawSums[q.subscale] = (subscaleRawSums[q.subscale] || 0) + value;
  });

  const scores = {};
  for (const subscale in SCALING_CONFIG) {
    const { itemCount, min, max } = SCALING_CONFIG[subscale];
    const rawMax = itemCount * 4; // each item is 0-4
    const rawSum = subscaleRawSums[subscale] || 0;
    const scaled = min + (rawSum / rawMax) * (max - min);
    scores[subscale] = Math.round(scaled * 10) / 10; // round to 1 decimal
  }

  return scores;
}


// Plain-language proxy questions for the two behavioral fields
// students can't self-report as raw numbers.
export const BEHAVIORAL_CHOICE_QUESTIONS = [
  {
    id: "grade_trend",
    field: "grade_decline_slope",
    text: "How have your grades been trending recently?",
    options: [
      { emoji: "📈", label: "Improving", value: 1.5 },
      { emoji: "➡️", label: "About the same", value: 0 },
      { emoji: "📉", label: "Slipping a little", value: -1.5 },
      { emoji: "⚠️", label: "Dropping a lot", value: -3.5 },
    ],
  },
  {
    id: "consistency",
    field: "engagement_variability",
    text: "How consistent has your study routine been, week to week?",
    options: [
      { emoji: "🟢", label: "Very consistent", value: 1 },
      { emoji: "🟡", label: "Fairly consistent", value: 3 },
      { emoji: "🟠", label: "Up and down", value: 6 },
      { emoji: "🔴", label: "All over the place", value: 10 },
    ],
  },
];