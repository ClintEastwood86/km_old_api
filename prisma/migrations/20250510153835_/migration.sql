-- CreateTable
CREATE TABLE "_Similar" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_Similar_AB_unique" ON "_Similar"("A", "B");

-- CreateIndex
CREATE INDEX "_Similar_B_index" ON "_Similar"("B");

-- AddForeignKey
ALTER TABLE "_Similar" ADD CONSTRAINT "_Similar_A_fkey" FOREIGN KEY ("A") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Similar" ADD CONSTRAINT "_Similar_B_fkey" FOREIGN KEY ("B") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;
