extends CharacterBody2D

# Скорость игрока
var speed = 40

# Флаг для sit
var is_sitting = false

# Добавляем указание на спрайты, что бы менять наше состояние
@export var anim: AnimatedSprite2D

func _physics_process(_delta):
	# Отмена расчета движения и тд
	if is_sitting:
		velocity = Vector2.ZERO
		move_and_slide()
		return
	
	# Расчет вектора движения игрока
	var input = Vector2(
		Input.get_action_strength("ui_right") - Input.get_action_strength("ui_left"),
		Input.get_action_strength("ui_down") - Input.get_action_strength("ui_up")
	)
	
	# Пооворот спрайта в зависимости от направления персонажа
	if input.x > 0:
		anim.flip_h = true
	elif input.x < 0:
		anim.flip_h = false
	
	# Переключение состояний анимации
	if input != Vector2.ZERO:
		anim.play("walk")
	else:
		anim.play("idle")
	
	# Скорость + вектор
	velocity = input.normalized() * speed
	
	# Само движение у игрока
	move_and_slide()

# Функция мониторит все, что нажал игрок
func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("interact"):
		if is_sitting:
			is_sitting = false
			anim.play("idle")
		else:
			is_sitting = true
			anim.play("sit")
