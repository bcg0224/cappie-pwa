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
  { id: "chair", label: "Chair" }
];

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
  { id: "hip_abd", name: "Hip abduction", category: "band", tag: "lower", equipment: ["loop_band"], position: "either", metric: "reps", defaultSets: 3, defaultValue: 10, cue: "Loop above the knees or residual limb. Press out.", adaptation: "Seated first." },
  { id: "hip_ext", name: "Hip extension", category: "band", tag: "lower", equipment: ["tube_band", "door_anchor"], position: "standing", metric: "reps", defaultSets: 3, defaultValue: 10, cue: "Anchor in front. Press the limb back without arching.", adaptation: "Hold a chair if you need it." },
  { id: "core_twist", name: "Seated core twist", category: "band", tag: "general", equipment: ["chair"], position: "seated", metric: "reps", defaultSets: 3, defaultValue: 8, cue: "Hands at the chest. Rotate from the ribs, not the neck.", adaptation: "Add a light band if you have one." },
  { id: "residual_iso", name: "Residual-limb isometric", category: "band", tag: "general", equipment: ["tube_band", "loop_band"], position: "seated", metric: "seconds", defaultSets: 3, defaultValue: 15, cue: "Press the residual limb into a band or stable object. Hold.", adaptation: "Intensity comes from your clinician. Stop on sharp pain." }
];

const SKIP = [
  { id: "pain", label: "Pain" },
  { id: "fatigue", label: "Fatigue" },
  { id: "no_kit", label: "No kit" },
  { id: "time", label: "No time" },
  { id: "other", label: "Other" }
];

export { KEY, DAYS, LIMB_OPTIONS, EQUIPMENT_OPTIONS, EXERCISES, SKIP };
