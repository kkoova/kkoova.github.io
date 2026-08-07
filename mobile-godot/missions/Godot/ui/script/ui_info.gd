extends Control

@export var Hp: TextEdit
@export var Hov: TextEdit
@export var Bag: TextEdit
@export var Wg: TextEdit
@export var Name: TextEdit

@export var NextScene: PackedScene

func _on_next_button_pressed() -> void:
	Global.set_info(Hp.text, Hov.text, Bag.text, Wg.text, Name.text)
	
	var next_scene = NextScene.instantiate()
	get_tree().root.add_child(next_scene)
	get_tree().current_scene.queue_free()
	get_tree().current_scene = next_scene
