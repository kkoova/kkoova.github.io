extends CanvasLayer

@export var label: Label

var item_count: int = 0

# Как инртерфес появился, он сразу подписывается на обновление сигнала item_collected
# Что мы создали в global и обновляем грибами
func _ready() -> void:
	Global.item_collected.connect(_on_item_collected)

func _on_item_collected(item_name: String) -> void:
	if item_name == "mushrooms":
		item_count += 1
		label.text = str(item_count)
