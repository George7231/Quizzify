const question = document.getElementById('question');
const choices = Array.from(document.getElementsByClassName('choice-text'));
const progressText = document.getElementById('progressText');
const scoreText = document.getElementById('score');
const progressBarFull = document.getElementById('progressBarFull');
const loader = document.getElementById('loader');
const game = document.getElementById('game');
let currentQuestion = {};
let acceptingAnswers = false;
let score = 0;
let questionCounter = 0;
let availableQuestions = [];

let questions = [];

const params = new URLSearchParams(window.location.search);
const triviaAmount = params.get('triviaAmount');
const triviaCategory = params.get('triviaCategory');
const triviaDifficulty = params.get('triviaDifficulty');

const apiUrl = `https://opentdb.com/api.php?amount=${triviaAmount}`;

if (triviaCategory !== 'any') {
    apiUrl.concat(`&category=${triviaCategory}`);
}

if (triviaDifficulty !== 'any') {
    apiUrl.concat(`&difficulty=${triviaDifficulty}`);
}

apiUrl.concat('&type=multiple');

fetch(apiUrl)
    .then((res) => res.json())
    .then((loadedQuestions) => {
        questions = loadedQuestions.results.map((loadedQuestion) => {
            // const formattedQuestion = {
            //     question: loadedQuestion.question,
            //     choices: [],
            // };
            const parser = new DOMParser();
            const decodedQuestion = parser.parseFromString(`<!doctype html><body>${loadedQuestion.question}`, 'text/html').body.textContent;

            const formattedQuestion = {
                question: decodedQuestion,
            };

            const answerChoices = [...loadedQuestion.incorrect_answers];
            formattedQuestion.answer = Math.floor(Math.random() * 4) + 1;
            answerChoices.splice(formattedQuestion.answer - 1, 0, loadedQuestion.correct_answer);

            formattedQuestion.choices = answerChoices;

            return formattedQuestion;
        });

        startGame();
    })
    .catch((err) => {
        console.error(err);
    });

// CONSTANTS
const CORRECT_BONUS = 10;

startGame = () => {
    questionCounter = 0;
    score = 0;
    availableQuestions = [...questions];
    getNewQuestion();
    game.classList.remove('hidden');
    loader.classList.add('hidden');
};

getNewQuestion = () => {
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

    choices.forEach((choice, index) => {
        choice.innerText = currentQuestion.choices[index];
    });

    availableQuestions.splice(questionIndex, 1);
    acceptingAnswers = true;
};

choices.forEach((choice) => {
    choice.addEventListener('click', (e) => {
        if (!acceptingAnswers) return;

        acceptingAnswers = false;
        const selectedChoice = e.target;
        const selectedAnswer = selectedChoice.innerText;
        const correctAnswerIndex = currentQuestion.answer - 1;
        const correctChoice = choices[correctAnswerIndex];

        const classToApply = selectedAnswer === currentQuestion.choices[currentQuestion.answer - 1] ? 'correct' : 'incorrect';

        if (classToApply === 'correct') {
            incrementScore(CORRECT_BONUS);
        }

        selectedChoice.parentElement.classList.add(classToApply);

        // Highlight correct answer if the user was incorrect
        if (classToApply === 'incorrect') {
            correctChoice.parentElement.classList.add('correct-answer');
        }

        setTimeout(() => {
            selectedChoice.parentElement.classList.remove(classToApply);
            correctChoice.parentElement.classList.remove('correct-answer');
            getNewQuestion();
        }, 1000);
    });
});

incrementScore = (num) => {
    score += num;
    scoreText.innerText = score;
};