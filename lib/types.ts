import { Prisma } from "@prisma/client";

/** Shared Prisma include for rendering a post card (feed + post detail). */
export const postInclude = {
  author: { select: { id: true, username: true, avatarKey: true } },
  media: { orderBy: { order: "asc" as const } },
  likes: { select: { userId: true } },
  comments: {
    orderBy: { createdAt: "asc" as const },
    include: { author: { select: { id: true, username: true } } },
  },
  _count: { select: { likes: true, comments: true } },
} satisfies Prisma.PostInclude;

export type PostWithRelations = Prisma.PostGetPayload<{ include: typeof postInclude }>;

export interface MemberOption {
  id: string;
  username: string;
}
