-- AlterTable
ALTER TABLE "Movie" ADD COLUMN     "isBlocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ratingImdbCount" INTEGER,
ADD COLUMN     "ratingKpCount" INTEGER,
ADD COLUMN     "secondPoster" TEXT;

-- CreateTable
CREATE TABLE "Popular" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "movies" INTEGER[],

    CONSTRAINT "Popular_pkey" PRIMARY KEY ("id")
);
