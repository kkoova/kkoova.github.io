extends CanvasLayer

@export var grid: GridContainer
@export var axe: ItemData

func _ready():
	Global.inventory_updated.connect(refresh_ui)
	Global.add_item(axe)
	refresh_ui()

func refresh_ui():
	# Очистка старых слотов
	for child in grid.get_children(): child.queue_free()
	
	# Создание новых на основе данных из Global
	for item in Global.inventory:
		var slot = TextureRect.new()
		slot.texture = item.icon
		grid.add_child(slot)
