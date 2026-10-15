(function(g){const rig={
  "type": "geometric_sol_rig",
  "version": 1,
  "presentation_style": "neon_stick",
  "coordinates": "pelvis-relative; x right, y down; root in actor foot-origin coordinates",
  "overall_scale": 1,
  "head_radius": 6,
  "upper_arm_length": 14,
  "lower_arm_length": 15,
  "upper_leg_length": 18,
  "lower_leg_length": 20,
  "limb_thickness": 3.2,
  "scarf_length": 20,
  "scarf_width": 3,
  "colors": {
    "body_fill": "#173563",
    "energy": "#edf1f4",
    "line": "#659cf3",
    "rear": "#38639d",
    "scarf": "#659cf3"
  },
  "neutral_root": [
    0,
    -36
  ],
  "neutral_torso_rotation": 0,
  "weapon_hand": "right",
  "weapon_rotation": 22.9183121467424,
  "joints": {
    "torso": [
      0,
      -22
    ],
    "head": [
      2,
      -33
    ],
    "scarf_root": [
      0,
      -22
    ],
    "weapon_socket": [
      12.9647216796875,
      3.929443359375
    ],
    "left_shoulder": [
      0,
      -22
    ],
    "left_elbow": [
      -4.64482021331787,
      -8.79296875
    ],
    "left_hand": [
      -8.87120628356934,
      5.599306106567401
    ],
    "left_hip": [
      0,
      0
    ],
    "left_knee": [
      0.690397500991821,
      17.9867534637451
    ],
    "left_foot": [
      -8,
      36
    ],
    "right_shoulder": [
      0,
      -22
    ],
    "right_elbow": [
      5.91832113265991,
      -9.312469482421903
    ],
    "right_hand": [
      12.9647216796875,
      3.929443359375
    ],
    "right_hip": [
      0,
      0
    ],
    "right_knee": [
      8.2433385848999,
      16.0014781951904
    ],
    "right_foot": [
      8,
      36
    ]
  },
  "neutral_scarf": {
    "version": 1,
    "visible": false,
    "tails": {
      "a": {
        "points": [
          [
            -6,
            3
          ],
          [
            -12,
            6
          ],
          [
            -18,
            9
          ]
        ],
        "width": 3,
        "layer": "in_front_body"
      },
      "b": {
        "points": [
          [
            -4,
            4
          ],
          [
            -8,
            8
          ],
          [
            -12,
            12
          ]
        ],
        "width": 3,
        "layer": "in_front_body"
      }
    }
  }
};g.SolRuntimeRig=rig;if(typeof module!=="undefined")module.exports=rig;})(typeof window!=="undefined"?window:globalThis);
