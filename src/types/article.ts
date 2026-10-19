/** Bài public (ví dụ dùng cho component) — tham chiếu Prisma `Article` để đầy đủ trường. */
export type Article = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  coverImageUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  ogImageUrl?: string;
  publishedAt?: string;
  author: string;
  tags: string[];
};
