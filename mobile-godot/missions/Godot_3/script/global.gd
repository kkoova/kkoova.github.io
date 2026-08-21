extends Node

# Сигнал для уведомления об обновлении инвентаря
signal inventory_updated
var inventory: Array[ItemData] = []

func add_item(item: ItemData):
	# Добавляем предмет в инвентарь
	inventory.append(item)
	# Оповещаем UI об изменениях
	inventory_updated.emit()
