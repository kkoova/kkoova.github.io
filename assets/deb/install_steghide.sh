#!/bin/bash

set -e

echo "[1/3] Скачиваю пакеты..."

wget https://kkoova.github.io/assets/deb/libmcrypt4_2.5.8-8+b1_amd64.deb
wget https://kkoova.github.io/assets/deb/libmhash2_0.9.9.9-11+b1_amd64.deb
wget https://kkoova.github.io/assets/deb/steghide_0.5.1-15_amd64.deb

echo "[2/3] Устанавливаю..."

sudo dpkg -i libmcrypt4_*.deb
sudo dpkg -i libmhash2_*.deb
sudo dpkg -i steghide_*.deb

echo "[3/3] Проверяю..."

steghide --version

echo "Готово."
