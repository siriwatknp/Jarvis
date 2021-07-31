export function shuffle<T>(array: Array<T>) {
  let currentIndex = array.length;
  let randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}

export function splitByWeight<T extends { weight?: number | null }>(
  array: Array<T>
): Array<T> {
  // @ts-ignore
  return array.reduce((result, current) => {
    const items = [
      ...Array(typeof current.weight === "number" ? current.weight : 1),
    ].map(() => current);
    return [...result, ...items];
  }, []);
}

export function randomOneItem<T>(array: Array<T>) {
  function randomIntFromInterval(min: number, max: number) {
    // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
  const randomNumber = randomIntFromInterval(0, array.length - 1);
  return array[randomNumber];
}
