export interface Answer {
  _id?: string;
  author: string;
  authorName: string;
  answer: string;
  createdAt: string;
}

export interface Question {
  _id?: string;
  recipe: string;
  author: string;
  authorName: string;
  question: string;
  answers: Answer[];
  isResolved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuestionData {
  recipeId: string;
  question: string;
}

export interface CreateAnswerData {
  answer: string;
}