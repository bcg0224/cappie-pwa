const KEY = "cappie.v1";
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const LIMB_OPTIONS = [
  { id: "left_hand", label: "Left hand / partial hand", group: "upper" },
  { id: "right_hand", label: "Right hand / partial hand", group: "upper" },
  { id: "left_below_elbow", label: "Left below elbow", group: "upper" },
  { id: "right_below_elbow", label: "Right below elbow", group: "upper" },
  { id: "left_above_elbow", label: "Left above elbow", group: "upper" },
  { id: "right_above_elbow", label: "Right above elbow", group: "upper" },
  { id: "left_below_knee", label: "Left below knee", group: "lower" },
  { id: "right_below_knee", label: "Right below knee", group: "lower" },
  { id: "left_above_knee", label: "Left above knee", group: "lower" },
  { id: "right_above_knee", label: "Right above knee", group: "lower" }
];

const EQUIPMENT_OPTIONS = [
  { id: "gripper", label: "Hand gripper" },
  { id: "pinch_block", label: "Pinch block" },
  { id: "putty", label: "Therapy putty" },
  { id: "loop_band", label: "Loop band" },
  { id: "tube_band", label: "Tube band / straps" },
  { id: "door_anchor", label: "Doorway anchor" },
  { id: "chair", label: "Chair" },
  { id: "mat", label: "Mat / bed" }
];

const THEMES = [
  { id: "clay", label: "Clay" },
  { id: "forest", label: "Forest" },
  { id: "ink", label: "Ink" },
  { id: "dusk", label: "Dusk" }
];

const WALLS = [
  { id: "linen", label: "Linen" },
  { id: "sand", label: "Sand" },
  { id: "slate", label: "Slate" },
  { id: "meadow", label: "Meadow" }
];

const SRC = "Heleen Groenewald · 4 Sep 2026";

