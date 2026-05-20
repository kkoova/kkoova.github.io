#!/bin/bash

set -e

DEB_DIR="$HOME/Desktop/deb"

echo "[1/6] Проверка папки..."

if [ ! -d "$DEB_DIR" ]; then
    echo "[X] Папка не найдена: $DEB_DIR"
    exit 1
fi

cd "$DEB_DIR"

echo "[2/6] Проверка .deb файлов..."

COUNT=$(ls *.deb 2>/dev/null | wc -l)

if [ "$COUNT" -eq 0 ]; then
    echo "[X] .deb файлы не найдены"
    exit 1
fi

echo "[+] Найдено пакетов: $COUNT"

echo "[3/6] Установка пакетов..."

for i in {1..8}; do
    echo
    echo "===== ПРОХОД $i ====="

    for pkg in *.deb; do
        echo "[+] Установка: $pkg"

        sudo dpkg -i "$pkg" || true
    done
done

echo
echo "[4/6] Проверка проблемных пакетов..."

dpkg --audit || true

echo
echo "[5/6] Запуск Docker..."

sudo systemctl daemon-reload || true
sudo systemctl enable docker || true
sudo systemctl start docker || true

echo
echo "[6/6] Проверка..."

docker --version || true

echo
docker compose version || true

echo
sudo systemctl status docker --no-pager || true

echo
echo "[✓] Готово"
