// CONSTANTS
const CORRECT_BONUS = 10;
const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']; // expand as needed

// DOM ELEMENTS
const choicesContainer = document.getElementById('choicesContainer');
const question = document.getElementById('question');
const progressText = document.getElementById('progressText');
const scoreText = document.getElementById('score');
const progressBarFull = document.getElementById('progressBarFull');
const loader = document.getElementById('loader');
const game = document.getElementById('game');

// GAME VARIABLES
let currentQuestion = {};
let acceptingAnswers = false;
let score = 0;
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
                incrementScore(CORRECT_BONUS);
            }

            selectedChoice.parentElement.classList.add(classToApply);

            if (classToApply === 'incorrect' && correctChoice) {
                correctChoice.parentElement.classList.add('correct-answer');
            }

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


// Function to get a new question
const getNewQuestion = () => {
    if (availableQuestions.length === 0) {
        // No more questions, end the game
        localStorage.setItem('mostRecentScore', score);
        return window.location.assign('./end.html');
    }

    questionCounter++;
    const totalQuestions = triviaAmount; // Get the total number of questions
    progressText.innerText = `Question ${questionCounter} of ${totalQuestions}`;
    progressBarFull.style.width = `${(questionCounter / totalQuestions) * 100}%`;

    const questionIndex = Math.floor(Math.random() * availableQuestions.length);
    currentQuestion = availableQuestions[questionIndex];
    question.innerText = currentQuestion.question;

    renderChoices(currentQuestion.choices);

    availableQuestions.splice(questionIndex, 1);
    acceptingAnswers = true;
};

// Function to increment score
const incrementScore = (num) => {
    score += num;
    scoreText.innerText = score;
};

// Function to start the game
const startGame = () => {
    questionCounter = 0;
    score = 0;
    availableQuestions = [...questions];
    getNewQuestion();
    game.classList.remove('hidden');
    loader.classList.add('hidden');
};

// Get parameters for url
const params = new URLSearchParams(window.location.search);
const triviaAmount = params.get('triviaAmount');
const triviaCategory = params.get('triviaCategory');
const triviaDifficulty = params.get('triviaDifficulty');

let apiUrl = `https://opentdb.com/api.php?amount=${triviaAmount}`;

if (triviaCategory !== 'any') {
    apiUrl += `&category=${triviaCategory}`;
}

if (triviaDifficulty !== 'any') {
    apiUrl += `&difficulty=${triviaDifficulty}`;
}

// apiUrl += '&type=multiple';

fetch(apiUrl)
    .then((res) => res.json())
    .then((loadedQuestions) => {
        // Check if the API returned an error
        if (loadedQuestions.response_code !== 0) {
            console.error('Error fetching questions:', loadedQuestions.response_code);
            return;
        }
        // Decode the HTML entities
        questions = loadedQuestions.results.map((loadedQuestion) => {
            const parser = new DOMParser();
            const decodedQuestion = parser.parseFromString(`<!doctype html><body>${loadedQuestion.question}`, 'text/html').body.textContent;

            const decodedCorrect = parser.parseFromString(`<!doctype html><body>${loadedQuestion.correct_answer}`, 'text/html').body.textContent;
            const decodedIncorrect = loadedQuestion.incorrect_answers.map(ans =>
                parser.parseFromString(`<!doctype html><body>${ans}`, 'text/html').body.textContent
            );

            const formattedQuestion = {
                question: decodedQuestion,
            };

            const answerChoices = [...decodedIncorrect];
            formattedQuestion.answer = Math.floor(Math.random() * 4) + 1;
            answerChoices.splice(formattedQuestion.answer - 1, 0, decodedCorrect);
            formattedQuestion.choices = answerChoices;

            return formattedQuestion;
        });

        startGame();
    })
    .catch((err) => {
        console.error(err);
    });