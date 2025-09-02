function checkAnswer(correctAnswer, flagName) {
  const user = document.getElementById("answer").value.trim();
  const result = document.getElementById("result");

  if (user.toLowerCase() === correctAnswer.toLowerCase()) {
    result.textContent = `Верно! Флаг: FLAG{${flagName}}`;
    result.style.color = "lime";
  } else {
    result.textContent = "Неверно, попробуй снова.";
    result.style.color = "red";
  }
}
