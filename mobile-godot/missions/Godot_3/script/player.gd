extends CharacterBody2D

var speed = 40
@export var anim: AnimatedSprite2D
@export var hand: Sprite2D

var is_sitting = false
var is_tool = false

func _physics_process(_delta):
	if is_sitting:
		velocity = Vector2.ZERO
		move_and_slide()
		return
	
	var input = Vector2(
		Input.get_action_strength("ui_right") - Input.get_action_strength("ui_left"),
		Input.get_action_strength("ui_down") - Input.get_action_strength("ui_up")
	)
	
	if input.x > 0:
		anim.flip_h = true
		hand.flip_h = true
		hand.position.x = -48.0
	elif input.x < 0:
		anim.flip_h = false
		hand.flip_h = false
		hand.position.x = -63.0
	
	if input != Vector2.ZERO:
		anim.play("walk")
	else:
		anim.play("idle")
	
	velocity = input.normalized() * speed
	move_and_slide()

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed('use_tool'):
		if !is_tool:
			if Global.inventory.size() > 0:
				is_tool = true
				var item = Global.inventory[0]
				if item.is_tool:
					hand.texture = item.icon
		else:
			is_tool = false
			hand.texture = null
	if event.is_action_pressed("interact"):
		if is_sitting:
			is_sitting = false
			anim.play("idle")
		else:
			is_sitting = true
			anim.play("sit")
