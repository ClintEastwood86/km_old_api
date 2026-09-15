/*
  Warnings:

  - You are about to drop the `Actor` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Country` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Genre` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Movie` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Popular` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ActorToMovie` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_CountryToMovie` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_GenreToMovie` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_Similar` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "StatusComment" AS ENUM ('REJECTED', 'DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'MODERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "VisibleMode" AS ENUM ('VISIBLE', 'HIDDEN');

-- CreateEnum
CREATE TYPE "AwardCategory" AS ENUM ('REGISTER', 'RANKS', 'POINTS');

-- DropForeignKey
ALTER TABLE "_ActorToMovie" DROP CONSTRAINT "_ActorToMovie_A_fkey";

-- DropForeignKey
ALTER TABLE "_ActorToMovie" DROP CONSTRAINT "_ActorToMovie_B_fkey";

-- DropForeignKey
ALTER TABLE "_CountryToMovie" DROP CONSTRAINT "_CountryToMovie_A_fkey";

-- DropForeignKey
ALTER TABLE "_CountryToMovie" DROP CONSTRAINT "_CountryToMovie_B_fkey";

-- DropForeignKey
ALTER TABLE "_GenreToMovie" DROP CONSTRAINT "_GenreToMovie_A_fkey";

-- DropForeignKey
ALTER TABLE "_GenreToMovie" DROP CONSTRAINT "_GenreToMovie_B_fkey";

-- DropForeignKey
ALTER TABLE "_Similar" DROP CONSTRAINT "_Similar_A_fkey";

-- DropForeignKey
ALTER TABLE "_Similar" DROP CONSTRAINT "_Similar_B_fkey";

-- DropTable
DROP TABLE "Actor";

-- DropTable
DROP TABLE "Country";

-- DropTable
DROP TABLE "Genre";

-- DropTable
DROP TABLE "Movie";

-- DropTable
DROP TABLE "Popular";

-- DropTable
DROP TABLE "_ActorToMovie";

-- DropTable
DROP TABLE "_CountryToMovie";

-- DropTable
DROP TABLE "_GenreToMovie";

-- DropTable
DROP TABLE "_Similar";

-- DropEnum
DROP TYPE "MovieType";

-- CreateTable
CREATE TABLE "UserModel" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatar" TEXT,
    "notification" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "rankId" INTEGER NOT NULL DEFAULT 1,
    "userPoints" INTEGER NOT NULL DEFAULT 0,
    "updatedEmailAt" TIMESTAMP(3),
    "updatedLoginAt" TIMESTAMP(3),
    "watchedMinutes" INTEGER NOT NULL DEFAULT 0,
    "lastViewToken" TEXT,
    "awardId" INTEGER,
    "marks" INTEGER[],
    "confirmToken" TEXT,
    "forgotPasswordToken" TEXT,
    "notificationToken" TEXT NOT NULL,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "updatedAvatarAt" TIMESTAMP(3),

    CONSTRAINT "UserModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoryItem" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "movieId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,

    CONSTRAINT "HistoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rank" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "awardId" INTEGER,

    CONSTRAINT "Rank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bonus" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiries" TIMESTAMP(3) NOT NULL,
    "multiplier" INTEGER NOT NULL,
    "userModelId" INTEGER NOT NULL,
    "adminId" INTEGER NOT NULL,

    CONSTRAINT "Bonus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointsItem" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "addPoints" INTEGER NOT NULL,

    CONSTRAINT "PointsItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointsHistoryItem" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "addPoints" INTEGER,
    "pointsAddedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pointsItemId" INTEGER,
    "userModelId" INTEGER NOT NULL,
    "userMultiplier" DOUBLE PRECISION DEFAULT 1,

    CONSTRAINT "PointsHistoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Award" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "AwardCategory" NOT NULL,
    "position" SERIAL NOT NULL,

    CONSTRAINT "Award_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "status" "StatusComment" NOT NULL DEFAULT 'DRAFT',
    "parentId" INTEGER,
    "movieId" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "creatorId" INTEGER NOT NULL,
    "moviesId" INTEGER[],
    "color" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "private" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Holidays" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "bonus" INTEGER NOT NULL,

    CONSTRAINT "Holidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaderboardUserSnapshot" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "year" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "rankId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "pointsAchieved" INTEGER NOT NULL,
    "minutesWatched" INTEGER NOT NULL,

    CONSTRAINT "LeaderboardUserSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "_open" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_open_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_dislikes" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_dislikes_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_likes" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_likes_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_collectionsDislikes" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_collectionsDislikes_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_collectionsLikes" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_collectionsLikes_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_followers" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_followers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserModel_email_key" ON "UserModel"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserModel_login_key" ON "UserModel"("login");

-- CreateIndex
CREATE UNIQUE INDEX "Rank_name_key" ON "Rank"("name");

-- CreateIndex
CREATE UNIQUE INDEX "LeaderboardUserSnapshot_year_userId_key" ON "LeaderboardUserSnapshot"("year", "userId");

-- CreateIndex
CREATE INDEX "_open_B_index" ON "_open"("B");

-- CreateIndex
CREATE INDEX "_dislikes_B_index" ON "_dislikes"("B");

-- CreateIndex
CREATE INDEX "_likes_B_index" ON "_likes"("B");

-- CreateIndex
CREATE INDEX "_collectionsDislikes_B_index" ON "_collectionsDislikes"("B");

-- CreateIndex
CREATE INDEX "_collectionsLikes_B_index" ON "_collectionsLikes"("B");

-- CreateIndex
CREATE INDEX "_followers_B_index" ON "_followers"("B");

-- AddForeignKey
ALTER TABLE "UserModel" ADD CONSTRAINT "UserModel_awardId_fkey" FOREIGN KEY ("awardId") REFERENCES "Award"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserModel" ADD CONSTRAINT "UserModel_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "Rank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoryItem" ADD CONSTRAINT "HistoryItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rank" ADD CONSTRAINT "Rank_awardId_fkey" FOREIGN KEY ("awardId") REFERENCES "Award"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bonus" ADD CONSTRAINT "Bonus_userModelId_fkey" FOREIGN KEY ("userModelId") REFERENCES "UserModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bonus" ADD CONSTRAINT "Bonus_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "UserModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsHistoryItem" ADD CONSTRAINT "PointsHistoryItem_pointsItemId_fkey" FOREIGN KEY ("pointsItemId") REFERENCES "PointsItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsHistoryItem" ADD CONSTRAINT "PointsHistoryItem_userModelId_fkey" FOREIGN KEY ("userModelId") REFERENCES "UserModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "UserModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderboardUserSnapshot" ADD CONSTRAINT "LeaderboardUserSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_open" ADD CONSTRAINT "_open_A_fkey" FOREIGN KEY ("A") REFERENCES "Award"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_open" ADD CONSTRAINT "_open_B_fkey" FOREIGN KEY ("B") REFERENCES "UserModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_dislikes" ADD CONSTRAINT "_dislikes_A_fkey" FOREIGN KEY ("A") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_dislikes" ADD CONSTRAINT "_dislikes_B_fkey" FOREIGN KEY ("B") REFERENCES "UserModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_likes" ADD CONSTRAINT "_likes_A_fkey" FOREIGN KEY ("A") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_likes" ADD CONSTRAINT "_likes_B_fkey" FOREIGN KEY ("B") REFERENCES "UserModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_collectionsDislikes" ADD CONSTRAINT "_collectionsDislikes_A_fkey" FOREIGN KEY ("A") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_collectionsDislikes" ADD CONSTRAINT "_collectionsDislikes_B_fkey" FOREIGN KEY ("B") REFERENCES "UserModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_collectionsLikes" ADD CONSTRAINT "_collectionsLikes_A_fkey" FOREIGN KEY ("A") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_collectionsLikes" ADD CONSTRAINT "_collectionsLikes_B_fkey" FOREIGN KEY ("B") REFERENCES "UserModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_followers" ADD CONSTRAINT "_followers_A_fkey" FOREIGN KEY ("A") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_followers" ADD CONSTRAINT "_followers_B_fkey" FOREIGN KEY ("B") REFERENCES "UserModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
