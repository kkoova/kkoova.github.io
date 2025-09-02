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

#!/bin/bash
# setup.sh — Уровень 5: Поиск файлов

echo "Создание файлов для Уровня 5..."

# создаем папку для уровня 5
mkdir -p ~/kali_quest/level5

# создаем несколько файлов
echo "Это обычный файл" > ~/kali_quest/level5/file1.txt
echo "FLAG{find_grep_master}" > ~/kali_quest/level5/secret_file.txt
echo "Ещё один файл" > ~/kali_quest/level5/file2.txt

#!/bin/bash
# setup.sh — Уровень 6: Копирование и перемещение файлов

echo "Создание файлов для Уровня 6..."

# создаем папку уровня 6 и подпапку
mkdir -p ~/kali_quest/level6/subfolder

# создаем файл, который нужно скопировать и переместить
echo "FLAG{cp_mv_master}" > ~/kali_quest/level6/file_to_move.txt

#!/bin/bash
# setup.sh — Уровень 7: Архивирование и сжатие файлов

echo "Создание файлов для Уровня 7..."

# создаем папку уровня 7
mkdir -p ~/kali_quest/level7

# создаем несколько файлов для архива
echo "Это первый файл" > ~/kali_quest/level7/file1.txt
echo "FLAG{archive_master}" > ~/kali_quest/level7/file2.txt
echo "Это третий файл" > ~/kali_quest/level7/file3.txt

#!/bin/bash
# setup.sh — Уровень 8: Просмотр процессов и управление ими

echo "Создание файлов для Уровня 8..."

# создаем папку уровня 8
mkdir -p ~/kali_quest/level8

# создаем скрипт, который будет фоном "работать"
echo -e '#!/bin/bash\nwhile true; do echo "Process running"; sleep 100; done' > ~/kali_quest/level8/background_process.sh
chmod +x ~/kali_quest/level8/background_process.sh

# запускаем процесс в фоне
bash ~/kali_quest/level8/background_process.sh &

# создаем файл с флагом
echo "FLAG{process_master}" > ~/kali_quest/level8/flag.txt


#!/bin/bash
# setup.sh — Уровень 9: Работа с пакетами

echo "Создание файлов для Уровня 9..."

# создаем папку уровня 9
mkdir -p ~/kali_quest/level9

# создаем файл с подсказкой
echo "FLAG{package_master}" > ~/kali_quest/level9/flag.txt

