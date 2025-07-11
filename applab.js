// VERSION 1.0
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
    var rightAnswer = randomNumberSeeded(0, 3);
    var currentAlternatives = [];
    for (var i = 0; i < 4; i++) {
        var alternative = '';
        if (i === rightAnswer) {
            alternative = answers[questionNumber];
        } else {
            alternative = Math.ceil(
                operations[
                    randomOperation(
                        !!answers[questionNumber]
                            ? 1
                            : answers[questionNumber] === 0
                              ? 1
                              : 2
                    )
                ](answers[questionNumber], randomNumberSeeded(2, 6))
            );
            if (
                currentAlternatives.indexOf(alternative) >= 0 ||
                alternative === answers[alternative]
            ) {
                i--;
                continue;
            }
        }
        currentAlternatives.push(alternative);
    }
    return {
        alternatives: currentAlternatives,
        rightAnswer: rightAnswer
    };
}
function scientificNotationToFloat(coefficient, exponent) {
    var multiplier =
        exponent >= 0 ? Math.pow(10, exponent) : 1 / Math.pow(10, -exponent);
    var result = coefficient * multiplier;
    return parseFloat(result.toFixed(6));
}
function createScientificNotationQuestion() {
    var randomExponent = randomNumberSeeded(-6, 6);
    var randomCoefficient = randomNumberSeeded(1, 9);
    questions.push(
        randomCoefficient + ' x ' + readable['^'](10, randomExponent)
    );
    var answer = scientificNotationToFloat(
        randomCoefficient,
        randomExponent
    ).toLocaleString('pt-BR', {
        minimumFractionDigits: Math.max(-randomExponent, 0)
    });
    var rightAnswer = randomNumberSeeded(0, 3);
    var currentAlternatives = [];
    var addedExponents = [randomExponent];
    for (var i = 0; i < 4; i++) {
        if (i === rightAnswer) {
            currentAlternatives.push(answer);
            continue;
        }
        var randomAlternativeExponent = randomNumberSeeded(-6, 6);
        if (addedExponents.indexOf(randomAlternativeExponent) >= 0) {
            i--;
            continue;
        }
        currentAlternatives.push(
            scientificNotationToFloat(
                randomCoefficient,
                randomAlternativeExponent
            ).toLocaleString('pt-BR', {
                minimumFractionDigits: Math.max(-randomAlternativeExponent, 0)
            })
        );
        addedExponents.push(randomAlternativeExponent);
    }
    answers.push(answer);
    alternatives.push({
        alternatives: currentAlternatives,
        rightAnswer: rightAnswer
    });
}
function formatIntervals() {
    var results = [];
    for (var i = 0; i < arguments.length; i++) {
        var interval =
            i < 0 || arguments.length <= i ? undefined : arguments[i];
        results.push(
            typeof interval === 'string'
                ? interval
                : interval.empty
                  ? '∅'
                  : (interval.openingClosed === 1 ? '[' : ']') +
                    (interval.start === -Infinity
                        ? '-∞'
                        : interval.start === Infinity
                          ? '+∞'
                          : interval.start) +
                    ', ' +
                    (interval.end === Infinity
                        ? '∞'
                        : interval.end === -Infinity
                          ? '-∞'
                          : interval.end) +
                    (interval.endingClosed === 1 ? ']' : '[')
        );
    }
    return results.join(' ∪ ');
}
function shuffle(array) {
    var currentIndex = array.length,
        randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex !== 0) {
        // Pick a remaining element.
        randomIndex = randomNumberSeeded(0, currentIndex - 1);
        currentIndex--;

        // And swap it with the current element.
        var temp = array[currentIndex];
        array.splice(currentIndex, 1, array[randomIndex]);
        array.splice(randomIndex, 1, temp);
    }
    return array;
}
function createRandomInterval() {
    var start =
        randomNumberSeeded(0, 2) === 3
            ? -Infinity
            : randomNumberSeeded(-1000, 500);
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
    if (Array.isArray(obj)) {
        // Recursively clone each element in the array
        return obj.map(clone);
    } else if (typeof obj === 'object' && obj !== null) {
        var result = {};
        for (var prop in obj) {
            result[prop] = clone(obj[prop]);
        }
        return result;
    }
    return obj;
}
function solveUnion(intervals, smallestStarting, smallestEnding) {
    if (
        intervals[smallestEnding].end <
            intervals[(smallestEnding + 1) % 2].start ||
        // se o menor final de intervalo for menor que o maior início de intervalo do outro
        (intervals[smallestEnding].end ===
            intervals[(smallestEnding + 1) % 2].start &&
            (intervals[smallestEnding].endingClosed === 0 ||
                intervals[(smallestEnding + 1) % 2].openingClosed === 0))
    ) {
        // Sort intervals by their start value (smallestStarting first)
        return clone(intervals).sort(function (a, b) {
            return a.start - b.start;
        });
    }

    // function getClosed(startingOrEnding: number, isOpening: boolean) {
    //     const closingProp = isOpening ? 'openingClosed' : 'endingClosed';
    //     return intervals[(startingOrEnding + 1) % 2].end ===
    //         intervals[startingOrEnding].end
    //         ? intervals[
    //               (
    //                   isOpening
    //                       ? intervals[(startingOrEnding + 1) % 2][
    //                             closingProp
    //                         ]! <= intervals[startingOrEnding][closingProp]!
    //                       : intervals[(startingOrEnding + 1) % 2][
    //                             closingProp
    //                         ]! >= intervals[startingOrEnding][closingProp]!
    //               )
    //                   ? (startingOrEnding + 1) % 2
    //                   : startingOrEnding
    //           ]
    //         : intervals[startingOrEnding];
    // }
    var openingClosed = intervals[smallestStarting].openingClosed;
    var endingClosed = intervals[(smallestEnding + 1) % 2].endingClosed;
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
        intervals[(smallestEnding + 1) % 2].start >
            intervals[smallestEnding].end
    ) {
        return {
            empty: true
        };
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
/**
 * openingClosed: [1, 1, 0, 0] (changes every 2 iterations);
 * endingClosed: [1, 0, 1, 0] (alternates every iteration
 */
function turnClosings(interval, i) {
    interval.openingClosed += (1 + Math.floor((i / 2) % 2)) % 2;
    interval.endingClosed += (1 + (i % 2)) % 2;
    return interval;
}
function handleFakeUnionAlternative(fakeUnionAlternativesRaw, x) {
    var result = [];
    for (var i = 0; i < fakeUnionAlternativesRaw[x].length; i++) {
        var randomAlternative = fakeUnionAlternativesRaw[x][i];
        result.push(
            clone(
                clone({}, randomAlternative),
                {},
                {
                    openingClosed:
                        randomAlternative.openingClosed ^ (i + (x % 2)) % 2,
                    endingClosed:
                        randomAlternative.endingClosed ^
                        (i + (x >= 2 ? 1 : 0)) % 2
                }
            )
        );
    }
    return result;
}
function handleUnionWithEmptyIntersection(currentAlternativesRaw) {
    var fakeUnionAlternativesRaw = clone(currentAlternativesRaw);
    var shuffledAlternativesRaw = shuffle(
        currentAlternativesRaw.map(function (currentAlternative, i) {
            return {
                start: currentAlternative[0][i % 2 === 0 ? 'start' : 'end'],
                openingClosed:
                    currentAlternative[0][
                        i % 2 === 0 ? 'openingClosed' : 'endingClosed'
                    ],
                end: currentAlternative[1][i % 2 === 0 ? 'end' : 'start'],
                endingClosed:
                    currentAlternative[1][
                        i % 2 === 0 ? 'endingClosed' : 'openingClosed'
                    ]
            };
        })
    );
    for (var i = 0; i < 3; i++) {
        shuffledAlternativesRaw.splice(
            i,
            1,
            turnClosings(
                clone(
                    clone({}, shuffledAlternativesRaw[i]),
                    {},
                    {
                        openingClosed:
                            shuffledAlternativesRaw[i].openingClosed +
                            ((i % 2 === 0 ? 1 : 0) % 2),
                        endingClosed:
                            shuffledAlternativesRaw[i].endingClosed +
                            ((i > 1 ? 1 : 0) % 2)
                    }
                ),
                i
            )
        );
    }
    for (var x = 0; x < 4; x++) {
        fakeUnionAlternativesRaw.splice(
            x,
            1,
            handleFakeUnionAlternative(fakeUnionAlternativesRaw, x)
        );
    }
    var shuffledFakeUnionAlternativesRaw = shuffle(
        clone(fakeUnionAlternativesRaw)
    );
    var currentAlternatives = shuffledAlternativesRaw.map(function (interval) {
        return formatIntervals(interval);
    });
    currentAlternatives.splice.apply(
        this,
        shuffledFakeUnionAlternativesRaw
            .map(function (intervals) {
                return formatIntervals.apply(this, intervals);
            })
            .slice(0, 2)
    );
    return currentAlternatives;
}
function createUnionAlternatives(
    currentAlternativesRaw,
    intervals,
    smallestStarting,
    smallestEnding
) {
    if (
        Array.isArray(currentAlternativesRaw) &&
        Array.isArray(currentAlternativesRaw[0])
    )
        return handleUnionWithEmptyIntersection(currentAlternativesRaw);

    // intersection cannot be empty because union is two intervals(array of intervals), eg. [1, 2] ∪ [3, 4] intersecion -> empty

    var intersection = solveIntersection(
        intervals,
        smallestStarting,
        smallestEnding
    );
    var random1 = randomNumberSeeded(0, 2);

    // let random2 = randomNumberSeeded(0, 3);
    currentAlternativesRaw.splice(random1, 1, clone(intersection));
    currentAlternativesRaw.splice(3, 1, clone(intersection));
    var currentAlternatives = [];

    // Flip the closings of the currentAlternativesRaw intervals, similar to reunion and handleUnionWithEmptyIntersection logic
    for (var i = 0; i < currentAlternativesRaw.length - 1; i++) {
        var currentAlternativeRaw = currentAlternativesRaw[i];
        currentAlternatives.push(
            i === random1
                ? formatIntervals(turnClosings(currentAlternativeRaw, i))
                : formatIntervals(
                      turnClosings(
                          {
                              empty: false,
                              start: intervals[smallestStarting].start,
                              end: intervals[(smallestEnding + 1) % 2].end,
                              openingClosed:
                                  intervals[smallestStarting].openingClosed,
                              endingClosed:
                                  intervals[(smallestEnding + 1) % 2]
                                      .endingClosed
                          },
                          i
                      )
                  )
        );
    }
    return [].concat(currentAlternatives, [
        formatIntervals(currentAlternativesRaw[3])
    ]);
}
function createReunionAlternatives(
    currentAlternativesRaw,
    intervals,
    smallestStarting,
    ending,
    firstOpeningClosed,
    secondEndingClosed
) {
    currentAlternativesRaw[0].openingClosed = (firstOpeningClosed + 1) % 2;
    currentAlternativesRaw[1].endingClosed = (secondEndingClosed + 1) % 2;
    currentAlternativesRaw[2].start = intervals[smallestStarting].start;
    currentAlternativesRaw[2].end = intervals[(ending + 1) % 2].end;
    currentAlternativesRaw[3].start = intervals[smallestStarting].end;
    currentAlternativesRaw[3].end = intervals[(ending + 1) % 2].end;
    for (var i = 0; i < 4; i++) {
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
    }
    return currentAlternativesRaw.map(function (interval) {
        return formatIntervals(interval);
    });
}
function createIntervalQuestion() {
    var intervals = [createRandomInterval(), createRandomInterval()];
    var typeofQuestion = randomNumberSeeded(0, 1);
    var rightAnswer = randomNumberSeeded(0, 3);
    var question =
        intervals
            .map(function (interval) {
                return formatIntervals(interval);
            })
            .join(' ' + (typeofQuestion === 0 ? '∪' : '∩') + ' ') + ' =';
    questions.push(question);
    var answer = {
        empty: false
    };
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
    var largestEnding = intervals[0].end > intervals[1].end ? 0 : 1;
    answer =
        typeofQuestion === 0
            ? solveUnion(intervals, smallestStarting, smallestEnding)
            : solveIntersection(intervals, smallestStarting, smallestEnding);
    var answerString = Array.isArray(answer)
        ? formatIntervals.apply(this, answer)
        : formatIntervals(answer);
    var currentAlternatives = [];
    var desiredInterval =
        typeofQuestion !== 0 && !Array.isArray(answer) && answer.empty
            ? clone(
                  clone({}, intervals[smallestStarting]),
                  {},
                  {
                      end: intervals[largestEnding].end,
                      endingClosed: intervals[largestEnding].endingClosed
                  }
              )
            : answer;
    var currentAlternativesRaw = [
        clone(desiredInterval),
        clone(desiredInterval),
        clone(desiredInterval),
        clone(desiredInterval)
    ];
    if (typeofQuestion === 0) {
        currentAlternatives = createUnionAlternatives(
            currentAlternativesRaw,
            intervals,
            smallestStarting,
            smallestEnding
        );
    } else {
        var firstOpeningClosed = intervals[smallestStarting].openingClosed;
        var secondEndingClosed = intervals[largestEnding].endingClosed;
        var ending = largestEnding;
        if (!Array.isArray(answer) && !answer.empty) {
            firstOpeningClosed = answer.openingClosed;
            secondEndingClosed = answer.endingClosed;
            ending = smallestEnding;
        }
        currentAlternatives = createReunionAlternatives(
            currentAlternativesRaw,
            intervals,
            smallestStarting,
            ending,
            firstOpeningClosed,
            secondEndingClosed
        );
    }
    currentAlternatives = shuffle(currentAlternatives);
    currentAlternatives.splice(rightAnswer, 1, answerString);
    answers.push(answerString);
    alternatives.push({
        alternatives: currentAlternatives,
        rightAnswer: rightAnswer
    });
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
    for (
        var i = 0;
        i < alternatives[currentQuestion].alternatives.length;
        i++
    ) {
        if (!!shouldChange && shouldChange.buttonFontSize) {
            setProperty(
                'button' + (i + 1),
                'font-size',
                shouldChange.buttonFontSize
            );
        } else if (
            !!shouldChangeFontSize[currentQuestion - 1] &&
            shouldChangeFontSize[currentQuestion - 1].buttonFontSize
        ) {
            setProperty('button' + (i + 1), 'font-size', 18);
        }
        setText(
            'button' + (i + 1),
            alternatives[currentQuestion].alternatives[i]
        );
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
    if (i === alternatives[currentQuestion].rightAnswer) {
        eachQuestionTime.push(Date.now());
        var nice =
            answers[currentQuestion] === 69 ||
            answers[currentQuestion] === '69';
        if (nice) playSound('nice.mp3');
        if (currentQuestion === questions.length - 1) {
            setScreen('won');
            setText('seedUsed', 'Seed: "' + seed + '"');
            finalTime =
                eachQuestionTime[eachQuestionTime.length - 1] - quizStarted;
            var seconds = Math.floor(finalTime / 1000);
            var minutes = Math.floor(seconds / 60);
            setText(
                'timeTook',
                'Tempo: ' +
                    ((minutes > 0
                        ? minutes + ' minuto' + (minutes > 1 ? 's' : '') + ' e '
                        : '') +
                        (seconds % 60 > 0
                            ? (seconds % 60) +
                              ' segundo' +
                              (seconds % 60 > 1 ? 's' : '')
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
                k === alternatives[currentQuestion].rightAnswer
                    ? 'green'
                    : 'red'
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
