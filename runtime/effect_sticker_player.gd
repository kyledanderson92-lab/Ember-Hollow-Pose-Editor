extends Node2D
## Reusable playback of Export Godot effects JSON. Call seek with the character's
## animation clock; positions are actor-local and include exported root/facing.
## asset_root points to the editor distribution containing assets/effects/.
const HUE = preload("sticker_hue.gdshader")
var clip: Dictionary = {}
var asset_root: String = "res://tools/sol_pose_editor/"
var _assets: Dictionary = {}
var _sprites: Dictionary = {}
var _textures: Dictionary = {}
var elapsed: float = 0.0
var playing: bool = false
var loop: bool = false

func load_clip(data: Dictionary, root_path: String = "res://tools/sol_pose_editor/") -> void:
	assert(data.get("type") == "sol_effect_sticker_clip" and data.get("version") == 1)
	clip = data.duplicate(true)
	asset_root = root_path
	scale = Vector2.ONE * float(data.get("actor_scale",1.0))
	_assets.clear()
	_textures.clear()
	for sprite: Sprite2D in _sprites.values():
		sprite.queue_free()
	_sprites.clear()
	for asset: Dictionary in clip.assets:
		_assets[asset.id] = asset
	elapsed = 0.0
	seek(0.0)

func play() -> void:
	elapsed = 0.0
	playing = true
	seek(elapsed)

func _process(delta: float) -> void:
	if not playing or clip.is_empty():
		return
	elapsed += delta
	var duration: float = clip.duration
	if elapsed >= duration:
		if loop and duration > 0.0:
			elapsed = fmod(elapsed, duration)
		else:
			elapsed = duration
			playing = false
	seek(elapsed)

static func _ease(mode: String, t: float) -> float:
	match mode:
		"hold": return 0.0
		"ease_in": return t*t
		"ease_out": return 1.0-(1.0-t)*(1.0-t)
		"ease_in_out": return 2.0*t*t if t < 0.5 else 1.0-pow(-2.0*t+2.0,2.0)/2.0
	return t

static func _vector(v: Array) -> Vector2:
	return Vector2(v[0], v[1])

func states_at(time: float) -> Array[Dictionary]:
	var out: Array[Dictionary] = []
	if clip.is_empty() or clip.keys.is_empty():
		return out
	var keys: Array = clip.keys
	var index: int = 0
	while index+1 < keys.size() and float(keys[index+1].time) <= time:
		index += 1
	var a: Dictionary = keys[index]
	var b: Dictionary = keys[mini(index+1,keys.size()-1)]
	var t: float = 0.0 if a == b else _ease(a.interpolation, clampf((time-float(a.time))/(float(b.time)-float(a.time)),0.0,1.0))
	var other: Dictionary = {}
	for sticker: Dictionary in b.stickers:
		other[sticker.id] = sticker
	var root_position: Vector2 = _vector(a.root).lerp(_vector(b.root),t)
	var facing: float = float(a.facing if t < 0.5 else b.facing)
	for source: Dictionary in a.stickers:
		var e: Dictionary = source.duplicate(true)
		if other.has(e.id):
			var target: Dictionary = other[e.id]
			e.opacity = lerpf(e.opacity,target.opacity,t)
			e.hue = lerpf(e.hue,target.hue,t)
			e.transform.position = _vector(e.transform.position).lerp(_vector(target.transform.position),t)
			e.transform.rotation = rad_to_deg(lerp_angle(deg_to_rad(e.transform.rotation),deg_to_rad(target.transform.rotation),t))
			for name: String in ["scale","scale_x","scale_y"]:
				e.transform[name] = lerpf(e.transform[name],target.transform[name],t)
		else:
			e.transform.position = _vector(e.transform.position)
		var asset: Dictionary = _assets[e.asset]
		var frame: int = int(e.playback.frame) if e.playback.frame != null else int(floor(maxf(0.0,time-float(e.range.start))*float(e.playback.fps)*float(e.playback.speed)+0.00000001))+int(e.playback.start_frame)
		if e.playback.loop:
			frame %= asset.frames.size()
		var visible_now: bool = e.enabled and e.opacity > 0.0 and time >= float(e.range.start)-0.00000001 and time < float(e.range.end)-0.00000001 and frame < asset.frames.size()
		var point: Vector2 = e.transform.position
		out.append({"id":e.id,"asset":e.asset,"frame":frame,"visible":visible_now,"position":root_position+Vector2(point.x*facing,point.y),"rotation":float(e.transform.rotation)*facing,"scale":Vector2(float(e.transform.scale)*float(e.transform.scale_x)*(-1.0 if e.mirror_x else 1.0)*facing,float(e.transform.scale)*float(e.transform.scale_y)*(-1.0 if e.mirror_y else 1.0)),"hue":e.hue,"opacity":e.opacity,"z":e.z})
	return out

func seek(time: float) -> void:
	for sprite: Sprite2D in _sprites.values():
		sprite.visible = false
	for state: Dictionary in states_at(time):
		if not _sprites.has(state.id):
			var sprite := Sprite2D.new()
			var material := ShaderMaterial.new()
			material.shader = HUE
			sprite.material = material
			add_child(sprite)
			_sprites[state.id] = sprite
		var sprite: Sprite2D = _sprites[state.id]
		sprite.visible = state.visible
		if not state.visible:
			continue
		var asset: Dictionary = _assets[state.asset]
		var path: String = asset_root.path_join(asset.frames[state.frame])
		if not _textures.has(path):
			_textures[path] = load(path)
		sprite.texture = _textures[path]
		sprite.position = state.position
		sprite.rotation_degrees = state.rotation
		sprite.scale = state.scale * Vector2(float(asset.width)/sprite.texture.get_width(),float(asset.height)/sprite.texture.get_height())
		sprite.modulate.a = state.opacity
		sprite.z_index = state.z
		sprite.material.set_shader_parameter("hue_degrees",state.hue)
