#!/bin/bash

set -e

FOLDER_ID="1RWLUdk7V2ZsArNBgDdkXI2VkrZ23CV21"
WORKDIR="$HOME/offline_debs"

echo "[*] Создание рабочей директории..."
mkdir -p "$WORKDIR"
cd "$WORKDIR"

echo "[*] Проверка gdown..."

if ! command -v gdown &> /dev/null; then
    echo "[!] gdown не найден"

    echo "[*] Пробуем установить через pip..."

    if command -v pip3 &> /dev/null; then
        pip3 install --user gdown
        export PATH="$HOME/.local/bin:$PATH"
    else
        echo "[X] pip3 отсутствует"
        echo "[X] Установи gdown вручную:"
        echo "https://github.com/wkentaro/gdown"
        exit 1
    fi
fi

echo "[*] Скачивание файлов из Google Drive..."
gdown --folder "https://drive.google.com/drive/folders/$FOLDER_ID"

echo "[*] Поиск deb-файлов..."
find . -type f -name "*.deb" > debs.txt

echo "[*] Первая попытка установки..."

while read -r pkg; do
    echo "[+] dpkg -i $pkg"
    sudo dpkg -i "$pkg" || true
done < debs.txt

echo "[*] Повторная установка для зависимостей..."

for i in {1..5}; do
    while read -r pkg; do
        sudo dpkg -i "$pkg" || true
    done < debs.txt
done

echo "[*] Проверка сломанных пакетов..."
dpkg --audit || true

echo "[✓] Завершено"
