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

#!/bin/bash
# setup.sh — Уровень 2: Работа с файлами (минималистично)
echo "Создание файлов для Уровня 2..."
# создаем папку для уровня 2
mkdir -p ~/kali_quest/level2

# создаем файл с флагом
echo "FLAG{file_touch_master}" > ~/kali_quest/level2/flag.txt

# создаем временный файл, который студент должен будет удалить
touch ~/kali_quest/level2/temp_file.txt

# создаем подпапку
mkdir ~/kali_quest/level2/subfolder

echo "Уровень 2 готов! Тебе нужно: создать файл, удалить temp_file.txt, найти flag.txt"

#!/bin/bash
# setup.sh — Уровень 3: Основы сети

echo "Создание файлов для Уровня 3..."

# создаем папку для уровня 3
mkdir -p ~/kali_quest/level3

# создаем файл с флагом
echo "FLAG{network_ping_master}" > ~/kali_quest/level3/flag.txt

echo "Уровень 3 готов! Тебе нужно: узнать IP своей виртуальной машины и найти flag.txt"

