/*
  Warnings:

  - You are about to drop the `Award` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Collection` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Comment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PointsHistoryItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PointsItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Rank` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserModel` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_collectionsDislikes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_collectionsLikes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_dislikes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_followers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_likes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_open` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateEnum
CREATE TYPE "MovieType" AS ENUM ('Film', 'Serial');

-- DropForeignKey
ALTER TABLE "Collection" DROP CONSTRAINT "Collection_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_parentId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_userId_fkey";

-- DropForeignKey
ALTER TABLE "PointsHistoryItem" DROP CONSTRAINT "PointsHistoryItem_pointsItemId_fkey";

-- DropForeignKey
ALTER TABLE "PointsHistoryItem" DROP CONSTRAINT "PointsHistoryItem_userModelId_fkey";

-- DropForeignKey
ALTER TABLE "Rank" DROP CONSTRAINT "Rank_awardId_fkey";

-- DropForeignKey
ALTER TABLE "UserModel" DROP CONSTRAINT "UserModel_awardId_fkey";

-- DropForeignKey
ALTER TABLE "UserModel" DROP CONSTRAINT "UserModel_rankId_fkey";

-- DropForeignKey
ALTER TABLE "_collectionsDislikes" DROP CONSTRAINT "_collectionsDislikes_A_fkey";

-- DropForeignKey
ALTER TABLE "_collectionsDislikes" DROP CONSTRAINT "_collectionsDislikes_B_fkey";

-- DropForeignKey
ALTER TABLE "_collectionsLikes" DROP CONSTRAINT "_collectionsLikes_A_fkey";

-- DropForeignKey
ALTER TABLE "_collectionsLikes" DROP CONSTRAINT "_collectionsLikes_B_fkey";

-- DropForeignKey
ALTER TABLE "_dislikes" DROP CONSTRAINT "_dislikes_A_fkey";

-- DropForeignKey
ALTER TABLE "_dislikes" DROP CONSTRAINT "_dislikes_B_fkey";

-- DropForeignKey
ALTER TABLE "_followers" DROP CONSTRAINT "_followers_A_fkey";

-- DropForeignKey
ALTER TABLE "_followers" DROP CONSTRAINT "_followers_B_fkey";

-- DropForeignKey
ALTER TABLE "_likes" DROP CONSTRAINT "_likes_A_fkey";

-- DropForeignKey
ALTER TABLE "_likes" DROP CONSTRAINT "_likes_B_fkey";

-- DropForeignKey
ALTER TABLE "_open" DROP CONSTRAINT "_open_A_fkey";

-- DropForeignKey
ALTER TABLE "_open" DROP CONSTRAINT "_open_B_fkey";

-- DropTable
DROP TABLE "Award";

-- DropTable
DROP TABLE "Collection";

-- DropTable
DROP TABLE "Comment";

-- DropTable
DROP TABLE "PointsHistoryItem";

-- DropTable
DROP TABLE "PointsItem";

-- DropTable
DROP TABLE "Rank";

-- DropTable
DROP TABLE "UserModel";

-- DropTable
DROP TABLE "_collectionsDislikes";

-- DropTable
DROP TABLE "_collectionsLikes";

-- DropTable
DROP TABLE "_dislikes";

-- DropTable
DROP TABLE "_followers";

-- DropTable
DROP TABLE "_likes";

-- DropTable
DROP TABLE "_open";

-- DropEnum
DROP TYPE "AwardCategory";

-- DropEnum
DROP TYPE "Role";

-- DropEnum
DROP TYPE "StatusComment";

-- DropEnum
DROP TYPE "VisibleMode";

-- CreateTable
CREATE TABLE "Actor" (
    "id" SERIAL NOT NULL,
    "birthday" TEXT,
    "kinopoiskId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "sex" TEXT,
    "profession" INTEGER NOT NULL,

    CONSTRAINT "Actor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Genre" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Genre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Country" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Movie" (
    "id" INTEGER NOT NULL,
    "kinopoiskId" INTEGER NOT NULL,
    "imdbId" TEXT,
    "nameOriginal" TEXT,
    "nameRussian" TEXT,
    "alias" TEXT NOT NULL,
    "premiere" TIMESTAMP(3),
    "ratingKp" DOUBLE PRECISION,
    "ratingImdb" DOUBLE PRECISION,
    "ageRestriction" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "slogan" TEXT,
    "budget" TEXT,
    "trailer" TEXT,
    "type" "MovieType",
    "timeMinutes" INTEGER,
    "poster" TEXT,

    CONSTRAINT "Movie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ActorToMovie" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_GenreToMovie" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_CountryToMovie" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Actor_kinopoiskId_key" ON "Actor"("kinopoiskId");

-- CreateIndex
CREATE UNIQUE INDEX "Movie_kinopoiskId_key" ON "Movie"("kinopoiskId");

-- CreateIndex
CREATE UNIQUE INDEX "Movie_alias_key" ON "Movie"("alias");

-- CreateIndex
CREATE UNIQUE INDEX "_ActorToMovie_AB_unique" ON "_ActorToMovie"("A", "B");

-- CreateIndex
CREATE INDEX "_ActorToMovie_B_index" ON "_ActorToMovie"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_GenreToMovie_AB_unique" ON "_GenreToMovie"("A", "B");

-- CreateIndex
CREATE INDEX "_GenreToMovie_B_index" ON "_GenreToMovie"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CountryToMovie_AB_unique" ON "_CountryToMovie"("A", "B");

-- CreateIndex
CREATE INDEX "_CountryToMovie_B_index" ON "_CountryToMovie"("B");

-- AddForeignKey
ALTER TABLE "_ActorToMovie" ADD CONSTRAINT "_ActorToMovie_A_fkey" FOREIGN KEY ("A") REFERENCES "Actor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActorToMovie" ADD CONSTRAINT "_ActorToMovie_B_fkey" FOREIGN KEY ("B") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GenreToMovie" ADD CONSTRAINT "_GenreToMovie_A_fkey" FOREIGN KEY ("A") REFERENCES "Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GenreToMovie" ADD CONSTRAINT "_GenreToMovie_B_fkey" FOREIGN KEY ("B") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CountryToMovie" ADD CONSTRAINT "_CountryToMovie_A_fkey" FOREIGN KEY ("A") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CountryToMovie" ADD CONSTRAINT "_CountryToMovie_B_fkey" FOREIGN KEY ("B") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;