const EXERCISES = [
  { id: "crush_grip", name: "Crush grip", category: "grip", tag: "grip", equipment: ["gripper"], position: "either", metric: "reps", defaultSets: 3, defaultValue: 8, cue: "Close the gripper fully. Pause. Open with control.", adaptation: "Use the sound hand, or the residual if you can hold the trainer." },
  { id: "pinch_hold", name: "Pinch hold", category: "grip", tag: "grip", equipment: ["pinch_block"], position: "either", metric: "seconds", defaultSets: 3, defaultValue: 20, cue: "Pinch and hold without shrugging the shoulder.", adaptation: "Shorten the hold if the pinch slips." },
  { id: "putty_squeeze", name: "Putty squeeze", category: "grip", tag: "grip", equipment: ["putty"], position: "seated", metric: "reps", defaultSets: 3, defaultValue: 12, cue: "Press into the putty, then open the hand fully.", adaptation: "Softer putty first. Stop if residual skin blanches." },
  { id: "putty_pinch", name: "Putty pinch", category: "grip", tag: "grip", equipment: ["putty"], position: "seated", metric: "reps", defaultSets: 3, defaultValue: 10, cue: "Thumb to each finger in turn through the putty.", adaptation: "Skip fingers that are not there." },
  { id: "finger_ext", name: "Finger extension band", category: "grip", tag: "grip", equipment: ["loop_band"], position: "seated", metric: "reps", defaultSets: 3, defaultValue: 12, cue: "Light loop over the fingers. Open against the band.", adaptation: "Needs a usable hand." },
  { id: "seated_row", name: "Seated band row", category: "band", tag: "upper", equipment: ["tube_band", "loop_band", "chair"], position: "seated", metric: "reps", defaultSets: 3, defaultValue: 10, cue: "Sit tall. Pull elbows back. Pause. Return slow.", adaptation: "Strap a handle to a residual limb if a grip is not available." },
  { id: "chest_press", name: "Seated chest press", category: "band", tag: "upper", equipment: ["tube_band", "loop_band"], position: "seated", metric: "reps", defaultSets: 3, defaultValue: 10, cue: "Band behind the back or on an anchor. Press forward.", adaptation: "One-arm variant is fine." },
  { id: "ext_rot", name: "Shoulder external rotation", category: "band", tag: "upper", equipment: ["loop_band", "tube_band"], position: "seated", metric: "reps", defaultSets: 3, defaultValue: 12, cue: "Elbow at the side. Rotate the forearm out. Light band.", adaptation: "Do the sound side if needed." },
  { id: "pull_apart", name: "Band pull-apart", category: "band", tag: "upper", equipment: ["loop_band", "tube_band"], position: "seated", metric: "reps", defaultSets: 3, defaultValue: 12, cue: "Arms long. Pull the band apart until it meets the chest line.", adaptation: "Loop around residual limb and sound hand." },
  { id: "hip_abd", name: "Hip abduction (band)", category: "band", tag: "lower", equipment: ["loop_band"], position: "either", metric: "reps", defaultSets: 3, defaultValue: 10, cue: "Loop above the knees or residual limb. Press out.", adaptation: "Seated first." },
  { id: "hip_ext", name: "Hip extension (band)", category: "band", tag: "lower", equipment: ["tube_band", "door_anchor"], position: "standing", metric: "reps", defaultSets: 3, defaultValue: 10, cue: "Anchor in front. Press the limb back without arching.", adaptation: "Hold a chair if you need it." },
  { id: "core_twist", name: "Seated core twist", category: "band", tag: "general", equipment: ["chair"], position: "seated", metric: "reps", defaultSets: 3, defaultValue: 8, cue: "Hands at the chest. Rotate from the ribs, not the neck.", adaptation: "Add a light band if you have one." },
  { id: "residual_iso", name: "Residual-limb isometric", category: "band", tag: "general", equipment: ["tube_band", "loop_band"], position: "seated", metric: "seconds", defaultSets: 3, defaultValue: 15, cue: "Press the residual limb into a band or stable object. Hold.", adaptation: "Intensity comes from your clinician. Stop on sharp pain." },

  { id: "ankle_pumps", name: "Ankle pumps", category: "bka", tag: "bka", equipment: ["mat"], position: "lying", metric: "reps", defaultSets: 2, defaultValue: 15, source: SRC, cue: "On your back. Point the sound foot up, then down.", adaptation: "Sound side only if the residual has no ankle." },
  { id: "quad_iso", name: "Quadriceps isometric", category: "bka", tag: "bka", equipment: ["mat"], position: "lying", metric: "seconds", defaultSets: 3, defaultValue: 8, source: SRC, cue: "On your back. Support the residual with a pillow. Press the back of the knee down toward the floor.", adaptation: "Stop if the residual blanches or stings." },
  { id: "knee_ext_arom", name: "Knee extension AROM", category: "bka", tag: "bka", equipment: ["mat"], position: "lying", metric: "reps", defaultSets: 2, defaultValue: 10, source: SRC, cue: "On your back. Support the residual as shown. Straighten the knee.", adaptation: "Small range first." },
  { id: "supine_crunch", name: "Supine crunch, hands to knees", category: "bka", tag: "bka", equipment: ["mat"], position: "lying", metric: "reps", defaultSets: 2, defaultValue: 8, source: SRC, cue: "On your back, hands at the knees. Crunch and reach toward the knees.", adaptation: "Keep the neck long." },
  { id: "oblique_crunch", name: "Oblique crunch", category: "bka", tag: "bka", equipment: ["mat"], position: "lying", metric: "reps", defaultSets: 2, defaultValue: 8, source: SRC, cue: "On your back, sound leg bent, hands to head. Crunch and twist, elbow toward knee.", adaptation: "Move from the ribs." },
  { id: "dead_bug", name: "Dead bug", category: "bka", tag: "bka", equipment: ["mat"], position: "lying", metric: "reps", defaultSets: 2, defaultValue: 8, source: SRC, cue: "On your back, legs and arms up. Lower one leg and the opposite arm. Alternate sides.", adaptation: "Keep the low back quiet." },
  { id: "hamstring_stretch", name: "Hamstring stretch", category: "bka", tag: "bka", equipment: ["mat"], position: "lying", metric: "seconds", defaultSets: 2, defaultValue: 20, source: SRC, cue: "On your back, both limbs long. Draw the sound leg up until you feel a stretch. Pointing the toe toward the floor increases it. Keep the residual flat on the bed.", adaptation: "Do not bounce." },
  { id: "prone_elbows", name: "Prone on elbows", category: "bka", tag: "bka", equipment: ["mat"], position: "lying", metric: "seconds", defaultSets: 2, defaultValue: 20, source: SRC, cue: "Lie on your front, propped on the elbows.", adaptation: "Come down if the residual protests." },
  { id: "hip_ext_arom", name: "Hip extension AROM", category: "bka", tag: "bka", equipment: ["mat"], position: "lying", metric: "reps", defaultSets: 2, defaultValue: 10, source: SRC, cue: "On your front. Support the residual. Lift it straight up.", adaptation: "Small lift. No low-back pinch." },
  { id: "hip_ext_bent", name: "Hip extension, bent knee", category: "bka", tag: "bka", equipment: ["mat"], position: "lying", metric: "reps", defaultSets: 2, defaultValue: 8, source: SRC, cue: "On your stomach, knee bent. Lead with the heel and lift. Higher only if you stay in control.", adaptation: "Stop on sharp pain." },
  { id: "bridge_sound", name: "Bridge, sound leg", category: "bka", tag: "bka", equipment: ["mat"], position: "lying", metric: "reps", defaultSets: 2, defaultValue: 8, source: SRC, cue: "On your back, sound leg bent, foot flat. Lift the hips into a bridge.", adaptation: "Press through the sound heel." },
  { id: "bridge_band", name: "Bridge, arms at side (band)", category: "bka", tag: "bka", equipment: ["loop_band", "mat"], position: "lying", metric: "reps", defaultSets: 2, defaultValue: 8, source: SRC, cue: "Band as shown. On your back, sound leg bent. Lift the hips.", adaptation: "Light band first." },
  { id: "hip_abd_supine", name: "Hip abduction, on back", category: "bka", tag: "bka", equipment: ["mat"], position: "lying", metric: "reps", defaultSets: 2, defaultValue: 10, source: SRC, cue: "Flat on your back. Lift the residual straight out to the side.", adaptation: "Keep the pelvis still." },
  { id: "hip_abd_band_lie", name: "Hip abduction (band, lying)", category: "bka", tag: "bka", equipment: ["loop_band", "mat"], position: "lying", metric: "reps", defaultSets: 2, defaultValue: 10, source: SRC, cue: "Band on as shown. Flat on your back. Lift the residual out against the band.", adaptation: "Stop if the residual skin rolls." },
  { id: "hip_add_iso", name: "Hip adduction isometric", category: "bka", tag: "bka", equipment: ["mat"], position: "seated", metric: "seconds", defaultSets: 3, defaultValue: 8, source: SRC, cue: "Sit with legs long. Towel between the thighs. Press the legs together.", adaptation: "Gentle press." },
  { id: "sidelying", name: "Sidelying", category: "bka", tag: "bka", equipment: ["mat"], position: "lying", metric: "seconds", defaultSets: 2, defaultValue: 30, source: SRC, cue: "Lie on your side. Breathe. Change sides if it is a hold.", adaptation: "Pillow between limbs if needed." },
  { id: "hip_abd_arom", name: "Hip abduction AROM", category: "bka", tag: "bka", equipment: ["mat"], position: "lying", metric: "reps", defaultSets: 2, defaultValue: 10, source: SRC, cue: "Lie on your side. Lift the residual straight up.", adaptation: "Do not roll the pelvis back." },
  { id: "hip_flex_ext_arom", name: "Hip flexion + extension AROM", category: "bka", tag: "bka", equipment: ["mat"], position: "lying", metric: "reps", defaultSets: 2, defaultValue: 8, source: SRC, cue: "Lie on your side. Send the residual forward, then press it straight back.", adaptation: "Slow. Stay on your side." },
  { id: "prone_lying", name: "Prone lying", category: "bka", tag: "bka", equipment: ["mat"], position: "lying", metric: "seconds", defaultSets: 1, defaultValue: 60, source: SRC, cue: "Lie on your front. Quiet breathing.", adaptation: "Come off if the residual throbs." },
  { id: "lie_to_sit", name: "Transfer, lie to sit", category: "bka", tag: "bka", equipment: ["mat"], position: "lying", metric: "reps", defaultSets: 2, defaultValue: 4, source: SRC, cue: "Start in lying. Roll onto your side. Come up onto an elbow. Press up with the arms.", adaptation: "Use the sound side to help." },
  { id: "chair_dip", name: "Chair dip", category: "bka", tag: "bka", equipment: ["chair"], position: "seated", metric: "reps", defaultSets: 2, defaultValue: 6, source: SRC, cue: "Hold the armrests. Press and lift yourself above the chair.", adaptation: "Feet stay light. Skip if the shoulders complain." },
  { id: "trunk_rot_seated", name: "Lower trunk rotation", category: "bka", tag: "bka", equipment: ["chair"], position: "seated", metric: "reps", defaultSets: 2, defaultValue: 8, source: SRC, cue: "Sit tall, arms crossed. Twist to one side, then the other.", adaptation: "Use the arms to pull a little further only if it stays easy." },
  { id: "lateral_shift", name: "Lateral weight shift", category: "bka", tag: "bka", equipment: ["chair"], position: "seated", metric: "reps", defaultSets: 2, defaultValue: 8, source: SRC, cue: "Sit tall. Lean to one side, then the other.", adaptation: "Keep both sit-bones honest." },
  { id: "chair_reach", name: "Balance, lateral reach", category: "bka", tag: "bka", equipment: ["chair"], position: "seated", metric: "reps", defaultSets: 2, defaultValue: 8, source: SRC, cue: "Sit in the chair. Reach to one side, then the other.", adaptation: "Hold the chair if you need it." },
  { id: "trunk_flex_stretch", name: "Trunk forward flexion stretch", category: "bka", tag: "bka", equipment: ["chair"], position: "seated", metric: "seconds", defaultSets: 2, defaultValue: 20, source: SRC, cue: "Sit in the chair. Hang the trunk toward the ground.", adaptation: "Come up slow." },
  { id: "trunk_side_stretch", name: "Trunk side flexion stretch", category: "bka", tag: "bka", equipment: ["chair"], position: "seated", metric: "seconds", defaultSets: 2, defaultValue: 15, source: SRC, cue: "Sit in the chair. Hang the trunk toward the ground and to one side. Change sides.", adaptation: "No pain into the residual." },
  { id: "hip_flex_ext_stand", name: "Hip flexion + extension, supported", category: "bka", tag: "bka", equipment: ["chair"], position: "standing", metric: "reps", defaultSets: 2, defaultValue: 8, source: SRC, cue: "Stand on the sound leg. Hold the chair. Lift the residual forward, then swing it straight back.", adaptation: "Small range. Stay tall." },
  { id: "hip_abd_stand", name: "Hip abduction, supported", category: "bka", tag: "bka", equipment: ["chair"], position: "standing", metric: "reps", defaultSets: 2, defaultValue: 8, source: SRC, cue: "Stand on the sound leg. Hold the chair. Lift the residual straight out to the side.", adaptation: "Do not lean the trunk away." },
  { id: "sit_to_stand", name: "Sit to stand (table)", category: "bka", tag: "bka", equipment: ["chair"], position: "seated", metric: "reps", defaultSets: 2, defaultValue: 6, source: SRC, cue: "Scoot forward. Hands on the table. Lean the trunk a little forward, knees over toes, stand.", adaptation: "Use the table. Sit back with control." }
];

const SKIP = [
  { id: "pain", label: "Pain" },
  { id: "fatigue", label: "Fatigue" },
  { id: "no_kit", label: "No kit" },
  { id: "time", label: "No time" },
  { id: "other", label: "Other" }
];

export { KEY, DAYS, LIMB_OPTIONS, EQUIPMENT_OPTIONS, THEMES, WALLS, EXERCISES, SKIP };
