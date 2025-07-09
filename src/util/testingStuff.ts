let questions: string[] = [];
let answers: (number | string)[] = [];
let alternatives: { rightAnswer: number; alternatives: (string | number)[] }[] =
  [];
let shouldChangeFontSize: { buttonFontSize?: number; fontSize?: number }[] = [];
let seed: string | undefined = undefined;
let random: (() => number) | undefined = undefined;
let finalTime: number | null = null;
let eachQuestionTime: number[] = [];

function imul(a: number, b: number) {
  let ah = (a >>> 16) & 0xffff;
  let al = a & 0xffff;
  let bh = (b >>> 16) & 0xffff;
  let bl = b & 0xffff;
  // the shift by 0 fixes the sign on the high part
  // the final |0 converts the unsigned value into a signed value
  return (al * bl + (((ah * bl + al * bh) << 16) >>> 0)) | 0;
}

function cyrb128(str: string) {
  let h1 = 1779033703,
    h2 = 3144134277,
    h3 = 1013904242,
    h4 = 2773480762;
  for (let i = 0, k; i < str.length; i++) {
    k = str.charCodeAt(i);
    h1 = h2 ^ imul(h1 ^ k, 597399067);
    h2 = h3 ^ imul(h2 ^ k, 2869860233);
    h3 = h4 ^ imul(h3 ^ k, 951274213);
    h4 = h1 ^ imul(h4 ^ k, 2716044179);
  }
  h1 = imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = imul(h2 ^ (h4 >>> 19), 2716044179);
  return [
    (h1 ^ h2 ^ h3 ^ h4) >>> 0,
    (h2 ^ h1) >>> 0,
    (h3 ^ h1) >>> 0,
    (h4 ^ h1) >>> 0
  ];
}

