extends CanvasLayer

var peer = ENetMultiplayerPeer.new()
@export var player_scene: PackedScene
@export var Menu: VBoxContainer
@export var ip: LineEdit

func _ready():
	# События для СЕРВЕРА
	multiplayer.peer_connected.connect(_on_peer_connected)
	
	# События для КЛИЕНТА
	multiplayer.connected_to_server.connect(_on_connection_ok)
	multiplayer.connection_failed.connect(_on_connection_fail)

# Выполнится на СЕРВЕРЕ
func _on_peer_connected(id):
	print("Сервер: Подключился игрок с ID: ", id)
	add_player(id)

# Выполнится на КЛИЕНТЕ
func _on_connection_ok():
	print("Клиент: Я успешно подключился к серверу!")

# Выполнится на КЛИЕНТЕ
func _on_connection_fail():
	print("Клиент: Ошибка! Не удалось достучаться до сервера.")

func _on_host_btn_pressed():
	var res = peer.create_server(7000)
	if res != OK:
		print("Не удалось запустить сервер!")
		return
	multiplayer.multiplayer_peer = peer
	print("Сервер запущен!")
	add_player(1) # Добавляем хоста (его ID всегда 1)
	Menu.hide()

func _on_join_btn_pressed():
	var ip = ip.text
	if ip == "": ip = "127.0.0.1" # Если пусто, лезем на себя
	
	var res = peer.create_client(ip, 7000)
	if res != OK:
		print("Ошибка инициализации клиента!")
		return
	multiplayer.multiplayer_peer = peer
	Menu.hide()

func add_player(id: int):
	var player = player_scene.instantiate()
	player.name = 'fffff'
	player.position = Vector2(160, 110)
	get_parent().add_child(player)
