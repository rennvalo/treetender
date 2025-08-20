// List of random tree events for TreeTender
// Each event has: name, description, emoji, health_impact ('positive'|'negative'), and optional modifiers

module.exports = [
  {
    name: 'Thunderstorm',
    description: 'A thunderstorm rolls through, shaking the tree but watering its roots.',
    emoji: '⛈️',
    health_impact: 'negative',
    water_modifier: 2,
    sunlight_modifier: -1
  },
  {
    name: 'Hailstorm',
    description: 'Hail pelts the leaves, causing some damage.',
    emoji: '🌨️',
    health_impact: 'negative',
    water_modifier: 1,
    sunlight_modifier: -2
  },
  {
    name: 'Sunshine',
    description: 'A beautiful sunny day boosts growth.',
    emoji: '☀️',
    health_impact: 'positive',
    sunlight_modifier: 2
  },
  {
    name: 'Fair Weather',
    description: 'Mild weather helps the tree thrive.',
    emoji: '🌤️',
    health_impact: 'positive',
    sunlight_modifier: 1,
    water_modifier: 1
  },
  {
    name: 'Snowstorm',
    description: 'Heavy snow weighs down the branches.',
    emoji: '❄️',
    health_impact: 'negative',
    sunlight_modifier: -2,
    water_modifier: 1
  },
  {
    name: 'Gentle Rain',
    description: 'A gentle rain nourishes the tree.',
    emoji: '🌧️',
    health_impact: 'positive',
    water_modifier: 2
  },
  {
    name: 'Windy Day',
    description: 'Strong winds test the tree’s strength.',
    emoji: '💨',
    health_impact: 'negative',
    love_modifier: -1
  },
  {
    name: 'Pollinators Arrive',
    description: 'Bees and butterflies help the tree flourish.',
    emoji: '🦋',
    health_impact: 'positive',
    love_modifier: 2
  },
  {
    name: 'Drought',
    description: 'A dry spell stresses the tree.',
    emoji: '🌵',
    health_impact: 'negative',
    water_modifier: -2
  },
  {
    name: 'Fertilizer Added',
    description: 'Nutrients boost the tree’s growth.',
    emoji: '🌱',
    health_impact: 'positive',
    feed_modifier: 2
  },
  {
    name: 'Fungal Infection',
    description: 'Fungi attack the roots, slowing growth.',
    emoji: '🍄',
    health_impact: 'negative',
    feed_modifier: -2
  },
  {
    name: 'Birds Nest',
    description: 'Birds nest in the branches, bringing joy.',
    emoji: '🐦',
    health_impact: 'positive',
    love_modifier: 1
  },
  {
    name: 'Lightning Strike',
    description: 'Lightning damages the tree.',
    emoji: '⚡',
    health_impact: 'negative',
    love_modifier: -2
  },
  {
    name: 'Early Spring',
    description: 'Warm weather arrives early, boosting growth.',
    emoji: '🌸',
    health_impact: 'positive',
    sunlight_modifier: 2
  },
  {
    name: 'Late Frost',
    description: 'A late frost damages new leaves.',
    emoji: '🥶',
    health_impact: 'negative',
    sunlight_modifier: -2
  },
  {
    name: 'Animal Visit',
    description: 'A friendly animal visits the tree.',
    emoji: '🦌',
    health_impact: 'positive',
    love_modifier: 1
  },
  {
    name: 'Insect Infestation',
    description: 'Insects eat the leaves.',
    emoji: '🐛',
    health_impact: 'negative',
    feed_modifier: -1
  },
  {
    name: 'Community Care',
    description: 'People care for the tree, boosting its health.',
    emoji: '🤲',
    health_impact: 'positive',
    love_modifier: 2
  },
  {
    name: 'Heatwave',
    description: 'Extreme heat stresses the tree.',
    emoji: '🔥',
    health_impact: 'negative',
    water_modifier: -2,
    sunlight_modifier: 2
  },
  {
    name: 'Perfect Day',
    description: 'Everything is just right for growth.',
    emoji: '🌈',
    health_impact: 'positive',
    water_modifier: 1,
    sunlight_modifier: 1,
    feed_modifier: 1,
    love_modifier: 1

  },
  // --- Neutral Events ---
  {
    name: 'Cloud Watching',
    description: 'The tree enjoys watching clouds drift by.',
    emoji: '☁️',
    health_impact: 'neutral'
  },
  {
    name: 'Morning Dew',
    description: 'Dew settles on the leaves in the early morning.',
    emoji: '💧',
    health_impact: 'neutral'
  },
  {
    name: 'Bird Song',
    description: 'Birds sing nearby, creating a peaceful atmosphere.',
    emoji: '🎶',
    health_impact: 'neutral'
  },
  {
    name: 'Passing Breeze',
    description: 'A gentle breeze passes through the branches.',
    emoji: '🌬️',
    health_impact: 'neutral'
  },
  {
    name: 'Moonlight',
    description: 'The tree is bathed in soft moonlight.',
    emoji: '🌙',
    health_impact: 'neutral'
  },
  {
    name: 'Starry Night',
    description: 'Stars twinkle above the tree.',
    emoji: '⭐',
    health_impact: 'neutral'
  },
  {
    name: 'Butterfly Landing',
    description: 'A butterfly lands gently on a leaf.',
    emoji: '🦋',
    health_impact: 'neutral'
  },
  {
    name: 'Squirrel Visit',
    description: 'A squirrel scurries by without disturbing the tree.',
    emoji: '🐿️',
    health_impact: 'neutral'
  },
  {
    name: 'Rainy Afternoon',
    description: 'A light rain falls, but the tree is unaffected.',
    emoji: '🌦️',
    health_impact: 'neutral'
  },
  {
    name: 'Sunset Glow',
    description: 'The tree glows in the light of the setting sun.',
    emoji: '🌇',
    health_impact: 'neutral'
  },
  {
    name: 'Foggy Morning',
    description: 'Fog surrounds the tree, creating a mysterious scene.',
    emoji: '🌫️',
    health_impact: 'neutral'
  },
  {
    name: 'Leaf Flutter',
    description: 'Leaves flutter gently in the wind.',
    emoji: '🍃',
    health_impact: 'neutral'
  },
  {
    name: 'Busy Ants',
    description: 'Ants march along the roots, minding their own business.',
    emoji: '🐜',
    health_impact: 'neutral'
  },
  {
    name: 'Rainbow Overhead',
    description: 'A rainbow appears overhead, brightening the day.',
    emoji: '🌈',
    health_impact: 'neutral'
  },
  {
    name: 'Neighboring Tree',
    description: 'A nearby tree sways in harmony.',
    emoji: '🌳',
    health_impact: 'neutral'
  },
  {
    name: 'Ladybug Rest',
    description: 'A ladybug rests on a leaf for a moment.',
    emoji: '🐞',
    health_impact: 'neutral'
  },
  {
    name: 'Cool Shade',
    description: 'The tree provides cool shade to the ground below.',
    emoji: '🌴',
    health_impact: 'neutral'
  },
  {
    name: 'Quiet Afternoon',
    description: 'A quiet afternoon passes peacefully.',
    emoji: '🕊️',
    health_impact: 'neutral'
  },
  {
    name: 'Spider Web',
    description: 'A spider spins a web between branches.',
    emoji: '🕸️',
    health_impact: 'neutral'
  },
  {
    name: 'Falling Leaf',
    description: 'A single leaf falls to the ground.',
    emoji: '🍂',
    health_impact: 'neutral'
  },
  {
    name: 'Drifting Pollen',
    description: 'Pollen drifts by on the wind.',
    emoji: '🌾',
    health_impact: 'neutral'
  }
];
