// CONSTANTS
const CORRECT_BONUS = 10;
const DIFFICULTY_MULTIPLIERS = {
    easy: 1.0,
    medium: 1.5,
    hard: 2.0
};

const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

// DOM ELEMENTS
const choicesContainer = document.getElementById('choicesContainer');
const question = document.getElementById('question');
const progressText = document.getElementById('progressText');
const scoreText = document.getElementById('score');
const streakText = document.getElementById('streak');
const streakHud = document.getElementById('streakHud');
const progressBarFull = document.getElementById('progressBarFull');
const loader = document.getElementById('loader');
const game = document.getElementById('game');

// GAME VARIABLES
let currentQuestion = {};
let acceptingAnswers = false;
let score = 0;
let correctStreak = -1;
let questionCounter = 0;
let availableQuestions = [];
let questions = [];

const renderChoices = (choicesArray) => {
  choicesContainer.innerHTML = ''; // Clear previous choices

  choicesArray.forEach((choiceText, index) => {
    const choiceContainer = document.createElement('div');
    choiceContainer.classList.add('choice-container');

    const prefix = document.createElement('p');
    prefix.classList.add('choice-prefix');
    prefix.textContent = letters[index] || '?';

    const choice = document.createElement('p');
    choice.classList.add('choice-text');
    choice.setAttribute('data-number', index + 1);
    choice.textContent = choiceText;

    // Add event listener here
    choicesContainer.addEventListener('click', (e) => {
        const selectedChoice = e.target.closest('.choice-text');
        if (!selectedChoice || !acceptingAnswers) return;

        acceptingAnswers = false;

        const selectedAnswer = selectedChoice.innerText;
        const correctAnswerIndex = currentQuestion.answer - 1;

        const currentChoices = Array.from(document.getElementsByClassName('choice-text'));
        const correctChoice = currentChoices[correctAnswerIndex];

        const classToApply = selectedAnswer === currentQuestion.choices[correctAnswerIndex]
            ? 'correct'
            : 'incorrect';

        if (classToApply === 'correct') {
            incrementScore(CORRECT_BONUS, currentQuestion.difficulty); // Use per-question difficulty
        }

        selectedChoice.parentElement.classList.add(classToApply);

        if (classToApply === 'incorrect' && correctChoice) {
            correctChoice.parentElement.classList.add('correct-answer');
            if (correctStreak !== -1) {
                correctStreak = 0; // Reset streak on incorrect answer
            }
        }

        streakText.innerText = `${correctStreak}`; // Update streak display

        setTimeout(() => {
            selectedChoice.parentElement.classList.remove(classToApply);
            if (correctChoice) {
                correctChoice.parentElement.classList.remove('correct-answer');
            }
            getNewQuestion();
        }, 1000);
    });
    choiceContainer.appendChild(prefix);
    choiceContainer.appendChild(choice);
    choicesContainer.appendChild(choiceContainer);
  });
};

const getNewQuestion = () => {
    if (availableQuestions.length === 0) {
        localStorage.setItem('mostRecentScore', score);
        return window.location.assign('./end.html');
    }

    questionCounter++;
    const totalQuestions = triviaAmount;
    progressText.innerText = `Question ${questionCounter} of ${totalQuestions}`;
    progressBarFull.style.width = `${(questionCounter / totalQuestions) * 100}%`;

    const questionIndex = Math.floor(Math.random() * availableQuestions.length);
    currentQuestion = availableQuestions[questionIndex];
    question.innerText = currentQuestion.question;

    renderChoices(currentQuestion.choices);

    availableQuestions.splice(questionIndex, 1);
    acceptingAnswers = true;
};

const incrementScore = (baseScore, difficulty) => {
    const multiplier = DIFFICULTY_MULTIPLIERS[difficulty] || 1.0;
    let finalScore = baseScore * multiplier;

    if (correctStreak !== -1) {
        finalScore += correctStreak;
        correctStreak++;
    }

    score += Math.round(finalScore);
    scoreText.innerText = score;
};

const startGame = () => {
    questionCounter = 0;
    score = 0;
    availableQuestions = [...questions];
    getNewQuestion();
    game.classList.remove('hidden');
    loader.classList.add('hidden');
};

const params = new URLSearchParams(window.location.search);
const triviaAmount = params.get('Amount');
const triviaCategory = params.get('Category');
const triviaDifficulty = params.get('Difficulty');
const triviaStreak = params.get('Streak');

if (triviaStreak === 'true') {
    correctStreak = 0;
} else {
    streakHud.classList.add('hidden');
    streak.classList.add('hidden');
}

let apiUrl = `https://opentdb.com/api.php?amount=${triviaAmount}`;

if (triviaCategory !== 'any') {
    apiUrl += `&category=${triviaCategory}`;
}

if (triviaDifficulty !== 'any') {
    apiUrl += `&difficulty=${triviaDifficulty}`;
}

fetch(apiUrl)
    .then((res) => res.json())
    .then((loadedQuestions) => {
        if (loadedQuestions.response_code !== 0) {
            console.error('Error fetching questions:', loadedQuestions.response_code);
            return;
        }

        questions = loadedQuestions.results.map((loadedQuestion) => {
            const parser = new DOMParser();
            const decodedQuestion = parser.parseFromString(`<!doctype html><body>${loadedQuestion.question}`, 'text/html').body.textContent;
            const decodedCorrect = parser.parseFromString(`<!doctype html><body>${loadedQuestion.correct_answer}`, 'text/html').body.textContent;
            const decodedIncorrect = loadedQuestion.incorrect_answers.map(ans =>
                parser.parseFromString(`<!doctype html><body>${ans}`, 'text/html').body.textContent
            );

            const formattedQuestion = {
                question: decodedQuestion,
                difficulty: loadedQuestion.difficulty
            };

            const isTrueFalse = loadedQuestion.type === 'boolean';
            let answerChoices;

            if (isTrueFalse) {
                answerChoices = ['True', 'False'];
                formattedQuestion.answer = decodedCorrect === 'True' ? 1 : 2;
            } else {
                answerChoices = [...decodedIncorrect];
                formattedQuestion.answer = Math.floor(Math.random() * 4) + 1;
                answerChoices.splice(formattedQuestion.answer - 1, 0, decodedCorrect);
            }

            formattedQuestion.choices = answerChoices;
            return formattedQuestion;
        });

        startGame();
    })
    .catch((err) => {
        console.error(err);
    });
