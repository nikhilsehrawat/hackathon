/**
 * scripts/seedData.ts — Deterministic seed dataset: 15 creators, 5 briefs.
 * Shared by scripts/seed.ts (CLI) and app/api/seed/route.ts (POST /api/seed).
 */
import type { VerificationSignalType } from "../lib/types";

export interface SeedPortfolio {
  title: string;
  media_type: "image" | "video";
  description: string;
  content_type: string;
  style: string;
  tools: string[];
  industry: string;
  aspect_ratio: string;
  duration_seconds: number | null;
  commercial_use: string;
  workflow_notes: string;
}

export interface SeedCreator {
  email: string;
  display_name: string;
  bio: string;
  location: string;
  years_experience: number;
  hourly_rate: number;
  availability: string;
  skills: Array<[string, number]>; // [skill, proficiency]
  tools: Array<[string, number, boolean]>; // [tool, proficiency, verified]
  specializations: string[];
  portfolios: SeedPortfolio[];
  signals: VerificationSignalType[];
}

export interface SeedBrief {
  company: string;
  raw_input: string;
  campaign_objective: string;
  content_type: string;
  style: string;
  duration: string;
  platform: string;
  aspect_ratio: string;
  target_audience: string;
  visual_direction: string;
  required_tools: string[];
  commercial_usage: string;
  deliverables: string[];
  constraints: string[];
}

const P = (p: Omit<SeedPortfolio, "media_type"> & { media_type?: "image" | "video" }): SeedPortfolio => ({
  media_type: "video",
  ...p,
});

