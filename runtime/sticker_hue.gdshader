shader_type canvas_item;
uniform float hue_degrees = 0.0;
uniform float saturation_scale = 1.0;
uniform float brightness_scale = 1.0;
uniform vec3 tint_rgb = vec3(1.0);
uniform float tint_strength = 0.0;
uniform bool sweep_enabled = false;
uniform sampler2D sweep_rays : filter_nearest, repeat_disable;
uniform int sweep_count = 0;
uniform bool sweep_partial = false;
uniform vec4 sweep_current = vec4(0.0);
uniform float sweep_extent = 1000.0;
uniform vec2 sticker_origin = vec2(0.0);
uniform vec2 sticker_basis_x = vec2(1.0,0.0);
uniform vec2 sticker_basis_y = vec2(0.0,1.0);
varying vec4 vertex_color;
varying vec2 sticker_grid_point;
void vertex() {
 vertex_color = COLOR;
 sticker_grid_point = sticker_origin + sticker_basis_x * VERTEX.x + sticker_basis_y * VERTEX.y;
}
float cross_2d(vec2 a, vec2 b) { return a.x*b.y-a.y*b.x; }
bool in_triangle(vec2 p, vec2 a, vec2 b, vec2 c) {
 if (abs(cross_2d(b-a,c-a)) < 0.00000001) return false;
 float x=cross_2d(b-a,p-a)/max(length(b-a),0.000001),y=cross_2d(c-b,p-b)/max(length(c-b),0.000001),z=cross_2d(a-c,p-c)/max(length(a-c),0.000001);
 return (min(min(x,y),z)>=-0.001)||(max(max(x,y),z)<=0.001);
}
bool crossed_by(vec2 p,vec4 a,vec4 b) {
 vec2 far_a=a.xy+a.zw*sweep_extent,far_b=b.xy+b.zw*sweep_extent;
 return in_triangle(p,a.xy,far_a,far_b)||in_triangle(p,a.xy,far_b,b.xy);
}
bool revealed(vec2 point) {
 for (int i=1;i<sweep_count;i++) {
  vec4 prior=texelFetch(sweep_rays,ivec2(0,i-1),0),next=texelFetch(sweep_rays,ivec2(0,i),0);
  vec4 a_meta=texelFetch(sweep_rays,ivec2(1,i-1),0),b_meta=texelFetch(sweep_rays,ivec2(1,i),0);
  if (a_meta.y>0.5 && b_meta.y>0.5 && b_meta.z<0.5 && crossed_by(point,prior,next)) return true;
 }
 if (sweep_partial && sweep_count>0) {
  vec4 prior=texelFetch(sweep_rays,ivec2(0,sweep_count-1),0),meta=texelFetch(sweep_rays,ivec2(1,sweep_count-1),0);
  if (meta.y>0.5 && crossed_by(point,prior,sweep_current)) return true;
 }
 return false;
}
vec3 rgb_to_hsv(vec3 c) {
 vec4 K = vec4(0.0,-1.0/3.0,2.0/3.0,-1.0);
 vec4 p = mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g));
 vec4 q = mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r));
 float d=q.x-min(q.w,q.y);
 return vec3(abs(q.z+(q.w-q.y)/(6.0*d+0.0000001)),d/(q.x+0.0000001),q.x);
}
void fragment() {
 vec4 pixel=texture(TEXTURE,UV);
 if (sweep_enabled && !revealed(sticker_grid_point)) pixel.a=0.0;
 vec3 hsv=rgb_to_hsv(pixel.rgb);
 hsv.x=fract(hsv.x+hue_degrees/360.0+1.0);
 hsv.y=clamp(hsv.y*saturation_scale,0.0,1.0);
 vec3 p=abs(fract(hsv.xxx+vec3(0.0,2.0/3.0,1.0/3.0))*6.0-3.0);
 vec3 rgb=hsv.z*mix(vec3(1.0),clamp(p-1.0,0.0,1.0),hsv.y);
 rgb=clamp(mix(rgb,tint_rgb,tint_strength)*brightness_scale,0.0,1.0);
 COLOR=vec4(rgb,pixel.a)*vertex_color;
}
