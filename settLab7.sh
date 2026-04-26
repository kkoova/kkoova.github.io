#!/bin/bash

CONTAINER="dvwa"
DB="dvwa"
USER="admin"
PASS="password"

docker exec -i $CONTAINER mysql -u $USER -p$PASS $DB <<EOF

INSERT INTO users (username, password) VALUES ('suzy', MD5('good-luck'));
INSERT INTO users (username, password) VALUES ('Waterloo', MD5('robocop'));
INSERT INTO users (username, password) VALUES ('nike', MD5('good'));
INSERT INTO users (username, password) VALUES ('disco', MD5('chameleon'));
INSERT INTO users (username, password) VALUES ('Golden', MD5('Freddy'));

EOF

echo "5 users added"