export const SEED_CREATORS: SeedCreator[] = [
  {
    email: "aria@promptfolio.demo",
    display_name: "Aria Chen",
    bio: "Cinematic AI filmmaker specializing in premium product ads.",
    location: "Los Angeles, CA",
    years_experience: 6,
    hourly_rate: 150,
    availability: "Available",
    skills: [["AI video generation", 5], ["Prompt engineering", 5], ["Color grading", 4], ["Motion design", 4]],
    tools: [["Runway Gen-3", 5, true], ["Midjourney v6", 5, true], ["After Effects", 4, false], ["Topaz Video AI", 4, false]],
    specializations: ["Product advertisements", "Fashion campaigns", "Cinematic shorts"],
    portfolios: [
      P({ title: "Nike Air Max Cinematic", description: "Moody urban sneaker launch film.", content_type: "Product ad", style: "Cinematic, moody, urban", tools: ["Runway Gen-3", "Midjourney v6"], industry: "Fashion", aspect_ratio: "9:16", duration_seconds: 30, commercial_use: "Full commercial rights, paid media", workflow_notes: "Midjourney keyframes -> Runway img2vid -> Topaz upscale -> AE grade" }),
      P({ title: "Lumen Perfume Launch", description: "Slow-motion product hero spots.", content_type: "Video ad", style: "Cinematic, premium, dramatic lighting", tools: ["Runway Gen-3", "After Effects"], industry: "Beauty", aspect_ratio: "16:9", duration_seconds: 20, commercial_use: "Full commercial rights", workflow_notes: "Runway text2vid -> AE comp -> sound design" }),
    ],
    signals: ["tool", "workflow", "portfolio", "rights"],
  },
  {
    email: "marcus@promptfolio.demo",
    display_name: "Marcus Webb",
    bio: "UGC-style AI creator producing authentic-feeling social ads at volume.",
    location: "Austin, TX",
    years_experience: 4,
    hourly_rate: 85,
    availability: "Available",
    skills: [["UGC production", 5], ["AI video generation", 4], ["Creative storytelling", 4], ["Editing & post-production", 4]],
    tools: [["Captions.ai", 4, false], ["Runway Gen-3", 4, true], ["ElevenLabs", 5, false], ["CapCut", 3, false]],
    specializations: ["UGC ads", "Direct response video", "Brand storytelling"],
    portfolios: [
      P({ title: "Gymshark Creator Series", description: "12 UGC-style fitness clips.", content_type: "UGC-style video", style: "Authentic, energetic, handheld", tools: ["Runway Gen-3", "ElevenLabs"], industry: "Fitness", aspect_ratio: "9:16", duration_seconds: 25, commercial_use: "Full commercial rights, paid media", workflow_notes: "Persona prompts -> Runway -> ElevenLabs VO -> CapCut edit" }),
      P({ title: "MealKit Hook Tests", description: "Hook A/B battery for DTC meals.", content_type: "UGC-style video", style: "Bright, playful, high-energy", tools: ["Captions.ai"], industry: "Food & beverage", aspect_ratio: "9:16", duration_seconds: 15, commercial_use: "Commercial use (organic)", workflow_notes: "Script matrix -> avatar delivery -> hook variants" }),
    ],
    signals: ["tool", "portfolio", "workflow"],
  },
  {
    email: "sofia@promptfolio.demo",
    display_name: "Sofia Reyes",
    bio: "Fashion & virtual-modeling specialist with editorial-grade AI imagery.",
    location: "Mexico City, MX",
    years_experience: 5,
    hourly_rate: 110,
    availability: "Limited",
    skills: [["AI image generation", 5], ["Fashion & virtual modeling", 5], ["Prompt engineering", 4], ["Color grading", 3]],
    tools: [["Midjourney v6", 5, true], ["Stable Diffusion XL", 4, false], ["Photoshop", 4, false], ["ComfyUI", 4, true]],
    specializations: ["Fashion campaigns", "Lookbooks", "Editorial imagery"],
    portfolios: [
      P({ title: "Vera Lux Lookbook", description: "Virtual model SS25 collection.", content_type: "Image set", style: "Editorial, minimal, clean", tools: ["Midjourney v6", "Photoshop"], industry: "Fashion", aspect_ratio: "4:5", duration_seconds: null, commercial_use: "Full commercial rights", workflow_notes: "MJ style-consistent characters -> PS retouch -> grid export", media_type: "image" }),
      P({ title: "Neon District Editorial", description: "Cyberpunk fashion story.", content_type: "Image set", style: "Moody, neon, cinematic", tools: ["Midjourney v6", "ComfyUI"], industry: "Fashion", aspect_ratio: "1:1", duration_seconds: null, commercial_use: "Social media use", workflow_notes: "Comfy inpainting loops -> MJ upscale", media_type: "image" }),
    ],
    signals: ["tool", "portfolio", "rights"],
  },
  {
    email: "david@promptfolio.demo",
    display_name: "David Kim",
    bio: "Tech-product filmmaker: launch films, feature tours, and demo ads.",
    location: "San Francisco, CA",
    years_experience: 7,
    hourly_rate: 160,
    availability: "Booked",
    skills: [["AI video generation", 5], ["Product visualization", 5], ["Motion design", 4], ["Editing & post-production", 5]],
    tools: [["Runway Gen-3", 5, true], ["Sora", 4, false], ["After Effects", 5, true], ["Blender", 3, false]],
    specializations: ["Product advertisements", "Tech launch films", "SaaS demos"],
    portfolios: [
      P({ title: "Aura Buds Pro Launch", description: "Hero film for TWS earbuds.", content_type: "Video ad", style: "Sleek, futuristic, premium", tools: ["Runway Gen-3", "After Effects"], industry: "Consumer electronics", aspect_ratio: "16:9", duration_seconds: 45, commercial_use: "Full commercial rights, paid media", workflow_notes: "Blender turntable -> Runway env plates -> AE comp" }),
      P({ title: "FinFlow Feature Tour", description: "Animated product tour.", content_type: "Video ad", style: "Minimal, clean, modern", tools: ["After Effects"], industry: "SaaS", aspect_ratio: "16:9", duration_seconds: 60, commercial_use: "Full commercial rights", workflow_notes: "UI mockups -> AE rig -> Runway transitions" }),
    ],
    signals: ["tool", "workflow", "portfolio", "rights"],
  },
  {
    email: "lena@promptfolio.demo",
    display_name: "Lena Petrova",
    bio: "Beauty & skincare content: macro textures, glow-first cinematography.",
    location: "Berlin, DE",
    years_experience: 3,
    hourly_rate: 90,
    availability: "Available",
    skills: [["AI video generation", 4], ["Product visualization", 4], ["Color grading", 5], ["UGC production", 3]],
    tools: [["Midjourney v6", 4, false], ["Runway Gen-3", 4, true], ["DaVinci Resolve", 4, false]],
    specializations: ["Beauty campaigns", "Skincare ads", "Cosmetics launches"],
    portfolios: [
      P({ title: "GlowSerum Macro Film", description: "Texture-forward serum ad.", content_type: "Product ad", style: "Luminous, soft, premium", tools: ["Runway Gen-3", "Midjourney v6"], industry: "Beauty", aspect_ratio: "9:16", duration_seconds: 20, commercial_use: "Full commercial rights", workflow_notes: "MJ macro stills -> Runway push-ins -> Resolve grade" }),
      P({ title: "Velvet Lip Story", description: "UGC-meets-editorial lip launch.", content_type: "UGC-style video", style: "Warm, authentic, playful", tools: ["Runway Gen-3"], industry: "Beauty", aspect_ratio: "9:16", duration_seconds: 25, commercial_use: "Social media use", workflow_notes: "Avatar try-on sim -> quick cuts" }),
    ],
    signals: ["tool", "portfolio"],
  },
  {
    email: "omar@promptfolio.demo",
    display_name: "Omar Haddad",
    bio: "Food & beverage motion artist — appetite appeal through AI motion.",
    location: "Dubai, AE",
    years_experience: 5,
    hourly_rate: 100,
    availability: "Available",
    skills: [["Motion design", 5], ["AI video generation", 4], ["AI image generation", 4], ["Editing & post-production", 3]],
    tools: [["Midjourney v6", 5, false], ["Runway Gen-3", 4, false], ["Cinema 4D", 4, true]],
    specializations: ["Food & beverage ads", "Menu launches", "Restaurant promos"],
    portfolios: [
      P({ title: "BrewCraft Cold Foam", description: "Physics-defying pour film.", content_type: "Video ad", style: "Vibrant, appetizing, high-energy", tools: ["Midjourney v6", "Runway Gen-3"], industry: "Food & beverage", aspect_ratio: "9:16", duration_seconds: 15, commercial_use: "Full commercial rights, paid media", workflow_notes: "MJ ingredient stills -> Runway fluid motion -> C4D logo" }),
      P({ title: "Saffron House Menu", description: "Static menu hero images.", content_type: "Image set", style: "Warm, editorial, minimal", tools: ["Midjourney v6"], industry: "Food & beverage", aspect_ratio: "4:5", duration_seconds: null, commercial_use: "Commercial use (organic)", workflow_notes: "Style-ref chains -> batch select", media_type: "image" }),
    ],
    signals: ["workflow", "portfolio"],
  },
  {
    email: "grace@promptfolio.demo",
    display_name: "Grace Liu",
    bio: "Music-video-grade AI visuals and surreal artist content.",
    location: "Toronto, CA",
    years_experience: 4,
    hourly_rate: 120,
    availability: "Limited",
    skills: [["AI video generation", 5], ["Creative storytelling", 5], ["Motion design", 4], ["Character & avatar design", 4]],
    tools: [["Sora", 5, false], ["Runway Gen-3", 4, true], ["Kling", 4, false], ["After Effects", 3, false]],
    specializations: ["Music videos", "Artist visuals", "Cinematic shorts"],
    portfolios: [
      P({ title: "Nocturne EP Visualizer", description: "Full-track surreal visualizer.", content_type: "Video ad", style: "Surreal, dreamlike, cinematic", tools: ["Sora", "Runway Gen-3"], industry: "Entertainment", aspect_ratio: "16:9", duration_seconds: 180, commercial_use: "Social media use", workflow_notes: "Sora scene chain -> beat-synced cuts" }),
      P({ title: "Chrome Bloom Teaser", description: "Vertical single teaser.", content_type: "Video ad", style: "Neon, moody, urban", tools: ["Kling", "After Effects"], industry: "Entertainment", aspect_ratio: "9:16", duration_seconds: 30, commercial_use: "Full commercial rights", workflow_notes: "Kling img2vid -> AE glow pass" }),
    ],
    signals: ["tool", "portfolio", "workflow"],
  },
  {
    email: "ethan@promptfolio.demo",
    display_name: "Ethan Brooks",
    bio: "Performance marketer turned AI creative — hooks, cutdowns, iteration.",
    location: "London, UK",
    years_experience: 6,
    hourly_rate: 95,
    availability: "Available",
    skills: [["UGC production", 4], ["Editing & post-production", 5], ["Creative storytelling", 4], ["AI video generation", 3]],
    tools: [["CapCut", 4, false], ["Runway Gen-3", 3, false], ["ElevenLabs", 4, false], ["Meta Ads suite", 5, true]],
    specializations: ["Direct response video", "Paid social creative", "Promotional conversion"],
    portfolios: [
      P({ title: "StrideCo Sale Engine", description: "30 cutdowns from one master.", content_type: "Video ad", style: "Punchy, bright, high-energy", tools: ["Runway Gen-3", "CapCut"], industry: "Retail", aspect_ratio: "9:16", duration_seconds: 15, commercial_use: "Full commercial rights, paid media", workflow_notes: "Master -> variant matrix -> auto-captions" }),
      P({ title: "HomeGadget Promo Set", description: "TikTok promo battery.", content_type: "UGC-style video", style: "Authentic, playful, fast", tools: ["CapCut", "ElevenLabs"], industry: "Consumer electronics", aspect_ratio: "9:16", duration_seconds: 20, commercial_use: "Commercial use (organic)", workflow_notes: "Hook bank -> avatar reads -> stitch" }),
    ],
    signals: ["portfolio", "rights", "workflow"],
  },
  {
    email: "priya@promptfolio.demo",
    display_name: "Priya Sharma",
    bio: "Luxury & jewelry brand storyteller with painterly AI aesthetics.",
    location: "Mumbai, IN",
    years_experience: 8,
    hourly_rate: 175,
    availability: "Limited",
    skills: [["AI image generation", 5], ["Creative storytelling", 5], ["Fashion & virtual modeling", 4], ["Color grading", 4]],
    tools: [["Midjourney v6", 5, true], ["Flux", 4, false], ["Photoshop", 5, true]],
    specializations: ["Luxury campaigns", "Jewelry ads", "Heritage storytelling"],
    portfolios: [
      P({ title: "Aurum Heritage Film", description: "Painterly jewelry narrative.", content_type: "Video ad", style: "Opulent, warm, cinematic", tools: ["Midjourney v6", "Runway Gen-3"], industry: "Jewelry", aspect_ratio: "16:9", duration_seconds: 40, commercial_use: "Full commercial rights", workflow_notes: "MJ painter frames -> subtle Runway motion -> PS finish", media_type: "video" }),
      P({ title: "Silk Route Campaign", description: "Saree house global OOH set.", content_type: "Image set", style: "Editorial, luxurious, minimal", tools: ["Midjourney v6", "Flux"], industry: "Fashion", aspect_ratio: "4:5", duration_seconds: null, commercial_use: "Full commercial rights, paid media", workflow_notes: "Consistent character seeds -> OOH crops", media_type: "image" }),
    ],
    signals: ["tool", "workflow", "portfolio", "rights"],
  },
  {
    email: "noah@promptfolio.demo",
    display_name: "Noah Fischer",
    bio: "Automotive & travel AI filmmaker — speed, landscape, scale.",
    location: "Munich, DE",
    years_experience: 5,
    hourly_rate: 130,
    availability: "Available",
    skills: [["AI video generation", 5], ["Color grading", 4], ["Motion design", 3], ["Upscaling & enhancement", 4]],
    tools: [["Runway Gen-3", 5, true], ["Sora", 4, false], ["Topaz Video AI", 5, false], ["Premiere Pro", 4, false]],
    specializations: ["Automotive ads", "Travel campaigns", "Cinematic shorts"],
    portfolios: [
      P({ title: "EV Range Odyssey", description: "Coastal drive hero film.", content_type: "Video ad", style: "Cinematic, expansive, golden hour", tools: ["Sora", "Topaz Video AI"], industry: "Automotive", aspect_ratio: "16:9", duration_seconds: 60, commercial_use: "Full commercial rights, paid media", workflow_notes: "Sora driving plates -> Topaz 4K -> Premiere assembly" }),
      P({ title: "Alpine Escape Reel", description: "Vertical travel teaser.", content_type: "Video ad", style: "Crisp, bright, adventurous", tools: ["Runway Gen-3"], industry: "Travel", aspect_ratio: "9:16", duration_seconds: 20, commercial_use: "Social media use", workflow_notes: "Runway drone-style shots -> speed ramps" }),
    ],
    signals: ["tool", "portfolio", "workflow"],
  },
  {
    email: "mia@promptfolio.demo",
    display_name: "Mia Johansson",
    bio: "Nordic-minimal product photographer pivoting fully to AI stills.",
    location: "Stockholm, SE",
    years_experience: 6,
    hourly_rate: 105,
    availability: "Available",
    skills: [["AI image generation", 5], ["Product visualization", 5], ["Editing & post-production", 4]],
    tools: [["Flux", 5, true], ["Midjourney v6", 4, false], ["Photoshop", 5, false]],
    specializations: ["Product photography", "Packshots", "Home & lifestyle"],
    portfolios: [
      P({ title: "Fjord Furniture Catalog", description: "Studio + lifestyle furniture set.", content_type: "Image set", style: "Minimal, clean, modern", tools: ["Flux", "Photoshop"], industry: "Home & living", aspect_ratio: "1:1", duration_seconds: null, commercial_use: "Full commercial rights", workflow_notes: "Flux studio relight -> lifestyle room comps", media_type: "image" }),
      P({ title: "Kettle & Co Refresh", description: "Small-appliance packshots.", content_type: "Product photography", style: "Bright, precise, minimal", tools: ["Flux"], industry: "Consumer electronics", aspect_ratio: "1:1", duration_seconds: null, commercial_use: "Commercial use (organic)", workflow_notes: "CAD render -> Flux material pass", media_type: "image" }),
    ],
    signals: ["tool", "portfolio", "rights"],
  },
  {
    email: "kai@promptfolio.demo",
    display_name: "Kai Tanaka",
    bio: "Anime-inspired character & avatar designer for gaming brands.",
    location: "Osaka, JP",
    years_experience: 4,
    hourly_rate: 115,
    availability: "Available",
    skills: [["Character & avatar design", 5], ["AI image generation", 5], ["Motion design", 4], ["Prompt engineering", 4]],
    tools: [["Niji Journey", 5, false], ["Stable Diffusion XL", 4, true], ["ComfyUI", 5, false], ["Live2D", 3, false]],
    specializations: ["Gaming campaigns", "VTuber assets", "Esports promos"],
    portfolios: [
      P({ title: "Rift Raiders Season Drop", description: "Character reveal animation set.", content_type: "Video ad", style: "Vibrant, anime, dynamic", tools: ["Niji Journey", "ComfyUI"], industry: "Gaming", aspect_ratio: "16:9", duration_seconds: 30, commercial_use: "Full commercial rights, paid media", workflow_notes: "Niji key art -> Comfy pose sheets -> Live2D motion" }),
      P({ title: "Guild Mascots Pack", description: "12 mascot avatars.", content_type: "Image set", style: "Playful, colorful, bold", tools: ["Niji Journey"], industry: "Gaming", aspect_ratio: "1:1", duration_seconds: null, commercial_use: "Commercial use (organic)", workflow_notes: "Style-locked batch gen -> selection pass", media_type: "image" }),
    ],
    signals: ["tool", "workflow", "portfolio"],
  },
  {
    email: "zara@promptfolio.demo",
    display_name: "Zara Ahmed",
    bio: "Health & wellness creator blending calm cinematic visuals with VO.",
    location: "Dubai, AE",
    years_experience: 3,
    hourly_rate: 80,
    availability: "Available",
    skills: [["Voiceover & sound design", 5], ["AI video generation", 3], ["Creative storytelling", 4], ["UGC production", 4]],
    tools: [["ElevenLabs", 5, true], ["Runway Gen-3", 3, false], ["Midjourney v6", 3, false]],
    specializations: ["Wellness campaigns", "Meditation apps", "Fitness promos"],
    portfolios: [
      P({ title: "StillMind App Launch", description: "Calm meditation spot with VO.", content_type: "Video ad", style: "Soft, calm, luminous", tools: ["Runway Gen-3", "ElevenLabs"], industry: "Health", aspect_ratio: "9:16", duration_seconds: 30, commercial_use: "Full commercial rights", workflow_notes: "MJ ambience -> Runway slow pans -> EL narration" }),
      P({ title: "Morning Routine UGC", description: "Supplement routine clips.", content_type: "UGC-style video", style: "Fresh, authentic, bright", tools: ["ElevenLabs", "CapCut"], industry: "Health", aspect_ratio: "9:16", duration_seconds: 20, commercial_use: "Social media use", workflow_notes: "Script beats -> avatar UGC -> captions" }),
    ],
    signals: ["tool", "portfolio"],
  },
  {
    email: "felix@promptfolio.demo",
    display_name: "Felix Moreau",
    bio: "High-fashion experimentalist — avant-garde AI runway content.",
    location: "Paris, FR",
    years_experience: 7,
    hourly_rate: 190,
    availability: "Booked",
    skills: [["AI video generation", 4], ["Fashion & virtual modeling", 5], ["Creative storytelling", 5], ["Color grading", 5]],
    tools: [["Midjourney v6", 5, true], ["Sora", 5, false], ["Runway Gen-3", 4, false], ["DaVinci Resolve", 4, true]],
    specializations: ["Fashion campaigns", "Luxury campaigns", "Cinematic shorts"],
    portfolios: [
      P({ title: "Maison Eclat Runway", description: "Impossible-fabric runway film.", content_type: "Video ad", style: "Avant-garde, moody, cinematic", tools: ["Sora", "Midjourney v6"], industry: "Fashion", aspect_ratio: "16:9", duration_seconds: 45, commercial_use: "Full commercial rights, paid media", workflow_notes: "MJ fabric studies -> Sora cloth sim -> Resolve LUT" }),
      P({ title: "Atelier Nocturne", description: "Night-collection stills.", content_type: "Image set", style: "Dark, elegant, editorial", tools: ["Midjourney v6"], industry: "Fashion", aspect_ratio: "4:5", duration_seconds: null, commercial_use: "Full commercial rights", workflow_notes: "Single-seed series -> grain pass", media_type: "image" }),
    ],
    signals: ["tool", "workflow", "portfolio", "rights"],
  },
  {
    email: "ivy@promptfolio.demo",
    display_name: "Ivy Zhang",
    bio: "Real-estate & hospitality visualist creating immersive property films.",
    location: "Singapore, SG",
    years_experience: 4,
    hourly_rate: 95,
    availability: "Available",
    skills: [["AI video generation", 4], ["Product visualization", 4], ["Upscaling & enhancement", 5], ["Editing & post-production", 4]],
    tools: [["Runway Gen-3", 4, false], ["Topaz Video AI", 5, true], ["Midjourney v6", 4, false]],
    specializations: ["Real estate films", "Hospitality promos", "Travel campaigns"],
    portfolios: [
      P({ title: "Marina Penthouse Tour", description: "One-take virtual walkthrough.", content_type: "Video ad", style: "Airy, premium, clean", tools: ["Runway Gen-3", "Topaz Video AI"], industry: "Real estate", aspect_ratio: "16:9", duration_seconds: 60, commercial_use: "Commercial use (organic)", workflow_notes: "Planned camera path -> Runway segments -> Topaz stitch" }),
      P({ title: "Reef Resort Teaser", description: "Vertical resort escape reel.", content_type: "Video ad", style: "Sun-drenched, vibrant, inviting", tools: ["Midjourney v6", "Runway Gen-3"], industry: "Travel", aspect_ratio: "9:16", duration_seconds: 15, commercial_use: "Social media use", workflow_notes: "MJ establishing frames -> Runway water motion" }),
    ],
    signals: ["workflow", "portfolio"],
  },
];

