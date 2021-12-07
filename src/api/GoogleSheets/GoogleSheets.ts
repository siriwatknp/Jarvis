const COL: string[] = [];
const BASE_COL = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

BASE_COL.forEach((col) => COL.push(col));

for (let i = 0; i < BASE_COL.length; i++) {
  for (let j = 0; j < BASE_COL.length; j++) {
    COL.push(`${BASE_COL[i]}${BASE_COL[j]}`);
  }
}

export { BASE_COL, COL };