function sfc32(a: number, b: number, c: number, d: number) {
  return function () {
    a >>>= 0;
    b >>>= 0;
    c >>>= 0;
    d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

function randomNumberSeeded(min: number, max: number) {
  return Math.floor(random!() * (max - min + 1) + min);
}

// function writeTimer() {
//   let minutes = Math.floor(timer / 60);
//   let seconds = timer % 60;

//   if (timer === 60 * 60) {
//     setScreen('home');
//     timer = 0;
//     clearInterval(interval);
//     if (!setSeed) {
//       seed = null;
//     }
//   }

//   setText(
//     'timer',
//     (minutes < 10 ? '0' + minutes : minutes) +
//       ':' +
//       (seconds < 10 ? '0' + seconds : seconds)
//   );
// }

// function createTimerInterval() {
//   timer++;
//   writeTimer();
// }

let operations: { [_: string]: (a: number, b: number) => number } = {
  '+': function (a, b) {
    return a + b;
  },
  '-': function (a, b) {
    return a - b;
  },
  x: function (a, b) {
    return a * b;
  },
  // "÷": function (a, b) {
  //   return a / b;
  // },
  '^': function (a, b) {
    return Math.pow(a, b);
  }
};

let readable: {
  [_: string | symbol | number]: (a: number, b: number) => string;
} = {
  '^': function (a, b) {
    let result = '';
    let superscriptMap: { [_: string | number]: string } = {
      0: '\u2070',
      1: '\u00B9',
      2: '\u00B2',
      3: '\u00B3',
      4: '\u2074',
      5: '\u2075',
      6: '\u2076',
      7: '\u2077',
      8: '\u2078',
      9: '\u2079',
      '-': '\u207B'
    };

    for (let i = 0; i < b.toString().length; i++) {
      result += superscriptMap[b.toString()[i]];
    }

    return a + result + ' =';
  }
};

// function updateQuestionNumber() {
//   setText('questionNumber', 'Questão número: ' + (currentQuestion + 1));
// }

function randomOperation(max: number) {
  return Object.keys(operations)[randomNumberSeeded(0, max)];
  // return "÷";
}

function createAlternatives(questionNumber: number) {
  let rightAnswer = randomNumberSeeded(0, 3);
  let currentAlternatives = [];
  for (let i = 0; i < 4; i++) {
    let alternative: string | number = '';

    if (i === rightAnswer) {
      alternative = answers[questionNumber];
    } else {
      alternative = Math.ceil(
        operations[randomOperation(!!answers[questionNumber] ? 1 : 2)](
          answers[questionNumber] as number,
          randomNumberSeeded(2, 6)
        )
      );
    }

    currentAlternatives.push(alternative);
  }

  return { alternatives: currentAlternatives, rightAnswer };
}

function scientificNotationToFloat(coefficient: number, exponent: number) {
  let multiplier =
    exponent >= 0 ? Math.pow(10, exponent) : 1 / Math.pow(10, -exponent);
  let result = coefficient * multiplier;
  return parseFloat(result.toFixed(6));
}

function createScientificNotationQuestion() {
  let randomExponent = randomNumberSeeded(-6, 6);
  let randomCoefficient = randomNumberSeeded(1, 100);

  questions.push(randomCoefficient + ' x ' + readable['^'](10, randomExponent));

  let answer = scientificNotationToFloat(randomCoefficient, randomExponent);

  let rightAnswer = randomNumberSeeded(0, 3);
  let currentAlternatives = [];

  for (let i = 0; i < 4; i++) {
    let alternative = '';

    if (i === rightAnswer) {
      alternative = answer.toLocaleString('pt-BR', {
        minimumFractionDigits: Math.max(-randomExponent, 0)
      });
    } else {
      let randomAlternativeExponent = randomNumberSeeded(-6, 6);
      while (randomAlternativeExponent === randomExponent) {
        randomAlternativeExponent = randomNumberSeeded(-4, 4);
      }

      alternative = scientificNotationToFloat(
        randomCoefficient,
        randomAlternativeExponent
      ).toLocaleString('pt-BR', {
        minimumFractionDigits: Math.max(-randomAlternativeExponent, 0)
      });
    }

    currentAlternatives.push(alternative);
  }

  answers.push(answer);
  alternatives.push({ alternatives: currentAlternatives, rightAnswer });
}

type intervalI = {
  empty: boolean;
  start?: number;
  end?: number;
  openingClosed?: number;
  endingClosed?: number;
};

function formatInterval(interval: string | intervalI) {
  return typeof interval === 'string'
    ? interval
    : interval.empty
      ? '∅'
      : (interval.openingClosed === 1 ? '[' : ']') +
        (interval.start === -Infinity ? '-∞' : interval.start) +
        ', ' +
        (interval.end === Infinity ? '∞' : interval.end) +
        (interval.endingClosed === 1 ? ']' : '[');
}

function shuffle(array: any[]) {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex !== 0) {
    // Pick a remaining element.
    randomIndex = randomNumberSeeded(0, currentIndex);
    currentIndex--;

    // And swap it with the current element.
    const temp = array[currentIndex];
    array.splice(currentIndex, 1, array[randomIndex]);
    array.splice(randomIndex, 1, temp);
  }

  return array;
}

function createRandomInterval() {
  let start =
    randomNumberSeeded(0, 2) === 3 ? -Infinity : randomNumberSeeded(-1000, 500);
  let end =
    randomNumberSeeded(0, 3) === 3
      ? Infinity
      : randomNumberSeeded(start !== -Infinity ? start + 1 : -1000, 1000);
  return {
    empty: false,
    start: start,
    end: end,
    openingClosed: start !== -Infinity ? randomNumberSeeded(0, 1) : 0,
    endingClosed: end !== Infinity ? randomNumberSeeded(0, 1) : 0 // 1 = closed
  };
}

function clone(obj: any) {
  let newObj: any = obj instanceof Array ? [] : {};
  for (let prop in obj) {
    if (typeof obj[prop] === 'object') {
      newObj[prop] = clone(obj[prop]);
    } else {
      newObj[prop] = obj[prop];
    }
  }
  return newObj;
}

function solveUnion(
  intervals: intervalI[],
  smallestStarting: number,
  smallestEnding: number,
  question: string
) {
  if (
    intervals[smallestEnding].end! <
      intervals[(smallestEnding + 1) % 2].start! || // se o menor final de intervalo for menor que o maior início de intervalo do outro
    (intervals[smallestEnding].end ===
      intervals[(smallestEnding + 1) % 2].start &&
      (intervals[smallestEnding].endingClosed === 0 ||
        intervals[(smallestEnding + 1) % 2].openingClosed === 0))
  ) {
    return question;
  }

  function getClosed(startingOrEnding: number) {
    return intervals[(startingOrEnding + 1) % 2].end ===
      intervals[startingOrEnding].end
      ? intervals[
          intervals[(startingOrEnding + 1) % 2] >= intervals[startingOrEnding]
            ? (startingOrEnding + 1) % 2
            : startingOrEnding
        ]
      : intervals[startingOrEnding];
  }

  let openingClosed = getClosed(smallestStarting).openingClosed;
  let endingClosed = getClosed((smallestEnding + 1) % 2).endingClosed;

  return {
    empty: false,
    start: intervals[smallestStarting].start,
    end: intervals[(smallestEnding + 1) % 2].end,
    openingClosed: openingClosed,
    endingClosed: endingClosed
  };
}

function solveIntersection(
  intervals: intervalI[],
  smallestStarting: number,
  smallestEnding: number
) {
  if (
    (intervals[smallestEnding].end ===
      intervals[(smallestEnding + 1) % 2].start &&
      (intervals[smallestEnding].endingClosed === 0 ||
        intervals[(smallestEnding + 1) % 2].openingClosed === 0)) ||
    intervals[(smallestEnding + 1) % 2].start! > intervals[smallestEnding].end!
  ) {
    return { empty: true };
  } else {
    return {
      empty: false,
      start: intervals[(smallestStarting + 1) % 2].start,
      end:
        intervals[(smallestStarting + 1) % 2].end! <=
        intervals[smallestStarting].end!
          ? intervals[(smallestStarting + 1) % 2].end
          : intervals[smallestStarting].end,
      openingClosed: intervals[(smallestStarting + 1) % 2].openingClosed,
      endingClosed:
        intervals[(smallestStarting + 1) % 2].end! <=
        intervals[smallestStarting].end!
          ? intervals[(smallestStarting + 1) % 2].endingClosed
          : intervals[smallestStarting].endingClosed
    };
  }
}

function turnClosings(interval: intervalI, i: number) {
  interval.openingClosed! += (1 + Math.floor((i / 2) % 2)) % 2;
  interval.endingClosed! += (1 + (i % 2)) % 2;

  return interval;
}

function turnAnswerClosings(intervals: intervalI[], i: number) {
  let clonedIntervals = intervals.map(clone);
  clonedIntervals[i % 2] = turnClosings(
    clone(intervals[i % clonedIntervals.length]),
    (i % clonedIntervals.length) % 2
  );

  i++;

  return clonedIntervals.map(formatInterval).join(' ∪ ');
}

function createUnionAlternatives(
  currentAlternativesRaw: any[],
  intervals: intervalI[],
  smallestStarting: number,
  smallestEnding: number,
  answerString: string
) {
  let intersection = solveIntersection(
    intervals,
    smallestStarting,
    smallestEnding
  );

  let intervalsTurnedClosings = 0;
  let randomIntervalTurnedClosings = 0;

  function createAlternativeUnionWithEmptyInterval() {
    return randomNumberSeeded(0, 1) === 1
      ? turnAnswerClosings(
          [
            {
              empty: false,
              start: intervals[smallestStarting].start,
              end: intervals[(smallestEnding + 1) % 2].end,
              openingClosed: intervals[smallestStarting].endingClosed,
              endingClosed: intervals[(smallestEnding + 1) % 2].openingClosed
            }
          ],
          randomIntervalTurnedClosings
        )
      : turnAnswerClosings(intervals, intervalsTurnedClosings);
  }

  if (answerString.indexOf('∪') !== -1) {
    currentAlternativesRaw = currentAlternativesRaw.map(
      createAlternativeUnionWithEmptyInterval
    );
    currentAlternativesRaw.push(createAlternativeUnionWithEmptyInterval());
  } else {
    currentAlternativesRaw.push(intersection);
    for (let i = 0; i < 3; i++) {
      currentAlternativesRaw[i] = turnClosings(currentAlternativesRaw[i], i);
    }
  }

  return currentAlternativesRaw.map(formatInterval);
}

function createReunionAlternatives(
  currentAlternativesRaw: any[],
  intervals: intervalI[],
  smallestStarting: number,
  ending: number,
  firstOpeningClosed: number,
  secondEndingClosed: number
) {
  currentAlternativesRaw[0].openingClosed = (firstOpeningClosed + 1) % 2;
  currentAlternativesRaw[1].endingClosed = (secondEndingClosed + 1) % 2;

  currentAlternativesRaw[2].start = intervals[smallestStarting].start;
  currentAlternativesRaw[2].end = intervals[(ending + 1) % 2].end;

  currentAlternativesRaw[3].start = intervals[smallestStarting].end;
  currentAlternativesRaw[3].end = intervals[(ending + 1) % 2].end;

  for (let i = 0; i < 4; i++) {
    currentAlternativesRaw[i] = turnClosings(
      {
        empty: false,
        start: intervals[smallestStarting].start,
        end: intervals[(ending + 1) % 2].end,
        openingClosed: intervals[smallestStarting].openingClosed,
        endingClosed: intervals[(ending + 1) % 2].endingClosed
      },
      i
    );

    return currentAlternativesRaw.map(formatInterval);
  }
}
function createIntervalQuestion(): void {
  let intervals = [createRandomInterval(), createRandomInterval()];

  let typeofQuestion = randomNumberSeeded(0, 1);
  let rightAnswer = randomNumberSeeded(0, 3);

  let question = intervals
    .map(formatInterval)
    .join(' ' + (typeofQuestion === 0 ? '∪' : '∩') + ' ');

  questions.push(question);

  let answer: intervalI | string = { empty: false };
  if (
    (intervals[0].start === intervals[1].start &&
      (intervals[0].openingClosed !== intervals[1].openingClosed ||
        intervals[0].end === intervals[1].end)) ||
    (intervals[0].end === intervals[1].end &&
      intervals[0].endingClosed !== intervals[1].endingClosed)
  ) {
    // in case x, y === x, y or if they share a value and the closing of that value is different
    return createIntervalQuestion();
  }
  let smallestEnding = intervals[0].end < intervals[1].end ? 0 : 1;
  let smallestStarting = intervals[0].start < intervals[1].start ? 0 : 1;
  let largestEnding = intervals[0].end > intervals[1].end ? 0 : 1;

  answer =
    typeofQuestion === 0
      ? solveUnion(intervals, smallestStarting, smallestEnding, question)
      : solveIntersection(intervals, smallestStarting, smallestEnding);

  let answerString =
    typeof answer === 'string' ? answer : formatInterval(answer);

  let currentAlternatives = [];
  let desiredInterval: intervalI | string =
    typeofQuestion !== 0 &&
    (typeof answer === 'string' || (answer as any).empty)
      ? {
          ...intervals[smallestStarting],
          end: intervals[largestEnding].end,
          endingClosed: intervals[largestEnding].endingClosed
        }
      : answer;

  let currentAlternativesRaw = [
    clone(desiredInterval),
    clone(desiredInterval),
    clone(desiredInterval)
  ];

  if (typeofQuestion === 0) {
    currentAlternatives = createUnionAlternatives(
      currentAlternativesRaw,
      intervals,
      smallestStarting,
      smallestEnding,
      answerString
    );
  } else {
    currentAlternativesRaw.push(clone(desiredInterval));

    let firstOpeningClosed = intervals[smallestStarting].openingClosed;
    let secondEndingClosed = intervals[largestEnding].endingClosed;
    let ending = largestEnding;

    if (typeof answer !== 'string' && !answer.empty) {
      firstOpeningClosed = answer.openingClosed!;
      secondEndingClosed = answer.endingClosed!;
      ending = smallestEnding;
    }

    currentAlternatives = createReunionAlternatives(
      currentAlternativesRaw,
      intervals,
      smallestStarting,
      ending,
      firstOpeningClosed,
      secondEndingClosed
    )!;
  }

  currentAlternatives = shuffle(currentAlternatives);

  currentAlternatives.splice(rightAnswer, 1, answerString);

  answers.push(answerString);

  alternatives.push({
    alternatives: currentAlternatives,
    rightAnswer
  });
}

function createNonArithmetic(i: number) {
  let scientificNotation = randomNumberSeeded(0, 1);
  if (scientificNotation) {
    createScientificNotationQuestion();
    shouldChangeFontSize[i] = {
      buttonFontSize: 14
    };
  } else {
    createIntervalQuestion();
    shouldChangeFontSize[i] = {
      buttonFontSize: 14,
      fontSize: 16
    };
  }
}

function resetQuestions() {
  questions = [];
  answers = [];
  alternatives = [];
  answers = [];
  shouldChangeFontSize = [];

  for (let i = 0; i < 10; i++) {
    let nonArithmetic = randomNumberSeeded(0, 5);
    if (nonArithmetic === 5) {
      createNonArithmetic(i);
      continue;
    }
    let operation = randomOperation(Object.keys(operations).length - 1);
    let numbers = [
      randomNumberSeeded(1, operation === '^' ? 50 : 100),
      randomNumberSeeded(1, operation === '^' ? 4 : 100)
    ];

    // if (operation === "÷") {
    //   let randomDivisor = generateDivisor();
    //   questions[currentQuestion][1] = questions[currentQuestion][0] / randomDivisor;
    // }

    let question = !!readable[operation]
      ? readable[operation](numbers[0], numbers[1])
      : numbers.join(' ' + operation + ' ');

    questions.push(question);
    answers.push(operations[operation](numbers[0], numbers[1]));
    alternatives.push(createAlternatives(i));
  }
  //   currentQuestion = 0;
}

export const createQuestions = (userSeed: string) => {
  seed = userSeed;
  let seeds: [number, number, number, number] = cyrb128(userSeed) as any;
  random = sfc32(...seeds);
  resetQuestions();
  return { seed, seeds, random, alternatives, questions, answers };
};