export const SEED_BRIEFS: SeedBrief[] = [
  {
    company: "Volt Sneakers",
    raw_input: "I need a cinematic 30-second Instagram ad for a premium sneaker brand.",
    campaign_objective: "Product launch awareness",
    content_type: "Video ad",
    style: "Cinematic, premium, moody",
    duration: "30 seconds",
    platform: "Instagram",
    aspect_ratio: "9:16",
    target_audience: "18-34 urban fashion-forward",
    visual_direction: "Slow-motion product shots, dramatic lighting, urban night",
    required_tools: ["Runway", "Midjourney", "After Effects"],
    commercial_usage: "Full commercial rights, paid media",
    deliverables: ["30s master", "15s cutdown", "9:16 + 1:1 + 16:9"],
    constraints: ["No celebrity likeness", "Brand-safe", "Deliver in 7 days"],
  },
  {
    company: "GlowLab Skincare",
    raw_input: "UGC-style TikTok creator videos for our new vitamin C serum launch, authentic vibe with voiceovers.",
    campaign_objective: "Conversion for DTC launch",
    content_type: "UGC-style video",
    style: "Authentic, bright, playful",
    duration: "20 seconds",
    platform: "TikTok",
    aspect_ratio: "9:16",
    target_audience: "21-35 skincare enthusiasts",
    visual_direction: "Selfie-style routines, bathroom light, real reactions",
    required_tools: ["ElevenLabs", "CapCut", "Runway"],
    commercial_usage: "Full commercial rights, paid media",
    deliverables: ["3x 20s UGC clips", "Hook variations x5", "Caption files"],
    constraints: ["No medical claims", "FDA-safe language", "Deliver in 5 days"],
  },
  {
    company: "Aurora Motors",
    raw_input: "A sweeping cinematic EV launch film for YouTube — coastal roads, golden hour, premium feel, 60 seconds.",
    campaign_objective: "Flagship vehicle reveal",
    content_type: "Video ad",
    style: "Cinematic, expansive, premium",
    duration: "60 seconds",
    platform: "YouTube",
    aspect_ratio: "16:9",
    target_audience: "30-55 affluent eco-conscious buyers",
    visual_direction: "Drone-style coastal drives, golden-hour reflections, scale shots",
    required_tools: ["Sora", "Topaz Video AI", "Premiere Pro"],
    commercial_usage: "Full commercial rights, paid media",
    deliverables: ["60s hero film", "30s TV cut", "6 vertical extracts"],
    constraints: ["No competitor marks", "Legal review on range claims"],
  },
  {
    company: "Casa Verde Interiors",
    raw_input: "Minimal clean product photography style images for our furniture catalog — white studio plus lifestyle rooms, square crops.",
    campaign_objective: "Catalog refresh",
    content_type: "Image set",
    style: "Minimal, clean, modern",
    duration: "n/a",
    platform: "Instagram",
    aspect_ratio: "1:1",
    target_audience: "25-45 urban homeowners",
    visual_direction: "Natural light, neutral palettes, negative space",
    required_tools: ["Flux", "Photoshop"],
    commercial_usage: "Full commercial rights",
    deliverables: ["12 packshots", "8 lifestyle scenes", "Web-optimized exports"],
    constraints: ["Color accuracy critical", "Deliver in 10 days"],
  },
  {
    company: "Hexa Games",
    raw_input: "Anime-style character reveal video for our game's new season drop, vibrant and dynamic, for YouTube and socials.",
    campaign_objective: "Season 4 player reactivation",
    content_type: "Video ad",
    style: "Vibrant, anime, dynamic",
    duration: "30 seconds",
    platform: "YouTube",
    aspect_ratio: "16:9",
    target_audience: "16-30 gamers & anime fans",
    visual_direction: "Speed lines, impact frames, character showcase poses",
    required_tools: ["Niji Journey", "ComfyUI", "After Effects"],
    commercial_usage: "Full commercial rights, paid media",
    deliverables: ["30s reveal film", "GIF asset pack", "Key art posters"],
    constraints: ["IP-safe character usage", "Localized subtitle slots"],
  },
];

/** Fixed UUID namespace so re-seeding is idempotent-ish and stable across runs. */
export function deterministicId(prefix: string, index: number): string {
  const hex = (prefix + String(index)).padEnd(0, "");
  const h = [...hex.padEnd(32, "0")].reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), 7);
  const seg = (n: number, len: number): string => {
    let s = "";
    let x = Math.abs(n);
    for (let i = 0; i < len; i++) {
      x = (x * 1103515245 + 12345) % 2147483648;
      s += "0123456789abcdef"[x % 16];
    }
    return s;
  };
  return `${seg(h, 8)}-${seg(h >> 3, 4)}-4${seg(h >> 7, 3)}-8${seg(h >> 11, 3)}-${seg(h >> 15, 12)}`;
}
