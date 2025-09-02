function checkAnswer(correctAnswer, nextLevel) {
  const user = document.getElementById("answer").value.trim();
  const result = document.getElementById("result");

  if (user === correctAnswer) {
    result.textContent = `Верно! Флаг: ${correctAnswer}. Переходим к следующему уровню...`;
    result.style.color = "lime";

    // Переход через 2 секунды
    setTimeout(() => {
      if (nextLevel) {
        window.location.href = nextLevel;
      }
    }, 2000);
  } else {
    result.textContent = "Неверно, попробуй снова.";
    result.style.color = "red";
  }
}
