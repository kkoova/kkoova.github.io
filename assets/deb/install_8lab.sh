#!/bin/bash

set -e

echo "[1/3] Скачивание пакетов..."

BASE="https://kkoova.github.io/assets/deb"

wget $BASE/steghide_0.5.1-15_amd64.deb
wget $BASE/libmcrypt4_2.5.8-8+b1_amd64.deb
wget $BASE/libmhash2_0.9.9.9-11_amd64.deb
wget $BASE/stegcracker_2.1.0-5_all.deb
wget $BASE/stegosuite_0.9.0-1_all.deb

echo "[2/3] Установка зависимостей системы..."
sudo apt update || true
sudo apt install -y python3 python3-pip default-jre

echo "[3/3] Установка .deb пакетов..."

sudo dpkg -i libmcrypt4_*.deb
sudo dpkg -i libmhash2_*.deb
sudo dpkg -i steghide_*.deb

sudo dpkg -i stegcracker_*.deb || sudo apt --fix-broken install -y

sudo dpkg -i stegosuite_*.deb || true

echo "Проверка:"
steghide --version || echo "steghide не найден"
stegcracker --help || echo "stegcracker не найден"

echo "Готово."
