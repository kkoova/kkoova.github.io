#!/bin/bash

read -p "Введите номер варианта (1-25): " VAR

if ! [[ "$VAR" =~ ^[0-9]+$ ]] || [ "$VAR" -lt 1 ] || [ "$VAR" -gt 25 ]; then
  echo "Ошибка: вариант должен быть числом от 1 до 25"
  exit 1
fi

# Рабочий стол Kali
DESKTOP="$HOME/Desktop"
if [ ! -d "$DESKTOP" ]; then
  DESKTOP="$HOME/Рабочий стол"
fi

TARGET="$DESKTOP/Для лабораторной 8 вариант $VAR"
mkdir -p "$TARGET"

cd "$TARGET" || exit 1

echo "Скачивание файлов..."

# Индивидуальные файлы
IMG_URL="https://kkoova.github.io/assets/deb/var/${VAR}.jpg"
VAR_ZIP_URL="https://kkoova.github.io/assets/deb/varindivid/${VAR}.zip"

curl -L -o "${VAR}.jpg" "$IMG_URL"
curl -L -o "${VAR}.zip" "$VAR_ZIP_URL"

echo "Готово."
echo "Папка создана: $TARGET"
