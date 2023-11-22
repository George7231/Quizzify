document.getElementById('quizForm').addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent the default form submission

    const triviaAmount = document.getElementById('trivia_amount').value;
    const triviaCategory = document.getElementById('trivia_category').value;
    const triviaDifficulty = document.getElementById('trivia_difficulty').value;

    window.location.href = `game.html?triviaAmount=${triviaAmount}&triviaCategory=${triviaCategory}&triviaDifficulty=${triviaDifficulty}`;
});