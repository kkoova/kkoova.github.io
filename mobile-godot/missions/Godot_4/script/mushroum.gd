extends Node2D

@export var item_resources: ItemData

# Если в Area2D находиться любое body, вызывается данная функция
func _on_area_2d_body_entered(body: Node2D) -> void:
	# Проверка body = Player
	if body.name == 'Player':
		# Вызов add_item с ресурсом ItemData
		Global.add_item(item_resources)
		# Удаление предмета
		queue_free()
