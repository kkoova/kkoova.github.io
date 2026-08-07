extends Control

@export var hearts_container: HBoxContainer
@export var time_label: Label
@export var Lv_label: Label
@export var Name_label: Label
@export var Hp_label: Label
@export var Hov_label: Label
@export var Bag_label: Label
@export var Wg_label: Label

var heart_texture = preload("res://assets/heart.png")

func _ready() -> void:
	update_info()
	update_hp_display()
	_on_timer_timeout()

func update_info():
	if int(Global.hp) > 9 && int(Global.hov) > 5:
		Lv_label.text = "5"
	else:
		Lv_label.text = "1"
	
	Name_label.text = str(Global.name_user)
	Hp_label.text = str(Global.hp)
	Hov_label.text = str(Global.hov)
	Bag_label.text = str(Global.bag)
	Wg_label.text = str(Global.wg)

func update_hp_display():
	for child in hearts_container.get_children():
		child.queue_free()
	
	var hearts_count = int(Global.hp) / 2
	
	for i in range(hearts_count):
		var rect = TextureRect.new()
		rect.texture = heart_texture
		rect.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		hearts_container.add_child(rect)

func _on_timer_timeout():
	var current_time = Time.get_time_dict_from_system()
	var time_string = "%02d:%02d" % [current_time.hour, current_time.minute]
	time_label.text = time_string
