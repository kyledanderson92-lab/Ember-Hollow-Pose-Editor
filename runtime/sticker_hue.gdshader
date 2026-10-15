shader_type canvas_item;
uniform float hue_degrees = 0.0;
varying vec4 vertex_color;
void vertex() { vertex_color = COLOR; }
vec3 rgb_to_hsv(vec3 c) {
 vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);
 vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
 vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
 float d = q.x - min(q.w, q.y);
 return vec3(abs(q.z + (q.w-q.y)/(6.0*d+0.0000001)), d/(q.x+0.0000001), q.x);
}
void fragment() {
 vec4 pixel = texture(TEXTURE, UV);
 vec3 hsv = rgb_to_hsv(pixel.rgb);
 hsv.x = fract(hsv.x + hue_degrees/360.0 + 1.0);
 vec3 p = abs(fract(hsv.xxx + vec3(0.0, 2.0/3.0, 1.0/3.0))*6.0-3.0);
 COLOR = vec4(hsv.z*mix(vec3(1.0), clamp(p-1.0,0.0,1.0),hsv.y),pixel.a) * vertex_color;
}
