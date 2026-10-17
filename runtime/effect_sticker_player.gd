extends Node2D
## Reusable playback of Export Godot effects JSON. Call seek with the character's
## animation clock; grid stickers ignore authored root/facing; pelvis stickers inherit them.
## asset_root points to the editor distribution containing assets/effects/.
const HUE = preload("sticker_hue.gdshader")
var clip: Dictionary = {}
var asset_root: String = "res://tools/sol_pose_editor/"
var _assets: Dictionary = {}
var _sprites: Dictionary = {}
var _textures: Dictionary = {}
var _sweep_textures: Dictionary = {}
var _sweep_origin_bounds: Dictionary = {}
var elapsed: float = 0.0
var playing: bool = false
var loop: bool = false

func load_clip(data: Dictionary, root_path: String = "res://tools/sol_pose_editor/") -> void:
	assert(data.get("type") == "sol_effect_sticker_clip" and int(data.get("version",0)) in [1,2,3,4,5,6,7,8,9])
	if int(data.get("version",0)) == 5:
		for key: Dictionary in data.keys:
			for e: Dictionary in key.stickers:
				if e.get("sweep",{}).get("enabled",false):
					push_error("Re-export the experimental angular clip from the current editor to use character-ray reveal.")
					clip = {}
					return
	clip = data.duplicate(true)
	# v20 flipbook migration: retain an explicitly held image, otherwise its start image.
	for key: Dictionary in clip.keys:
		for e: Dictionary in key.stickers:
			if not e.has("image_frame"):
				var old: Dictionary = e.get("playback", {})
				e.image_frame = old.get("frame") if old.get("frame") != null else old.get("start_frame",0)
			e.erase("playback")
			e.saturation = e.get("saturation",1.0)
			e.brightness = e.get("brightness",1.0)
			e.tint = e.get("tint",[1.0,1.0,1.0])
			e.tint_strength = e.get("tint_strength",0.0)
			e.anchor = e.get("anchor","pelvis")
			e.transform.skew = e.transform.get("skew",0.0)
			if not e.has("pivot_version"):
				var asset: Dictionary = {}
				for entry: Dictionary in clip.assets:
					if entry.id == e.asset: asset = entry
				var pivot: Array = asset.get("pivot",[0.5,0.5])
				var delta := Vector2((float(pivot[0])-0.5)*float(asset.width),(float(pivot[1])-0.5)*float(asset.height))
				var r: float = deg_to_rad(e.transform.rotation)
				var sx: float = float(e.transform.scale)*float(e.transform.scale_x)*(-1.0 if e.mirror_x else 1.0)
				var sy: float = float(e.transform.scale)*float(e.transform.scale_y)*(-1.0 if e.mirror_y else 1.0)
				var k: float = tan(deg_to_rad(e.transform.skew))
				var offset := Vector2(cos(r)*sx*delta.x+(cos(r)*k-sin(r))*sy*delta.y,sin(r)*sx*delta.x+(sin(r)*k+cos(r))*sy*delta.y)
				e.transform.position = [e.transform.position[0]+offset.x,e.transform.position[1]+offset.y]
				e.pivot_version = 1
	asset_root = root_path
	scale = Vector2.ONE * float(data.get("actor_scale",1.0))
	_assets.clear()
	_textures.clear()
	_sweep_textures.clear()
	_sweep_origin_bounds.clear()
	for id: String in clip.get("sweep_tracks",{}):
		var track: Array = clip.sweep_tracks[id]
		assert(track.size() <= 2048)
		var pixels := Image.create(2,maxi(1,track.size()),false,Image.FORMAT_RGBAF)
		var bound: float = 0.0
		for i in track.size():
			var ray: Dictionary = track[i]
			pixels.set_pixel(0,i,Color(ray.origin[0],ray.origin[1],ray.direction[0],ray.direction[1]))
			pixels.set_pixel(1,i,Color(ray.time,1.0 if ray.valid else 0.0,1.0 if ray.break_before else 0.0,0.0))
			bound = maxf(bound,_vector(ray.origin).length())
		_sweep_textures[id] = ImageTexture.create_from_image(pixels)
		_sweep_origin_bounds[id] = bound
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
			for field: String in ["saturation","brightness","tint_strength"]:
				e[field] = lerpf(e[field],target[field],t)
			for channel in 3: e.tint[channel] = lerpf(e.tint[channel],target.tint[channel],t)
			if e.has("sweep_ray") and target.has("sweep_ray"):
				var from: Dictionary = e.sweep_ray
				var to: Dictionary = target.sweep_ray
				var origin: Vector2 = _vector(from.origin).lerp(_vector(to.origin),t)
				var direction: Vector2 = _vector(from.direction).lerp(_vector(to.direction),t).normalized()
				e.sweep_ray = {"origin":[origin.x,origin.y],"direction":[direction.x,direction.y],"valid":from.valid if t < 1.0 else to.valid}
			e.transform.position = _vector(e.transform.position).lerp(_vector(target.transform.position),t)
			e.transform.skew = lerpf(e.transform.get("skew",0.0),target.transform.get("skew",0.0),t)
			e.transform.rotation = rad_to_deg(lerp_angle(deg_to_rad(e.transform.rotation),deg_to_rad(target.transform.rotation),t))
			for name: String in ["scale","scale_x","scale_y"]:
				e.transform[name] = lerpf(e.transform[name],target.transform[name],t)
		else:
			e.transform.position = _vector(e.transform.position)
		var asset: Dictionary = _assets[e.asset]
		var frame: int = int(e.image_frame)
		if e.has("sequence"):
			var frames: Array = e.sequence.frames
			var length: float = float(e.range.end)-float(e.range.start)
			var slot: int = clampi(int(floor((time-float(e.range.start))/length*frames.size()+0.000000001)),0,frames.size()-1) if length > 0.0 else 0
			if e.sequence.get("reverse",false): slot = frames.size()-1-slot
			frame = int(frames[slot])
			if e.sequence.has("weights"):
				var ordered: Array = frames.duplicate()
				if e.sequence.get("reverse",false): ordered.reverse()
				var total: float = 0.0
				for source_image: int in ordered: total += float(e.sequence.weights[source_image])
				var cumulative: float = 0.0
				frame = ordered.back()
				for source_image: int in ordered:
					cumulative += float(e.sequence.weights[source_image])
					if time < float(e.range.start)+length*cumulative/total-0.000000000001:
						frame = source_image
						break
		var visible_now: bool = e.enabled and e.opacity > 0.0 and time >= float(e.range.start)-0.00000001 and time < float(e.range.end)-0.00000001 and frame < asset.frames.size()
		var attached: bool = e.get("anchor","pelvis") == "pelvis"
		var sticker_facing: float = facing if attached else 1.0
		var sticker_root: Vector2 = root_position if attached else Vector2.ZERO
		var point: Vector2 = e.transform.position
		var r: float = deg_to_rad(e.transform.rotation)
		var k: float = tan(deg_to_rad(e.transform.get("skew",0.0)))
		var sx: float = float(e.transform.scale)*float(e.transform.scale_x)*(-1.0 if e.mirror_x else 1.0)
		var sy: float = float(e.transform.scale)*float(e.transform.scale_y)*(-1.0 if e.mirror_y else 1.0)
		var basis_x := Vector2(cos(r)*sx*sticker_facing,sin(r)*sx)
		var basis_y := Vector2((cos(r)*k-sin(r))*sy*sticker_facing,(sin(r)*k+cos(r))*sy)
		out.append({"id":e.id,"asset":e.asset,"frame":frame,"image_offset":e.sequence.offsets[frame] if e.has("sequence") else [0.0,0.0],"visible":visible_now,"position":sticker_root+Vector2(point.x*sticker_facing,point.y),"rotation":float(e.transform.rotation)*sticker_facing,"scale":Vector2(float(e.transform.scale)*float(e.transform.scale_x)*(-1.0 if e.mirror_x else 1.0)*sticker_facing,float(e.transform.scale)*float(e.transform.scale_y)*(-1.0 if e.mirror_y else 1.0)),"basis_x":basis_x,"basis_y":basis_y,"hue":e.hue,"saturation":e.saturation,"brightness":e.brightness,"tint":e.tint,"tint_strength":e.tint_strength,"opacity":e.opacity,"z":e.z,"sweep":e.get("sweep",{}),"sweep_ray":e.get("sweep_ray",{})})
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
		var pivot: Array = asset.get("pivot",[0.5,0.5])
		sprite.offset = Vector2((0.5-float(pivot[0]))*sprite.texture.get_width(),(0.5-float(pivot[1]))*sprite.texture.get_height())
		sprite.offset += Vector2(float(state.image_offset[0])*sprite.texture.get_width()/float(asset.width),float(state.image_offset[1])*sprite.texture.get_height()/float(asset.height))
		sprite.transform = Transform2D(state.basis_x*float(asset.width)/sprite.texture.get_width(),state.basis_y*float(asset.height)/sprite.texture.get_height(),state.position)
		sprite.modulate.a = state.opacity
		sprite.z_index = state.z
		sprite.material.set_shader_parameter("hue_degrees",state.hue)
		sprite.material.set_shader_parameter("saturation_scale",state.saturation)
		sprite.material.set_shader_parameter("brightness_scale",state.brightness)
		sprite.material.set_shader_parameter("tint_rgb",Vector3(state.tint[0],state.tint[1],state.tint[2]))
		sprite.material.set_shader_parameter("tint_strength",state.tint_strength)
		var sweep: Dictionary = state.sweep
		var reveal: bool = sweep.get("enabled",false)
		sprite.material.set_shader_parameter("sweep_enabled",reveal)
		if reveal:
			var track: Array = clip.get("sweep_tracks",{}).get(state.id,[])
			var count: int = 0
			var hi: int = track.size()
			while count < hi:
				var mid: int = (count+hi)/2
				if float(track[mid].time) <= time: count = mid+1
				else: hi = mid
			var ray: Dictionary = state.sweep_ray
			var partial: bool = count > 0 and time-float(track[count-1].time) > 0.00000001 and ray.get("valid",false)
			var extent: float = state.position.length()+state.basis_x.length()*(float(asset.width)+absf(float(state.image_offset[0])))+state.basis_y.length()*(float(asset.height)+absf(float(state.image_offset[1])))+float(_sweep_origin_bounds.get(state.id,0.0))+64.0
			if _sweep_textures.has(state.id): sprite.material.set_shader_parameter("sweep_rays",_sweep_textures[state.id])
			sprite.material.set_shader_parameter("sweep_count",count)
			sprite.material.set_shader_parameter("sweep_partial",partial)
			if partial:
				sprite.material.set_shader_parameter("sweep_current",Vector4(ray.origin[0],ray.origin[1],ray.direction[0],ray.direction[1]))
			sprite.material.set_shader_parameter("sweep_extent",extent)
			sprite.material.set_shader_parameter("sticker_origin",sprite.transform.origin)
			sprite.material.set_shader_parameter("sticker_basis_x",sprite.transform.x)
			sprite.material.set_shader_parameter("sticker_basis_y",sprite.transform.y)
