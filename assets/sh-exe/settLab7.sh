#!/bin/bash
read -p "Введите докер NAMES: " CONTAINER
sudo docker exec -it "$CONTAINER" mysql -u root -p'p@ssword' -e "INSERT INTO dvwa.users (user_id, first_name, last_name, user, password, avatar) VALUES (6, 'Test1', 'User1', 'suzy', MD5('good-luck'), 'https://kkoova.github.io/assets/5302999548211360138.jpg');"
sudo docker exec -it "$CONTAINER" mysql -u root -p'p@ssword' -e "INSERT INTO dvwa.users (user_id, first_name, last_name, user, password, avatar) VALUES (7, 'Test2', 'User2', 'Waterloo', MD5('robocop'), 'https://kkoova.github.io/assets/5302999548211360138.jpg');"
sudo docker exec -it "$CONTAINER" mysql -u root -p'p@ssword' -e "INSERT INTO dvwa.users (user_id, first_name, last_name, user, password, avatar) VALUES (8, 'Test3', 'User3', 'nike', MD5('good'), 'https://kkoova.github.io/assets/5302999548211360138.jpg');"
sudo docker exec -it "$CONTAINER" mysql -u root -p'p@ssword' -e "INSERT INTO dvwa.users (user_id, first_name, last_name, user, password, avatar) VALUES (9, 'Test4', 'User4', 'disco', MD5('chameleon'), 'https://kkoova.github.io/assets/5302999548211360138.jpg');"
sudo docker exec -it "$CONTAINER" mysql -u root -p'p@ssword' -e "INSERT INTO dvwa.users (user_id, first_name, last_name, user, password, avatar) VALUES (10, 'Test5', 'User5', 'Golden', MD5('Freddy'), 'https://kkoova.github.io/assets/5302999548211360138.jpg');"
echo "Готово. Пользователи для взлома добавлены"
echo "Удачи :)"
