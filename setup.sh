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


#!/bin/bash
# setup.sh — Уровень 3: Основы сети

echo "Создание файлов для Уровня 3..."

# создаем папку для уровня 3
mkdir -p ~/kali_quest/level3

# создаем файл с флагом
echo "FLAG{network_ping_master}" > ~/kali_quest/level3/flag.txt


#!/bin/bash
# setup.sh — Уровень 4: Права доступа

echo "Создание файлов для Уровня 4..."

# создаем папку для уровня 4
mkdir -p ~/kali_quest/level4

# создаем файл, права которого нужно изменить
touch ~/kali_quest/level4/secret_file.txt


