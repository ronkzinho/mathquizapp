var questions = [];
var answers = [];
var currentQuestion = 0;
var timer = 0;
var quizStarted = null;
var interval = null;
var alternatives = [];
var shouldChangeFontSize = [];
var setSeed = false;
var seed = null;
var random = null;
var finalTime = null;
var eachQuestionTime = [];

function imul(a, b) {
  var ah = (a >>> 16) & 0xffff;
  var al = a & 0xffff;
  var bh = (b >>> 16) & 0xffff;
  var bl = b & 0xffff;
  // the shift by 0 fixes the sign on the high part
  // the final |0 converts the unsigned value into a signed value
  return (al * bl + (((ah * bl + al * bh) << 16) >>> 0)) | 0;
}

function cyrb128(str) {
  var h1 = 1779033703,
    h2 = 3144134277,
    h3 = 1013904242,
    h4 = 2773480762;
  for (var i = 0, k; i < str.length; i++) {
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

function sfc32(a, b, c, d) {
  return function () {
    a >>>= 0;
    b >>>= 0;
    c >>>= 0;
    d >>>= 0;
    var t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

function randomNumberSeeded(min, max) {
  return Math.floor(random() * (max - min + 1) + min);
}

function writeTimer() {
  var minutes = Math.floor(timer / 60);
  var seconds = timer % 60;

  if (timer === 60 * 60) {
    setScreen('home');
    timer = 0;
    clearInterval(interval);
    if (!setSeed) {
      seed = null;
    }
  }

  setText(
    'timer',
    (minutes < 10 ? '0' + minutes : minutes) +
      ':' +
      (seconds < 10 ? '0' + seconds : seconds)
  );
}

function createTimerInterval() {
  timer++;
  writeTimer();
}

var operations = {
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

var readable = {
  '^': function (a, b) {
    var result = '';
    var superscriptMap = {
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

    for (var i = 0; i < b.toString().length; i++) {
      result += superscriptMap[b.toString()[i]];
    }

    return a + result + ' =';
  }
};

function updateQuestionNumber() {
  setText('questionNumber', 'Questão número: ' + (currentQuestion + 1));
}

function randomOperation(max) {
  return Object.keys(operations)[randomNumberSeeded(0, max)];
  // return "÷";
}

function createAlternatives(questionNumber) {
  var right = randomNumberSeeded(0, 3);
  var currentAlternatives = [];
  for (var i = 0; i < 4; i++) {
    var alternative = '';

    if (i === right) {
      alternative = answers[questionNumber];
    } else {
      alternative = Math.ceil(
        operations[randomOperation(answers[questionNumber] === 0 ? 1 : 2)](
          answers[questionNumber],
          randomNumberSeeded(2, 6)
        )
      );
    }

    currentAlternatives.push(alternative);
  }

  return { alternatives: currentAlternatives, right: right };
}

function scientificNotationToFloat(coefficient, exponent) {
  var multiplier =
    exponent >= 0 ? Math.pow(10, exponent) : 1 / Math.pow(10, -exponent);
  var result = coefficient * multiplier;
  return parseFloat(result.toFixed(6));
}

function createScientificNotationQuestion() {
  var randomExponent = randomNumberSeeded(-6, 6);
  var randomCoefficient = randomNumberSeeded(1, 100);

  questions.push(randomCoefficient + ' x ' + readable['^'](10, randomExponent));

  var answer = scientificNotationToFloat(randomCoefficient, randomExponent);

  var right = randomNumberSeeded(0, 3);
  var currentAlternatives = [];

  for (var i = 0; i < 4; i++) {
    var alternative = '';

    if (i === right) {
      alternative = answer.toLocaleString('pt-BR', {
        minimumFractionDigits: Math.max(-randomExponent, 0)
      });
    } else {
      var randomAlternativeExponent = randomNumberSeeded(-6, 6);
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
  alternatives.push({ alternatives: currentAlternatives, right: right });
}

function formatInterval(interval) {
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

function shuffle(array) {
  var currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex !== 0) {
    // Pick a remaining element.
    randomIndex = randomNumberSeeded(0, currentIndex);
    currentIndex--;

    // And swap it with the current element.
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = array[currentIndex];
  }

  return array;
}

function createRandomInterval() {
  var start =
    randomNumberSeeded(0, 2) === 3 ? -Infinity : randomNumberSeeded(-1000, 500);
  var end =
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

function clone(obj) {
  var newObj = obj instanceof Array ? [] : {};
  for (var prop in obj) {
    if (typeof obj[prop] === 'object') {
      newObj[prop] = clone(obj[prop]);
    } else {
      newObj[prop] = obj[prop];
    }
  }
  return newObj;
}

function solveUnion(intervals, smallestStarting, smallestEnding, question) {
  if (
    intervals[smallestEnding].end < intervals[(smallestEnding + 1) % 2].start || // se o menor final de intervalo for menor que o maior início de intervalo do outro
    (intervals[smallestEnding].end ===
      intervals[(smallestEnding + 1) % 2].start &&
      (intervals[smallestEnding].endingClosed === 0 ||
        intervals[(smallestEnding + 1) % 2].openingClosed === 0))
  ) {
    return question;
  }

  function getClosed(startingOrEnding) {
    return intervals[(startingOrEnding + 1) % 2].end ===
      intervals[startingOrEnding].end
      ? intervals[
          intervals[(startingOrEnding + 1) % 2] >= intervals[startingOrEnding]
            ? (startingOrEnding + 1) % 2
            : startingOrEnding
        ]
      : intervals[startingOrEnding];
  }

  var openingClosed = getClosed(smallestStarting).openingClosed;
  var endingClosed = getClosed((smallestEnding + 1) % 2).endingClosed;

  return {
    empty: false,
    start: intervals[smallestStarting].start,
    end: intervals[(smallestEnding + 1) % 2].end,
    openingClosed: openingClosed,
    endingClosed: endingClosed
  };
}

function solveIntersection(intervals, smallestStarting, smallestEnding) {
  if (
    (intervals[smallestEnding].end ===
      intervals[(smallestEnding + 1) % 2].start &&
      (intervals[smallestEnding].endingClosed === 0 ||
        intervals[(smallestEnding + 1) % 2].openingClosed === 0)) ||
    intervals[(smallestEnding + 1) % 2].start > intervals[smallestEnding].end
  ) {
    return { empty: true };
  } else {
    return {
      empty: false,
      start: intervals[(smallestStarting + 1) % 2].start,
      end:
        intervals[(smallestStarting + 1) % 2].end <=
        intervals[smallestStarting].end
          ? intervals[(smallestStarting + 1) % 2].end
          : intervals[smallestStarting].end,
      openingClosed: intervals[(smallestStarting + 1) % 2].openingClosed,
      endingClosed:
        intervals[(smallestStarting + 1) % 2].end <=
        intervals[smallestStarting].end
          ? intervals[(smallestStarting + 1) % 2].endingClosed
          : intervals[smallestStarting].endingClosed
    };
  }
}

function turnClosings(interval, i) {
  interval.openingClosed += (1 + Math.floor((i / 2) % 2)) % 2;
  interval.endingClosed += (1 + (i % 2)) % 2;

  return interval;
}

function turnAnswerClosings(intervals, i) {
  var clonedIntervals = intervals.map(clone);
  clonedIntervals[i % 2] = turnClosings(
    clone(intervals[i % clonedIntervals.length]),
    (i % clonedIntervals.length) % 2
  );

  i++;

  return clonedIntervals.map(formatInterval).join(' ∪ ');
}

function createUnionAlternatives(
  currentAlternativesRaw,
  intervals,
  smallestStarting,
  smallestEnding,
  answerString
) {
  var intersection = solveIntersection(
    intervals,
    smallestStarting,
    smallestEnding
  );

  var intervalsTurnedClosings = 0;
  var randomIntervalTurnedClosings = 0;

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
    for (var i = 0; i < 3; i++) {
      currentAlternativesRaw[i] = turnClosings(currentAlternativesRaw[i], i);
    }
  }

  return currentAlternativesRaw.map(formatInterval);
}

function createIntervalQuestion() {
  var intervals = [createRandomInterval(), createRandomInterval()];

  var typeofQuestion = randomNumberSeeded(0, 1);
  var right = randomNumberSeeded(0, 3);

  var question = intervals
    .map(formatInterval)
    .join(' ' + (typeofQuestion === 0 ? '∪' : '∩') + ' ');

  questions.push(question);

  var answer = { empty: false };
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
  var smallestEnding = intervals[0].end < intervals[1].end ? 0 : 1;
  var smallestStarting = intervals[0].start < intervals[1].start ? 0 : 1;

  answer =
    typeofQuestion === 0
      ? solveUnion(intervals, smallestStarting, smallestEnding, question)
      : solveIntersection(intervals, smallestStarting, smallestEnding);

  var answerString =
    typeof answer === 'string' ? answer : formatInterval(answer);

  var currentAlternatives = [];
  var currentAlternativesRaw = [clone(answer), clone(answer), clone(answer)];

  if (typeofQuestion === 0) {
    currentAlternatives = createUnionAlternatives(
      currentAlternativesRaw,
      intervals,
      smallestStarting,
      smallestEnding,
      answerString
    );
  } else {
    currentAlternativesRaw.push(clone(answer));

    if (!answer.empty) {
      currentAlternativesRaw[0].openingClosed = (answer.openingClosed + 1) % 2;
      currentAlternativesRaw[1].endingClosed = (answer.endingClosed + 1) % 2;

      currentAlternativesRaw[2].start = intervals[smallestStarting].start;
      currentAlternativesRaw[2].end = intervals[(smallestEnding + 1) % 2].end;

      currentAlternativesRaw[3].start = intervals[smallestStarting].end;
      currentAlternativesRaw[3].end = intervals[(smallestEnding + 1) % 2].end;

      for (var i = 0; i < 4; i++) {
        if (!answer.empty) {
          var alternative = currentAlternativesRaw[i];
          currentAlternatives.push(formatInterval(alternative));
        } else {
          currentAlternatives.push(
            formatInterval(
              turnClosings(
                {
                  empty: false,
                  start: intervals[smallestStarting].start,
                  end: intervals[(smallestEnding + 1) % 2].end,
                  openingClosed: intervals[smallestStarting].openingClosed,
                  endingClosed: intervals[(smallestEnding + 1) % 2].endingClosed
                },
                i
              )
            )
          );
        }
      }
    }
  }

  currentAlternatives = shuffle(currentAlternatives);

  if (typeof answer === 'string' || !answer.empty) {
    if (randomNumberSeeded(0, 2) === 1) {
      currentAlternatives[randomNumberSeeded(0, 2)] = formatInterval({
        empty: true
      });
    }
  }

  currentAlternatives[right] = answerString;
  answers.push(answerString);
  alternatives.push({ alternatives: currentAlternatives, right: right });
}

function createNonArithmetic(i) {
  var scientificNotation = randomNumberSeeded(0, 1);
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

  for (var i = 0; i < 10; i++) {
    var nonArithmetic = randomNumberSeeded(0, 5);
    if (nonArithmetic === 5) {
      createNonArithmetic(i);
      continue;
    }
    var operation = randomOperation(Object.keys(operations).length - 1);
    var numbers = [
      randomNumberSeeded(1, operation === '^' ? 50 : 100),
      randomNumberSeeded(1, operation === '^' ? 4 : 100)
    ];

    // if (operation === "÷") {
    //   var randomDivisor = generateDivisor();
    //   questions[currentQuestion][1] = questions[currentQuestion][0] / randomDivisor;
    // }

    var question = !!readable[operation]
      ? readable[operation](numbers[0], numbers[1])
      : numbers.join(' ' + operation + ' ') + ' =';

    questions.push(question);
    answers.push(operations[operation](numbers[0], numbers[1]));
    alternatives.push(createAlternatives(i));
  }
  currentQuestion = 0;
}

function createQuestion() {
  var shouldChange = shouldChangeFontSize[currentQuestion];
  if (!!shouldChange && shouldChange.fontSize) {
    setProperty('question', 'font-size', shouldChange.fontSize);
  } else if (!!shouldChangeFontSize[currentQuestion - 1]) {
    setProperty('question', 'font-size', 28);
  }
  setText('question', questions[currentQuestion]);
  for (var i = 0; i < alternatives[currentQuestion].alternatives.length; i++) {
    if (!!shouldChange && shouldChange.buttonFontSize) {
      setProperty('button' + (i + 1), 'font-size', shouldChange.buttonFontSize);
    } else if (
      !!shouldChangeFontSize[currentQuestion - 1] &&
      shouldChangeFontSize[currentQuestion - 1].buttonFontSize
    ) {
      setProperty('button' + (i + 1), 'font-size', 18);
    }
    setText('button' + (i + 1), alternatives[currentQuestion].alternatives[i]);
  }
}

function reset() {
  clearInterval(interval);
  timer = 0;
  writeTimer();
  if (!setSeed) {
    seed = null;
  }
  quizStarted = null;
  alternatives = [];
  answers = [];
  questions = [];
  currentQuestion = 0;
  shouldChangeFontSize = [];
  finalTime = null;
  eachQuestionTime = [];
  setProperty('question', 'font-size', 28);
  for (var i = 0; i < 4; i++) {
    setProperty('button' + (i + 1), 'font-size', 18);
  }
}

onEvent('questionsAnchor', 'click', function () {
  if (seed === null) {
    seed = randomNumber(-99999999999999, 99999999999999).toString();
    setSeed = false;
  } else {
    setSeed = true;
  }
  var cyrb128seed = cyrb128(seed);
  random = sfc32(
    cyrb128seed[0],
    cyrb128seed[1],
    cyrb128seed[2],
    cyrb128seed[3]
  );
  setText('seedType', setSeed ? 'Seed setada' : 'Seed aleatória');
  setScreen('loading');
  resetQuestions();
  createQuestion();
  updateQuestionNumber();
  quizStarted = Date.now();
  timer = 0;
  writeTimer();
  interval = setInterval(createTimerInterval, 1000);
  setScreen('questions');
});

function checkAnswer(i) {
  if (i === alternatives[currentQuestion].right) {
    eachQuestionTime.push(Date.now());
    var nice =
      answers[currentQuestion] === 69 || answers[currentQuestion] === '69';
    if (nice) playSound('nice.mp3');
    if (currentQuestion === questions.length - 1) {
      setScreen('won');
      setText('seedUsed', 'Seed: "' + seed + '"');
      finalTime = eachQuestionTime[eachQuestionTime.length - 1] - quizStarted;
      var seconds = Math.floor(finalTime / 1000);
      var minutes = Math.floor(seconds / 60);
      setText(
        'timeTook',
        'Tempo: ' +
          ((minutes > 0
            ? minutes + ' minuto' + (minutes > 1 ? 's' : '') + ' e '
            : '') +
            (seconds % 60 > 0
              ? (seconds % 60) + ' segundo' + (seconds % 60 > 1 ? 's' : '')
              : ''))
      );
    } else {
      currentQuestion++;
      createQuestion();
      updateQuestionNumber();
      if (!nice) playSound('right.mp3');
    }
  } else {
    playSound(randomNumber(0, 9) === 9 ? 'bruh.mp3' : 'woof.mp3');
    for (var k = 0; k < 4; k++) {
      setProperty(
        'button' + (k + 1),
        'background-color',
        k === alternatives[currentQuestion].right ? 'green' : 'red'
      );
      setStyle('button' + (k + 1), 'pointer-events: none');
      showElement('gameOver');
    }
    setTimeout(function () {
      for (var k = 0; k < 4; k++) {
        setProperty('button' + (k + 1), 'background-color', '#8200FF');
        setStyle('button' + (k + 1), 'pointer-events: auto');
        hideElement('gameOver');
      }
      if (!setSeed) {
        seed = null;
      }
      setScreen('home');
      reset();
    }, 1000);
  }
}

for (var i = 0; i < 4; i++) {
  onEvent('button' + (i + 1), 'click', checkAnswer.bind(this, i));
}

onEvent('seedInput', 'change', function () {
  var text = getText('seedInput').trim();

  if (text.length > 15) {
    setText('seedInput', text.substring(0, 15));
    return;
  }

  if (!!text.trim() && text.trim().length > 0) {
    seed = text.trim();
  } else {
    seed = null;
  }
});

onEvent('cancelQuiz', 'click', function () {
  reset();
  setScreen('home');
});

onEvent('configHomeAnchor', 'click', function () {
  setScreen('home');
});

onEvent('homeAnchor', 'click', function () {
  setScreen('home');
  reset();
});

onEvent('settingsAnchorFromHome', 'click', function () {
  setScreen('settings');
});

onEvent('moreStatistics', 'click', function () {
  open(
    'https://mathquizapp.vercel.app/?seed=' +
      seed +
      '&time=' +
      finalTime +
      '&quizStarted=' +
      quizStarted +
      '&setSeed=' +
      setSeed +
      '&eachQuestionTime=' +
      encodeURIComponent(eachQuestionTime.join(','))
  );
});
