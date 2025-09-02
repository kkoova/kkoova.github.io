#!/bin/bash
# setup.sh — первый уровень

echo "Создание файлов для Уровня 1..."

# создаем основную папку для квеста
mkdir -p ~/kali_quest/level1

# создаем скрытую папку
mkdir -p ~/kali_quest/level1/.hidden_folder

# создаем файл с флагом
echo "FLAG{ls_hidden_master}" > ~/kali_quest/level1/.hidden_folder/flag.txt

# делаем папку скрытой (уже по имени, можно chmod если хотим)
chmod 700 ~/kali_quest/level1/.hidden_folder

echo "Уровень 1 готов! Найди скрытую папку и открой flag.txt."
