export type Faq = {
    id: number;
    question: string;
    answer: string;
    category: string;
    createdAt: string;
    updatedAt: string;

};

export type FaqRequest = {
    question: string;
    answer: string;
    category: string;
};
