#!/bin/bash

set -e

echo "[1/3] Скачивание пакетов..."

BASE="https://kkoova.github.io/assets/deb"

wget $BASE/steghide_0.5.1-15_amd64.deb
wget $BASE/libmcrypt4_2.5.8-8+b1_amd64.deb
wget $BASE/libmhash2_0.9.9.9-11+b1_amd64.deb
wget $BASE/stegcracker_2.1.0-5_all.deb
wget $BASE/stegosuite_0.9.0-1_all.deb

echo "[2/3] Установка зависимостей системы..."
wget $BASE/libslf4j-java_1.7.32-2_all.deb
wget $BASE/liblogback-java_1.2.11-6_all.deb
wget $BASE/libpicocli-java_4.6.2-2_all.deb

wget $BASE/libswt-gtk-4-jni_4.29.0-1_amd64.deb
wget $BASE/libswt-gtk-4-java_4.29.0-1_amd64.deb
wget $BASE/libswt-cairo-gtk-4-jni_4.29.0-1_amd64.deb

echo "[3/3] Установка .deb пакетов..."

sudo dpkg -i libmcrypt4_*.deb
sudo dpkg -i libmhash2_*.deb
sudo dpkg -i steghide_*.deb

sudo dpkg -i libslf4j-java_*.deb
sudo dpkg -i liblogback-java_*.deb
sudo dpkg -i libpicocli-java_*.deb

sudo dpkg -i libswt-gtk-4-jni_*.deb
sudo dpkg -i libswt-gtk-4-java_*.deb
sudo dpkg -i libswt-cairo-gtk-4-jni_*.deb

sudo dpkg -i stegcracker_*.deb || sudo apt --fix-broken install -y

sudo dpkg -i stegosuite_*.deb || true

echo "Проверка:"
steghide --version || echo "steghide не найден"
stegcracker --help || echo "stegcracker не найден"

echo "Готово."
