/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AI STUDIO - Registre complet des modeles fal.ai + OpenRouter
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type ModelCategory =
  | 'image-generation'
  | 'image-editing'
  | 'video-generation'
  | 'video-editing'
  | 'upscale'
  | 'remove-bg'
  | '3d'
  | 'audio'
  | 'music'
  | 'avatar'
  | 'face-swap'
  | 'vectorize'
  | 'utility'

export type ModelInputType =
  | 'text-to-image'
  | 'image-to-image'
  | 'text-to-video'
  | 'image-to-video'
  | 'video-to-video'
  | 'text-to-audio'
  | 'audio-to-audio'
  | 'text-to-3d'
  | 'image-to-3d'
  | 'image-upscale'
  | 'video-upscale'
  | 'image-remove-bg'
  | 'video-remove-bg'
  | 'image-to-avatar'
  | 'video-to-audio'
  | 'image-to-svg'
  | 'image-classify'

export type CostUnit = 'image' | 'second' | 'megapixel' | 'video' | 'request'

export interface ModelParam {
  key: string
  label: string
  type: 'text' | 'number' | 'select' | 'slider' | 'boolean' | 'textarea'
  default?: unknown
  options?: Array<{ value: string; label: string }>
  min?: number
  max?: number
  step?: number
  required?: boolean
  placeholder?: string
}

export type ProviderBackend = 'fal' | 'openrouter' | 'vectorizer' | 'local'

export interface FalModel {
  id: string
  name: string
  /** Nom affiche du provider (ex: "ByteDance", "OpenAI") */
  provider: string
  /** Provider backend pour l'appel API (fal ou openrouter) */
  backend: ProviderBackend
  category: ModelCategory
  inputType: ModelInputType
  description: string
  costPerUnit: number
  costUnit: CostUnit
  featured?: boolean
  new?: boolean
  params: ModelParam[]
  // Contraintes
  maxImages?: number
  acceptsImage?: boolean
  acceptsVideo?: boolean
  acceptsAudio?: boolean
}

// ─── Parametres communs ──────────────────────────────────────────────────────

const COMMON_IMAGE_SIZE_HD: ModelParam = {
  key: 'image_size',
  label: 'Taille',
  type: 'select',
  default: 'landscape_16_9',
  options: [
    { value: 'square_hd', label: '1024x1024 (Carre HD)' },
    { value: 'square', label: '512x512 (Carre)' },
    { value: 'portrait_4_3', label: '768x1024 (Portrait 4:3)' },
    { value: 'portrait_16_9', label: '576x1024 (Portrait 16:9)' },
    { value: 'landscape_4_3', label: '1024x768 (Paysage 4:3)' },
    { value: 'landscape_16_9', label: '1024x576 (Paysage 16:9)' },
    { value: 'auto_2K', label: '2K Auto (Haute definition)' },
    { value: 'auto_4K', label: '4K Auto (Ultra HD)' },
  ],
}

const ASPECT_RATIO_FULL: ModelParam = {
  key: 'aspect_ratio',
  label: 'Ratio',
  type: 'select',
  default: '16:9',
  options: [
    { value: '1:1', label: '1:1 (Carre)' },
    { value: '4:3', label: '4:3 (Paysage)' },
    { value: '3:4', label: '3:4 (Portrait)' },
    { value: '16:9', label: '16:9 (Cinema)' },
    { value: '9:16', label: '9:16 (Story/Reel)' },
    { value: '3:2', label: '3:2 (Photo)' },
    { value: '2:3', label: '2:3 (Portrait photo)' },
    { value: '21:9', label: '21:9 (Ultra-wide)' },
  ],
}

const ASPECT_RATIO_VIDEO: ModelParam = {
  key: 'aspect_ratio',
  label: 'Format',
  type: 'select',
  default: '16:9',
  options: [
    { value: '16:9', label: '16:9 (Paysage)' },
    { value: '9:16', label: '9:16 (Portrait)' },
    { value: '1:1', label: '1:1 (Carre)' },
  ],
}

const DURATION_5_10: ModelParam = {
  key: 'duration',
  label: 'Duree (secondes)',
  type: 'select',
  default: '5',
  options: [
    { value: '5', label: '5 secondes' },
    { value: '10', label: '10 secondes' },
  ],
}

const NUM_IMAGES: ModelParam = {
  key: 'num_images',
  label: "Nombre d'images",
  type: 'slider',
  default: 1,
  min: 1,
  max: 4,
  step: 1,
}

const SEED: ModelParam = {
  key: 'seed',
  label: 'Seed (optionnel)',
  type: 'number',
  placeholder: 'Aleatoire',
}

const PROMPT: ModelParam = {
  key: 'prompt',
  label: 'Prompt',
  type: 'textarea',
  required: true,
  placeholder: 'Decrivez ce que vous voulez generer...',
}

const NEGATIVE_PROMPT: ModelParam = {
  key: 'negative_prompt',
  label: 'Prompt negatif',
  type: 'textarea',
  placeholder: 'Ce que vous ne voulez PAS voir...',
}

const GUIDANCE_SCALE: ModelParam = {
  key: 'guidance_scale',
  label: 'Guidance Scale',
  type: 'slider',
  default: 7.5,
  min: 1,
  max: 20,
  step: 0.5,
}

const NANO_BANANA_RESOLUTION: ModelParam = {
  key: 'resolution',
  label: 'Resolution',
  type: 'select',
  default: '1K',
  options: [
    { value: '1K', label: '1K (Standard)' },
    { value: '2K', label: '2K (Haute definition)' },
    { value: '4K', label: '4K (Ultra HD)' },
  ],
}

const TEXT_INPUT: ModelParam = {
  key: 'text',
  label: 'Texte a lire',
  type: 'textarea',
  required: true,
  placeholder: 'Entrez le texte a convertir en audio...',
}

// ─── Registre des modeles ────────────────────────────────────────────────────

export const MODEL_REGISTRY: FalModel[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // IMAGE GENERATION (text-to-image) — fal.ai
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'fal-ai/nano-banana-pro',
    name: 'Nano Banana Pro',
    provider: 'Google',
    backend: 'fal',
    category: 'image-generation',
    inputType: 'text-to-image',
    description:
      "Gemini 3 Pro Image de Google. Etat de l'art pour la generation d'images, texte dans les images, raisonnement avance. $0.15/image.",
    costPerUnit: 0.15,
    costUnit: 'image',
    featured: true,
    new: true,
    params: [PROMPT, NANO_BANANA_RESOLUTION, ASPECT_RATIO_FULL, NUM_IMAGES, SEED],
  },
  {
    id: 'fal-ai/xai/grok-imagine-image',
    name: 'Grok Imagine Image',
    provider: 'xAI',
    backend: 'fal',
    category: 'image-generation',
    inputType: 'text-to-image',
    description:
      "Nouveau modele de generation d'images de xAI. Esthetique elevee, style tres creatif.",
    costPerUnit: 0.04,
    costUnit: 'image',
    featured: true,
    new: true,
    params: [PROMPT, COMMON_IMAGE_SIZE_HD, ASPECT_RATIO_FULL, NUM_IMAGES, SEED],
  },
  {
    id: 'fal-ai/bytedance/seedream/v4.5/text-to-image',
    name: 'Seedream V4.5',
    provider: 'ByteDance',
    backend: 'fal',
    category: 'image-generation',
    inputType: 'text-to-image',
    description:
      'Modele phare de ByteDance. Qualite photorealiste exceptionnelle. Supporte 2K et 4K.',
    costPerUnit: 0.03,
    costUnit: 'image',
    featured: true,
    params: [PROMPT, COMMON_IMAGE_SIZE_HD, ASPECT_RATIO_FULL, NUM_IMAGES, SEED],
  },
  {
    id: 'fal-ai/flux-2/flex',
    name: 'Flux 2 Flex',
    provider: 'Black Forest Labs',
    backend: 'fal',
    category: 'image-generation',
    inputType: 'text-to-image',
    description:
      'Nouvelle generation Flux. Excellent suivi du prompt, style artistique versatile. Supporte 2K et 4K.',
    costPerUnit: 0.035,
    costUnit: 'image',
    params: [PROMPT, COMMON_IMAGE_SIZE_HD, ASPECT_RATIO_FULL, NUM_IMAGES, GUIDANCE_SCALE, SEED],
  },
  {
    id: 'fal-ai/recraft/v3/text-to-image',
    name: 'Recraft V3',
    provider: 'Recraft',
    backend: 'fal',
    category: 'image-generation',
    inputType: 'text-to-image',
    description:
      'SOTA sur le benchmark Hugging Face. Excellent pour le texte, le vector art et le style de marque. $0.04/image, $0.08 en mode vector.',
    costPerUnit: 0.04,
    costUnit: 'image',
    featured: true,
    new: true,
    params: [
      PROMPT,
      {
        key: 'style',
        label: 'Style',
        type: 'select',
        default: 'realistic_image',
        options: [
          // --- Realiste ---
          { value: 'realistic_image', label: 'Realiste' },
          { value: 'realistic_image/b_and_w', label: 'Realiste - Noir & Blanc' },
          { value: 'realistic_image/hard_flash', label: 'Realiste - Flash dur' },
          { value: 'realistic_image/hdr', label: 'Realiste - HDR' },
          { value: 'realistic_image/natural_light', label: 'Realiste - Lumiere naturelle' },
          { value: 'realistic_image/studio_portrait', label: 'Realiste - Portrait studio' },
          { value: 'realistic_image/enterprise', label: 'Realiste - Entreprise' },
          { value: 'realistic_image/motion_blur', label: 'Realiste - Flou de mouvement' },
          { value: 'realistic_image/evening_light', label: 'Realiste - Lumiere du soir' },
          { value: 'realistic_image/faded_nostalgia', label: 'Realiste - Nostalgie fanee' },
          { value: 'realistic_image/forest_life', label: 'Realiste - Vie en foret' },
          { value: 'realistic_image/mystic_naturalism', label: 'Realiste - Naturalisme mystique' },
          { value: 'realistic_image/natural_tones', label: 'Realiste - Tons naturels' },
          { value: 'realistic_image/organic_calm', label: 'Realiste - Calme organique' },
          { value: 'realistic_image/real_life_glow', label: 'Realiste - Eclat naturel' },
          { value: 'realistic_image/retro_realism', label: 'Realiste - Retro realiste' },
          { value: 'realistic_image/retro_snapshot', label: 'Realiste - Snapshot retro' },
          { value: 'realistic_image/urban_drama', label: 'Realiste - Drame urbain' },
          { value: 'realistic_image/village_realism', label: 'Realiste - Realisme villageois' },
          { value: 'realistic_image/warm_folk', label: 'Realiste - Folk chaleureux' },
          // --- Illustration digitale ---
          { value: 'digital_illustration', label: 'Illustration digitale' },
          { value: 'digital_illustration/pixel_art', label: 'Digital - Pixel Art' },
          { value: 'digital_illustration/hand_drawn', label: 'Digital - Dessine main' },
          { value: 'digital_illustration/grain', label: 'Digital - Grain' },
          { value: 'digital_illustration/infantile_sketch', label: 'Digital - Croquis enfantin' },
          { value: 'digital_illustration/2d_art_poster', label: 'Digital - Poster 2D' },
          { value: 'digital_illustration/2d_art_poster_2', label: 'Digital - Poster 2D v2' },
          { value: 'digital_illustration/handmade_3d', label: 'Digital - 3D artisanal' },
          { value: 'digital_illustration/hand_drawn_outline', label: 'Digital - Contour dessine' },
          { value: 'digital_illustration/engraving_color', label: 'Digital - Gravure couleur' },
          { value: 'digital_illustration/antiquarian', label: 'Digital - Antiquaire' },
          { value: 'digital_illustration/bold_fantasy', label: 'Digital - Fantasy audacieux' },
          { value: 'digital_illustration/child_book', label: 'Digital - Livre enfant' },
          { value: 'digital_illustration/child_books', label: 'Digital - Livres enfants' },
          { value: 'digital_illustration/cover', label: 'Digital - Couverture' },
          { value: 'digital_illustration/crosshatch', label: 'Digital - Hachures croisees' },
          { value: 'digital_illustration/digital_engraving', label: 'Digital - Gravure digitale' },
          { value: 'digital_illustration/expressionism', label: 'Digital - Expressionnisme' },
          { value: 'digital_illustration/freehand_details', label: 'Digital - Details main levee' },
          { value: 'digital_illustration/grain_20', label: 'Digital - Grain 2.0' },
          {
            value: 'digital_illustration/graphic_intensity',
            label: 'Digital - Intensite graphique',
          },
          { value: 'digital_illustration/hard_comics', label: 'Digital - Comics dur' },
          { value: 'digital_illustration/long_shadow', label: 'Digital - Ombre longue' },
          { value: 'digital_illustration/modern_folk', label: 'Digital - Folk moderne' },
          { value: 'digital_illustration/multicolor', label: 'Digital - Multicolore' },
          { value: 'digital_illustration/neon_calm', label: 'Digital - Neon calme' },
          { value: 'digital_illustration/noir', label: 'Digital - Noir' },
          { value: 'digital_illustration/nostalgic_pastel', label: 'Digital - Pastel nostalgique' },
          { value: 'digital_illustration/outline_details', label: 'Digital - Details contour' },
          { value: 'digital_illustration/pastel_gradient', label: 'Digital - Gradient pastel' },
          { value: 'digital_illustration/pastel_sketch', label: 'Digital - Croquis pastel' },
          { value: 'digital_illustration/pop_art', label: 'Digital - Pop Art' },
          { value: 'digital_illustration/pop_renaissance', label: 'Digital - Pop Renaissance' },
          { value: 'digital_illustration/street_art', label: 'Digital - Street Art' },
          { value: 'digital_illustration/tablet_sketch', label: 'Digital - Croquis tablette' },
          { value: 'digital_illustration/urban_glow', label: 'Digital - Eclat urbain' },
          { value: 'digital_illustration/urban_sketching', label: 'Digital - Urban Sketching' },
          { value: 'digital_illustration/vanilla_dreams', label: 'Digital - Reves vanille' },
          { value: 'digital_illustration/young_adult_book', label: 'Digital - Young Adult' },
          { value: 'digital_illustration/young_adult_book_2', label: 'Digital - Young Adult v2' },
          // --- Vector (x2 prix) ---
          { value: 'vector_illustration', label: 'Vector (x2 prix)' },
          { value: 'vector_illustration/bold_stroke', label: 'Vector - Trait gras' },
          { value: 'vector_illustration/chemistry', label: 'Vector - Chimie' },
          { value: 'vector_illustration/colored_stencil', label: 'Vector - Pochoir couleur' },
          { value: 'vector_illustration/contour_pop_art', label: 'Vector - Contour Pop Art' },
          { value: 'vector_illustration/cosmics', label: 'Vector - Cosmique' },
          { value: 'vector_illustration/cutout', label: 'Vector - Decoupage' },
          { value: 'vector_illustration/depressive', label: 'Vector - Depressif' },
          { value: 'vector_illustration/editorial', label: 'Vector - Editorial' },
          { value: 'vector_illustration/emotional_flat', label: 'Vector - Flat emotionnel' },
          { value: 'vector_illustration/engraving', label: 'Vector - Gravure' },
          { value: 'vector_illustration/infographical', label: 'Vector - Infographie' },
          { value: 'vector_illustration/line_art', label: 'Vector - Line Art' },
          { value: 'vector_illustration/line_circuit', label: 'Vector - Circuit' },
          { value: 'vector_illustration/linocut', label: 'Vector - Linogravure' },
          { value: 'vector_illustration/marker_outline', label: 'Vector - Contour marqueur' },
          { value: 'vector_illustration/mosaic', label: 'Vector - Mosaique' },
          { value: 'vector_illustration/naivector', label: 'Vector - Naif' },
          { value: 'vector_illustration/roundish_flat', label: 'Vector - Flat arrondi' },
          { value: 'vector_illustration/segmented_colors', label: 'Vector - Couleurs segmentees' },
          { value: 'vector_illustration/sharp_contrast', label: 'Vector - Contraste net' },
          { value: 'vector_illustration/thin', label: 'Vector - Fin' },
          { value: 'vector_illustration/vector_photo', label: 'Vector - Photo vectorisee' },
          { value: 'vector_illustration/vivid_shapes', label: 'Vector - Formes vives' },
        ],
      },
      {
        key: 'image_size',
        label: 'Taille',
        type: 'select',
        default: 'square_hd',
        options: [
          { value: 'square_hd', label: '1024x1024 (Carre HD)' },
          { value: 'square', label: '512x512 (Carre)' },
          { value: 'portrait_4_3', label: '768x1024 (Portrait 4:3)' },
          { value: 'portrait_16_9', label: '576x1024 (Portrait 16:9)' },
          { value: 'landscape_4_3', label: '1024x768 (Paysage 4:3)' },
          { value: 'landscape_16_9', label: '1024x576 (Paysage 16:9)' },
        ],
      },
      ASPECT_RATIO_FULL,
      SEED,
    ],
  },
  {
    id: 'fal-ai/kling-image/o3/text-to-image',
    name: 'Kling Omni 3',
    provider: 'Kuaishou',
    backend: 'fal',
    category: 'image-generation',
    inputType: 'text-to-image',
    description:
      'Kling Omni 3: Generation text-to-image haut de gamme avec coherence parfaite. $0.028/image.',
    costPerUnit: 0.028,
    costUnit: 'image',
    new: true,
    params: [PROMPT, COMMON_IMAGE_SIZE_HD, ASPECT_RATIO_FULL, NUM_IMAGES, SEED],
  },
  {
    id: 'fal-ai/kling-image/v3',
    name: 'Kling Image V3',
    provider: 'Kuaishou',
    backend: 'fal',
    category: 'image-generation',
    inputType: 'text-to-image',
    description: "Kling V3: Generation d'images realistes et detaillees. Supporte 2K et 4K.",
    costPerUnit: 0.04,
    costUnit: 'image',
    params: [PROMPT, COMMON_IMAGE_SIZE_HD, ASPECT_RATIO_FULL, NUM_IMAGES, SEED],
  },
  {
    id: 'fal-ai/hunyuan-image/v3',
    name: 'Hunyuan Image V3',
    provider: 'Tencent',
    backend: 'fal',
    category: 'image-generation',
    inputType: 'text-to-image',
    description:
      'Modele de Tencent. Excellent pour les personnes et scenes complexes. Supporte 2K et 4K.',
    costPerUnit: 0.03,
    costUnit: 'image',
    params: [PROMPT, COMMON_IMAGE_SIZE_HD, ASPECT_RATIO_FULL, NUM_IMAGES, SEED],
  },
  {
    id: 'fal-ai/hunyuan-image/v3/instruct/text-to-image',
    name: 'Hunyuan V3 Instruct',
    provider: 'Tencent',
    backend: 'fal',
    category: 'image-generation',
    inputType: 'text-to-image',
    description:
      'Version Instruct de Hunyuan V3 avec capacites de raisonnement interne. Plus precis sur les prompts complexes.',
    costPerUnit: 0.04,
    costUnit: 'image',
    new: true,
    params: [PROMPT, COMMON_IMAGE_SIZE_HD, ASPECT_RATIO_FULL, NUM_IMAGES, SEED],
  },
  {
    id: 'fal-ai/qwen-image',
    name: 'Qwen Image',
    provider: 'Alibaba',
    backend: 'fal',
    category: 'image-generation',
    inputType: 'text-to-image',
    description:
      "Modele d'Alibaba. Economique, bon pour les illustrations et le texte dans les images.",
    costPerUnit: 0.02,
    costUnit: 'megapixel',
    params: [PROMPT, COMMON_IMAGE_SIZE_HD, ASPECT_RATIO_FULL, NUM_IMAGES, SEED],
  },
  {
    id: 'fal-ai/bria/fibo/generate',
    name: 'Bria Fibo',
    provider: 'Bria AI',
    backend: 'fal',
    category: 'image-generation',
    inputType: 'text-to-image',
    description:
      'SOTA open source, entraine sur donnees licenciees. Commercial-ready, images libres de droits.',
    costPerUnit: 0.03,
    costUnit: 'image',
    params: [PROMPT, COMMON_IMAGE_SIZE_HD, ASPECT_RATIO_FULL, NUM_IMAGES, SEED],
  },
  {
    id: 'fal-ai/grok-2-aurora',
    name: 'Grok 2 Aurora',
    provider: 'xAI',
    backend: 'fal',
    category: 'image-generation',
    inputType: 'text-to-image',
    description: "Generation d'images de xAI (legacy). Tres creatif et detaille.",
    costPerUnit: 0.04,
    costUnit: 'image',
    params: [PROMPT, COMMON_IMAGE_SIZE_HD, ASPECT_RATIO_FULL, NUM_IMAGES, SEED],
  },
  {
    id: 'fal-ai/imagineart/imagineart-1.5-preview/text-to-image',
    name: 'ImagineArt 1.5',
    provider: 'ImagineArt',
    backend: 'fal',
    category: 'image-generation',
    inputType: 'text-to-image',
    description:
      'Visuals haute fidelite avec realisme, esthetique forte et texte lisible dans les images.',
    costPerUnit: 0.04,
    costUnit: 'image',
    new: true,
    params: [PROMPT, COMMON_IMAGE_SIZE_HD, ASPECT_RATIO_FULL, NUM_IMAGES, SEED],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // IMAGE EDITING (image-to-image) — fal.ai
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'fal-ai/nano-banana-pro/edit',
    name: 'Nano Banana Pro Edit',
    provider: 'Google',
    backend: 'fal',
    category: 'image-editing',
    inputType: 'image-to-image',
    description: "Gemini 3 Pro de Google. Edition d'images etat de l'art. Supporte 1K, 2K et 4K.",
    costPerUnit: 0.15,
    costUnit: 'image',
    featured: true,
    new: true,
    acceptsImage: true,
    maxImages: 14,
    params: [PROMPT, NANO_BANANA_RESOLUTION, ASPECT_RATIO_FULL, NUM_IMAGES, SEED],
  },
  {
    id: 'fal-ai/xai/grok-imagine-image/edit',
    name: 'Grok Imagine Edit',
    provider: 'xAI',
    backend: 'fal',
    category: 'image-editing',
    inputType: 'image-to-image',
    description: "Edition precise d'images avec le modele Grok Imagine de xAI.",
    costPerUnit: 0.04,
    costUnit: 'image',
    new: true,
    acceptsImage: true,
    maxImages: 1,
    params: [PROMPT, SEED],
  },
  {
    id: 'fal-ai/bytedance/seedream/v4.5/edit',
    name: 'Seedream V4.5 Edit',
    provider: 'ByteDance',
    backend: 'fal',
    category: 'image-editing',
    inputType: 'image-to-image',
    description:
      "Edition d'images par instruction. Modifiez vos photos avec du texte. Supporte 2K et 4K.",
    costPerUnit: 0.03,
    costUnit: 'image',
    featured: true,
    acceptsImage: true,
    maxImages: 10,
    params: [
      PROMPT,
      COMMON_IMAGE_SIZE_HD,
      {
        key: 'num_images',
        label: "Nombre d'images",
        type: 'slider',
        default: 1,
        min: 1,
        max: 4,
        step: 1,
      },
      SEED,
    ],
  },
  {
    id: 'fal-ai/flux-kontext/pro',
    name: 'Flux Kontext Pro',
    provider: 'Black Forest Labs',
    backend: 'fal',
    category: 'image-editing',
    inputType: 'image-to-image',
    description:
      "Edition contextuelle avancee. Comprend le contexte de l'image pour des modifications precises.",
    costPerUnit: 0.04,
    costUnit: 'image',
    featured: true,
    acceptsImage: true,
    maxImages: 1,
    params: [PROMPT, SEED],
  },
  {
    id: 'fal-ai/flux-kontext-lora',
    name: 'Flux Kontext LoRA',
    provider: 'Black Forest Labs',
    backend: 'fal',
    category: 'image-editing',
    inputType: 'image-to-image',
    description:
      'Flux Kontext [dev] avec support LoRA. Edition rapide avec adaptations pre-entrainees pour styles et marques.',
    costPerUnit: 0.03,
    costUnit: 'image',
    acceptsImage: true,
    maxImages: 1,
    params: [PROMPT, SEED],
  },
  {
    id: 'fal-ai/grok-2-aurora/edit',
    name: 'Grok 2 Aurora Edit',
    provider: 'xAI',
    backend: 'fal',
    category: 'image-editing',
    inputType: 'image-to-image',
    description:
      "Edition d'images par Grok (legacy). Instructions naturelles, resultats impressionnants.",
    costPerUnit: 0.04,
    costUnit: 'image',
    acceptsImage: true,
    maxImages: 1,
    params: [PROMPT, SEED],
  },
  {
    id: 'fal-ai/kling-image/v3/image-to-image',
    name: 'Kling Image V3 Edit',
    provider: 'Kuaishou',
    backend: 'fal',
    category: 'image-editing',
    inputType: 'image-to-image',
    description: "Kling V3: Edition d'images haute qualite avec suivi precis des instructions.",
    costPerUnit: 0.04,
    costUnit: 'image',
    new: true,
    acceptsImage: true,
    maxImages: 1,
    params: [PROMPT, SEED],
  },
  {
    id: 'fal-ai/kling-image/o3/image-to-image',
    name: 'Kling Omni 3 Edit',
    provider: 'Kuaishou',
    backend: 'fal',
    category: 'image-editing',
    inputType: 'image-to-image',
    description: 'Kling Omni 3: Edition image-to-image haut de gamme avec coherence parfaite.',
    costPerUnit: 0.028,
    costUnit: 'image',
    new: true,
    acceptsImage: true,
    maxImages: 1,
    params: [PROMPT, SEED],
  },
  {
    id: 'fal-ai/hunyuan-image/v3/instruct/edit',
    name: 'Hunyuan V3 Instruct Edit',
    provider: 'Tencent',
    backend: 'fal',
    category: 'image-editing',
    inputType: 'image-to-image',
    description:
      "Edition d'images avec Hunyuan V3 Instruct. Raisonnement interne pour modifications precises.",
    costPerUnit: 0.04,
    costUnit: 'image',
    new: true,
    acceptsImage: true,
    maxImages: 1,
    params: [PROMPT, SEED],
  },
  {
    id: 'fal-ai/bria/fibo-edit/edit',
    name: 'Bria Fibo Edit',
    provider: 'Bria AI',
    backend: 'fal',
    category: 'image-editing',
    inputType: 'image-to-image',
    description:
      'Edition haute qualite avec controlabilite maximale. JSON + Masque + Image. Commercial-ready.',
    costPerUnit: 0.03,
    costUnit: 'image',
    new: true,
    acceptsImage: true,
    maxImages: 1,
    params: [PROMPT, SEED],
  },
  {
    id: 'fal-ai/reve/edit',
    name: 'Reve Edit',
    provider: 'Reve',
    backend: 'fal',
    category: 'image-editing',
    inputType: 'image-to-image',
    description: 'Edition de style et contenu. Transformez le style de vos images.',
    costPerUnit: 0.03,
    costUnit: 'image',
    acceptsImage: true,
    maxImages: 1,
    params: [PROMPT, SEED],
  },
  {
    id: 'fal-ai/bytedance/seedream/v4/edit',
    name: 'Seedream V4 Edit',
    provider: 'ByteDance',
    backend: 'fal',
    category: 'image-editing',
    inputType: 'image-to-image',
    description:
      'Seedream 4.0: Architecture unifiee generation + edition. Bon pour les transformations de style.',
    costPerUnit: 0.03,
    costUnit: 'image',
    acceptsImage: true,
    maxImages: 1,
    params: [PROMPT, COMMON_IMAGE_SIZE_HD, SEED],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // VIDEO GENERATION — fal.ai
  // ═══════════════════════════════════════════════════════════════════════════

  // --- Veo 3.1 (Google) ---
  {
    id: 'fal-ai/veo3.1',
    name: 'Veo 3.1',
    provider: 'Google DeepMind',
    backend: 'fal',
    category: 'video-generation',
    inputType: 'text-to-video',
    description:
      'Le modele video le plus avance au monde par Google. Avec audio genere. $0.20/s sans audio, $0.40/s avec.',
    costPerUnit: 0.4,
    costUnit: 'second',
    featured: true,
    new: true,
    params: [
      PROMPT,
      {
        key: 'aspect_ratio',
        label: 'Format',
        type: 'select',
        default: '16:9',
        options: [
          { value: '16:9', label: '16:9 (Paysage)' },
          { value: '9:16', label: '9:16 (Portrait)' },
        ],
      },
      {
        key: 'generate_audio',
        label: "Generer l'audio",
        type: 'boolean',
        default: true,
      },
      {
        key: 'resolution',
        label: 'Resolution',
        type: 'select',
        default: '720p',
        options: [
          { value: '720p', label: '720p' },
          { value: '1080p', label: '1080p' },
          { value: '4k', label: '4K (premium)' },
        ],
      },
    ],
  },
  {
    id: 'fal-ai/veo3.1/fast',
    name: 'Veo 3.1 Fast',
    provider: 'Google DeepMind',
    backend: 'fal',
    category: 'video-generation',
    inputType: 'text-to-video',
    description: 'Version rapide et economique de Veo 3.1. Ideal pour le prototypage rapide.',
    costPerUnit: 0.2,
    costUnit: 'second',
    new: true,
    params: [
      PROMPT,
      {
        key: 'aspect_ratio',
        label: 'Format',
        type: 'select',
        default: '16:9',
        options: [
          { value: '16:9', label: '16:9 (Paysage)' },
          { value: '9:16', label: '9:16 (Portrait)' },
        ],
      },
      {
        key: 'generate_audio',
        label: "Generer l'audio",
        type: 'boolean',
        default: true,
      },
    ],
  },
  {
    id: 'fal-ai/veo3.1/image-to-video',
    name: 'Veo 3.1 (I2V)',
    provider: 'Google DeepMind',
    backend: 'fal',
    category: 'video-generation',
    inputType: 'image-to-video',
    description:
      'Veo 3.1 image-to-video. Animez vos images avec le meilleur modele video au monde.',
    costPerUnit: 0.4,
    costUnit: 'second',
    new: true,
    acceptsImage: true,
    maxImages: 1,
    params: [
      PROMPT,
      {
        key: 'generate_audio',
        label: "Generer l'audio",
        type: 'boolean',
        default: true,
      },
    ],
  },
  {
    id: 'fal-ai/veo3.1/fast/image-to-video',
    name: 'Veo 3.1 Fast (I2V)',
    provider: 'Google DeepMind',
    backend: 'fal',
    category: 'video-generation',
    inputType: 'image-to-video',
    description: 'Veo 3.1 Fast image-to-video. Rapide et economique.',
    costPerUnit: 0.2,
    costUnit: 'second',
    new: true,
    acceptsImage: true,
    maxImages: 1,
    params: [
      PROMPT,
      {
        key: 'generate_audio',
        label: "Generer l'audio",
        type: 'boolean',
        default: true,
      },
    ],
  },

  // --- Sora 2 (OpenAI) ---
  {
    id: 'fal-ai/sora-2/text-to-video/pro',
    name: 'Sora 2 Pro (T2V)',
    provider: 'OpenAI',
    backend: 'fal',
    category: 'video-generation',
    inputType: 'text-to-video',
    description:
      "Sora 2 Pro par OpenAI. Videos jusqu'a 25s avec audio, qualite cinematographique. $0.50/s en 1080p.",
    costPerUnit: 0.5,
    costUnit: 'second',
    featured: true,
    new: true,
    params: [
      PROMPT,
      {
        key: 'resolution',
        label: 'Resolution',
        type: 'select',
        default: '1080p',
        options: [
          { value: '720p', label: '720p ($0.30/s)' },
          { value: '1080p', label: '1080p ($0.50/s)' },
        ],
      },
      {
        key: 'aspect_ratio',
        label: 'Format',
        type: 'select',
        default: '16:9',
        options: [
          { value: '16:9', label: '16:9 (Paysage)' },
          { value: '9:16', label: '9:16 (Portrait)' },
        ],
      },
      {
        key: 'duration',
        label: 'Duree',
        type: 'select',
        default: '4',
        options: [
          { value: '4', label: '4 secondes' },
          { value: '8', label: '8 secondes' },
          { value: '12', label: '12 secondes' },
        ],
      },
    ],
  },
  {
    id: 'fal-ai/sora-2/text-to-video',
    name: 'Sora 2 (T2V)',
    provider: 'OpenAI',
    backend: 'fal',
    category: 'video-generation',
    inputType: 'text-to-video',
    description: 'Sora 2 Standard par OpenAI. Videos avec audio depuis du texte. $0.10/s.',
    costPerUnit: 0.1,
    costUnit: 'second',
    new: true,
    params: [
      PROMPT,
      {
        key: 'resolution',
        label: 'Resolution',
        type: 'select',
        default: '720p',
        options: [{ value: '720p', label: '720p' }],
      },
      {
        key: 'aspect_ratio',
        label: 'Format',
        type: 'select',
        default: '16:9',
        options: [
          { value: '16:9', label: '16:9 (Paysage)' },
          { value: '9:16', label: '9:16 (Portrait)' },
        ],
      },
      {
        key: 'duration',
        label: 'Duree',
        type: 'select',
        default: '4',
        options: [
          { value: '4', label: '4 secondes' },
          { value: '8', label: '8 secondes' },
          { value: '12', label: '12 secondes' },
        ],
      },
    ],
  },
  {
    id: 'fal-ai/sora-2/image-to-video/pro',
    name: 'Sora 2 Pro (I2V)',
    provider: 'OpenAI',
    backend: 'fal',
    category: 'video-generation',
    inputType: 'image-to-video',
    description:
      'Sora 2 Pro image-to-video. Animez vos images en videos cinematographiques avec audio.',
    costPerUnit: 0.5,
    costUnit: 'second',
    new: true,
    acceptsImage: true,
    maxImages: 1,
    params: [
      PROMPT,
      {
        key: 'resolution',
        label: 'Resolution',
        type: 'select',
        default: '1080p',
        options: [
          { value: '720p', label: '720p ($0.30/s)' },
          { value: '1080p', label: '1080p ($0.50/s)' },
        ],
      },
      {
        key: 'duration',
        label: 'Duree',
        type: 'select',
        default: '4',
        options: [
          { value: '4', label: '4 secondes' },
          { value: '8', label: '8 secondes' },
          { value: '12', label: '12 secondes' },
        ],
      },
    ],
  },
  {
    id: 'fal-ai/sora-2/image-to-video',
    name: 'Sora 2 (I2V)',
    provider: 'OpenAI',
    backend: 'fal',
    category: 'video-generation',
    inputType: 'image-to-video',
    description: 'Sora 2 Standard image-to-video. Animez vos images avec audio.',
    costPerUnit: 0.1,
    costUnit: 'second',
    acceptsImage: true,
    maxImages: 1,
    params: [
      PROMPT,
      {
        key: 'duration',
        label: 'Duree',
        type: 'select',
        default: '4',
        options: [
          { value: '4', label: '4 secondes' },
          { value: '8', label: '8 secondes' },
          { value: '12', label: '12 secondes' },
        ],
      },
    ],
  },

  // --- Grok Imagine Video (xAI) ---
  {
    id: 'fal-ai/xai/grok-imagine-video/text-to-video',
    name: 'Grok Imagine Video (T2V)',
    provider: 'xAI',
    backend: 'fal',
    category: 'video-generation',
    inputType: 'text-to-video',
    description: 'Generation video avec audio depuis du texte par xAI Grok Imagine.',
    costPerUnit: 0.2,
    costUnit: 'second',
    new: true,
    params: [PROMPT, ASPECT_RATIO_VIDEO],
  },
  {
    id: 'fal-ai/xai/grok-imagine-video/image-to-video',
    name: 'Grok Imagine Video (I2V)',
    provider: 'xAI',
    backend: 'fal',
    category: 'video-generation',
    inputType: 'image-to-video',
    description: 'Generation video avec audio depuis une image par xAI Grok Imagine.',
    costPerUnit: 0.2,
    costUnit: 'second',
    new: true,
    acceptsImage: true,
    maxImages: 1,
    params: [PROMPT],
  },

  // --- Kling O3 (Kuaishou) ---
  {
    id: 'fal-ai/kling-video/o3/pro/text-to-video',
    name: 'Kling O3 Pro (T2V)',
    provider: 'Kuaishou',
    backend: 'fal',
    category: 'video-generation',
    inputType: 'text-to-video',
    description:
      'Kling Omni 3 Pro: Videos realistes avec audio optionnel. $0.224/s sans audio, $0.28/s avec.',
    costPerUnit: 0.28,
    costUnit: 'second',
    new: true,
    params: [
      PROMPT,
      DURATION_5_10,
      {
        key: 'generate_audio',
        label: "Generer l'audio",
        type: 'boolean',
        default: false,
      },
      ASPECT_RATIO_VIDEO,
    ],
  },
  {
    id: 'fal-ai/kling-video/o3/standard/text-to-video',
    name: 'Kling O3 Standard (T2V)',
    provider: 'Kuaishou',
    backend: 'fal',
    category: 'video-generation',
    inputType: 'text-to-video',
    description: 'Kling O3 Standard: Generation video realiste depuis du texte.',
    costPerUnit: 0.14,
    costUnit: 'second',
    new: true,
    params: [PROMPT, DURATION_5_10, ASPECT_RATIO_VIDEO],
  },
  {
    id: 'fal-ai/kling-video/o3/pro/image-to-video',
    name: 'Kling O3 Pro (I2V)',
    provider: 'Kuaishou',
    backend: 'fal',
    category: 'video-generation',
    inputType: 'image-to-video',
    description: 'Kling O3 Pro: Animation image avec frames de debut/fin et guidage textuel.',
    costPerUnit: 0.28,
    costUnit: 'second',
    new: true,
    acceptsImage: true,
    maxImages: 2,
    params: [PROMPT, DURATION_5_10],
  },
  {
    id: 'fal-ai/kling-video/o3/standard/image-to-video',
    name: 'Kling O3 Standard (I2V)',
    provider: 'Kuaishou',
    backend: 'fal',
    category: 'video-generation',
    inputType: 'image-to-video',
    description: 'Kling O3 Standard: Animation image economique.',
    costPerUnit: 0.14,
    costUnit: 'second',
    new: true,
    acceptsImage: true,
    maxImages: 2,
    params: [PROMPT, DURATION_5_10],
  },

  // --- Kling V3 (Kuaishou) ---
  {
    id: 'fal-ai/kling-video/v3/pro/text-to-video',
    name: 'Kling 3.0 Pro (T2V)',
    provider: 'Kuaishou',
    backend: 'fal',
    category: 'video-generation',
    inputType: 'text-to-video',
    description: 'Kling 3.0 Pro: Videos cinematographiques avec audio natif et support multi-shot.',
    costPerUnit: 0.1,
    costUnit: 'second',
    params: [PROMPT, DURATION_5_10, ASPECT_RATIO_VIDEO],
  },
  {
    id: 'fal-ai/kling-video/v3/standard/text-to-video',
    name: 'Kling 3.0 Standard (T2V)',
    provider: 'Kuaishou',
    backend: 'fal',
    category: 'video-generation',
    inputType: 'text-to-video',
    description: 'Kling 3.0 Standard: Version economique de Kling 3.0.',
    costPerUnit: 0.07,
    costUnit: 'second',
    params: [PROMPT, DURATION_5_10, ASPECT_RATIO_VIDEO],
  },
  {
    id: 'fal-ai/kling-video/v3/pro/image-to-video',
    name: 'Kling 3.0 Pro (I2V)',
    provider: 'Kuaishou',
    backend: 'fal',
    category: 'video-generation',
    inputType: 'image-to-video',
    description: 'Kling 3.0 Pro I2V: Videos cinematographiques depuis une image avec audio natif.',
    costPerUnit: 0.1,
    costUnit: 'second',
    new: true,
    acceptsImage: true,
    maxImages: 1,
    params: [PROMPT, DURATION_5_10],
  },
  {
    id: 'fal-ai/kling-video/v3/standard/image-to-video',
    name: 'Kling 3.0 Standard (I2V)',
    provider: 'Kuaishou',
    backend: 'fal',
    category: 'video-generation',
    inputType: 'image-to-video',
    description: 'Kling 3.0 Standard I2V: Animation image economique.',
    costPerUnit: 0.07,
    costUnit: 'second',
    acceptsImage: true,
    maxImages: 1,
    params: [PROMPT, DURATION_5_10],
  },

  // --- Kling V2.5 (Kuaishou) ---
  {
    id: 'fal-ai/kling-video/v2.5/pro/image-to-video',
    name: 'Kling 2.5 Pro (I2V)',
    provider: 'Kuaishou',
    backend: 'fal',
    category: 'video-generation',
    inputType: 'image-to-video',
    description: 'Transformez une image en video. Mouvements naturels, haute qualite.',
    costPerUnit: 0.07,
    costUnit: 'second',
    acceptsImage: true,
    maxImages: 1,
    params: [PROMPT, DURATION_5_10, ASPECT_RATIO_VIDEO],
  },
  {
    id: 'fal-ai/kling-video/v2.5-turbo/pro/text-to-video',
    name: 'Kling 2.5 Turbo Pro (T2V)',
    provider: 'Kuaishou',
    backend: 'fal',
    category: 'video-generation',
    inputType: 'text-to-video',
    description:
      'Kling 2.5 Turbo Pro: Fluidite du mouvement et precision du prompt exceptionnelles.',
    costPerUnit: 0.07,
    costUnit: 'second',
    params: [PROMPT, DURATION_5_10, ASPECT_RATIO_VIDEO],
  },
  {
    id: 'fal-ai/kling-video/v2.5-turbo/pro/image-to-video',
    name: 'Kling 2.5 Turbo Pro (I2V)',
    provider: 'Kuaishou',
    backend: 'fal',
    category: 'video-generation',
    inputType: 'image-to-video',
    description: 'Kling 2.5 Turbo Pro I2V: Generation image-to-video fluide et cinematographique.',
    costPerUnit: 0.07,
    costUnit: 'second',
    acceptsImage: true,
    maxImages: 1,
    params: [PROMPT, DURATION_5_10, ASPECT_RATIO_VIDEO],
  },

  // --- Veo 3 (Google) ---
  {
    id: 'fal-ai/veo3',
    name: 'Veo 3',
    provider: 'Google DeepMind',
    backend: 'fal',
    category: 'video-generation',
    inputType: 'text-to-video',
    description: 'Modele video premium de Google. Qualite cinematographique, avec audio genere.',
    costPerUnit: 0.4,
    costUnit: 'second',
    params: [
      PROMPT,
      {
        key: 'aspect_ratio',
        label: 'Format',
        type: 'select',
        default: '16:9',
        options: [
          { value: '16:9', label: '16:9 (Paysage)' },
          { value: '9:16', label: '9:16 (Portrait)' },
        ],
      },
      {
        key: 'generate_audio',
        label: "Generer l'audio",
        type: 'boolean',
        default: true,
      },
    ],
  },

  // --- Wan (Alibaba) ---
  {
    id: 'fal-ai/wan/v2.5/t2v',
    name: 'Wan 2.5 (T2V)',
    provider: 'Alibaba',
    backend: 'fal',
    category: 'video-generation',
    inputType: 'text-to-video',
    description: 'Video depuis texte par Alibaba. Economique, bon pour les contenus courts.',
    costPerUnit: 0.05,
    costUnit: 'second',
    params: [
      PROMPT,
      NEGATIVE_PROMPT,
      {
        key: 'num_frames',
        label: 'Nombre de frames',
        type: 'slider',
        default: 81,
        min: 17,
        max: 129,
        step: 8,
      },
      SEED,
    ],
  },
  {
    id: 'fal-ai/wan/v2.5/i2v',
    name: 'Wan 2.5 (I2V)',
    provider: 'Alibaba',
    backend: 'fal',
    category: 'video-generation',
    inputType: 'image-to-video',
    description: 'Animez une image avec Wan 2.5. Economique et rapide.',
    costPerUnit: 0.05,
    costUnit: 'second',
    acceptsImage: true,
    maxImages: 1,
    params: [
      PROMPT,
      NEGATIVE_PROMPT,
      {
        key: 'num_frames',
        label: 'Nombre de frames',
        type: 'slider',
        default: 81,
        min: 17,
        max: 129,
        step: 8,
      },
      SEED,
    ],
  },

  // --- Vidu Q3 ---
  {
    id: 'fal-ai/vidu/q3/text-to-video',
    name: 'Vidu Q3 (T2V)',
    provider: 'Vidu',
    backend: 'fal',
    category: 'video-generation',
    inputType: 'text-to-video',
    description:
      'Vidu Q3 Pro: Generation video haute qualite. $0.07/s pour 360p/540p, 2.2x pour 720p+.',
    costPerUnit: 0.07,
    costUnit: 'second',
    new: true,
    params: [PROMPT, ASPECT_RATIO_VIDEO, DURATION_5_10],
  },
  {
    id: 'fal-ai/vidu/q3/image-to-video',
    name: 'Vidu Q3 (I2V)',
    provider: 'Vidu',
    backend: 'fal',
    category: 'video-generation',
    inputType: 'image-to-video',
    description: "Vidu Q3 Pro image-to-video. Animation d'images de haute qualite.",
    costPerUnit: 0.07,
    costUnit: 'second',
    new: true,
    acceptsImage: true,
    maxImages: 1,
    params: [PROMPT, DURATION_5_10],
  },

  // --- PixVerse ---
  {
    id: 'fal-ai/pixverse/v5/image-to-video',
    name: 'PixVerse V5 (I2V)',
    provider: 'PixVerse',
    backend: 'fal',
    category: 'video-generation',
    inputType: 'image-to-video',
    description: 'PixVerse v5: Clips video haute qualite. $0.15-$0.40 selon resolution.',
    costPerUnit: 0.04,
    costUnit: 'second',
    acceptsImage: true,
    maxImages: 1,
    params: [
      PROMPT,
      {
        key: 'resolution',
        label: 'Resolution',
        type: 'select',
        default: '720p',
        options: [
          { value: '360p', label: '360p ($0.15/video)' },
          { value: '540p', label: '540p ($0.15/video)' },
          { value: '720p', label: '720p ($0.20/video)' },
          { value: '1080p', label: '1080p ($0.40/video)' },
        ],
      },
    ],
  },

  // --- LTX-2 ---
  {
    id: 'fal-ai/ltx-2-19b/image-to-video',
    name: 'LTX-2 19B (I2V)',
    provider: 'Lightricks',
    backend: 'fal',
    category: 'video-generation',
    inputType: 'image-to-video',
    description:
      'LTX-2 19B: Video avec audio depuis images. Open source, economique (~$0.20 par video).',
    costPerUnit: 0.05,
    costUnit: 'second',
    acceptsImage: true,
    maxImages: 2,
    params: [
      PROMPT,
      {
        key: 'num_frames',
        label: 'Nombre de frames',
        type: 'slider',
        default: 121,
        min: 33,
        max: 257,
        step: 8,
      },
      {
        key: 'generate_audio',
        label: "Generer l'audio",
        type: 'boolean',
        default: false,
      },
      SEED,
    ],
  },

  // --- MiniMax ---
  {
    id: 'fal-ai/minimax/video-01-live',
    name: 'MiniMax Hailuo',
    provider: 'MiniMax',
    backend: 'fal',
    category: 'video-generation',
    inputType: 'text-to-video',
    description: 'MiniMax Hailuo video generation. Style anime/realiste avec voix.',
    costPerUnit: 0.2,
    costUnit: 'video',
    params: [PROMPT],
  },
  {
    id: 'fal-ai/minimax/hailuo-02/standard/image-to-video',
    name: 'MiniMax Hailuo-02 (I2V)',
    provider: 'MiniMax',
    backend: 'fal',
    category: 'video-generation',
    inputType: 'image-to-video',
    description: 'Hailuo-02: Generation I2V avancee en 768p et 512p.',
    costPerUnit: 0.2,
    costUnit: 'video',
    acceptsImage: true,
    maxImages: 1,
    params: [PROMPT],
  },

  // --- Lucy (Decart) ---
  {
    id: 'fal-ai/decart/lucy-14b/image-to-video',
    name: 'Lucy-14B (I2V)',
    provider: 'Decart',
    backend: 'fal',
    category: 'video-generation',
    inputType: 'image-to-video',
    description: "Lucy-14B: Performance ultra-rapide pour l'image-to-video.",
    costPerUnit: 0.05,
    costUnit: 'second',
    acceptsImage: true,
    maxImages: 1,
    params: [PROMPT, SEED],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // VIDEO EDITING (video-to-video)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'fal-ai/sora-2/video-to-video/remix',
    name: 'Sora 2 Remix',
    provider: 'OpenAI',
    backend: 'fal',
    category: 'video-editing',
    inputType: 'video-to-video',
    description:
      'Sora 2 video-to-video remix. Transformez des videos existantes avec de nouveaux prompts et styles.',
    costPerUnit: 0.1,
    costUnit: 'second',
    featured: true,
    new: true,
    acceptsVideo: true,
    params: [PROMPT],
  },
  {
    id: 'fal-ai/xai/grok-imagine-video/edit-video',
    name: 'Grok Imagine Video Edit',
    provider: 'xAI',
    backend: 'fal',
    category: 'video-editing',
    inputType: 'video-to-video',
    description: 'Edition de videos avec xAI Grok Imagine. Transformez vos videos par instruction.',
    costPerUnit: 0.2,
    costUnit: 'second',
    new: true,
    acceptsVideo: true,
    params: [PROMPT],
  },
  {
    id: 'fal-ai/kling-video/o3/pro/video-to-video/edit',
    name: 'Kling O3 Pro V2V Edit',
    provider: 'Kuaishou',
    backend: 'fal',
    category: 'video-editing',
    inputType: 'video-to-video',
    description: 'Kling O3 Pro: Edition video avec qualite premium.',
    costPerUnit: 0.28,
    costUnit: 'second',
    new: true,
    acceptsVideo: true,
    params: [PROMPT],
  },
  {
    id: 'fal-ai/kling-video/o3/standard/video-to-video/edit',
    name: 'Kling O3 Standard V2V Edit',
    provider: 'Kuaishou',
    backend: 'fal',
    category: 'video-editing',
    inputType: 'video-to-video',
    description: 'Kling O3 Standard: Edition video economique.',
    costPerUnit: 0.14,
    costUnit: 'second',
    new: true,
    acceptsVideo: true,
    params: [PROMPT],
  },
  {
    id: 'fal-ai/bytedance/dreamactor/v2',
    name: 'DreamActor V2',
    provider: 'ByteDance',
    backend: 'fal',
    category: 'video-editing',
    inputType: 'video-to-video',
    description:
      'Transfert de mouvement depuis une video vers des personnages dans une image. Excellent pour non-humains et personnages multiples.',
    costPerUnit: 0.1,
    costUnit: 'second',
    new: true,
    acceptsVideo: true,
    acceptsImage: true,
    params: [PROMPT],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // UPSCALE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'fal-ai/topaz/upscale/image',
    name: 'Topaz Photo AI',
    provider: 'Topaz Labs',
    backend: 'fal',
    category: 'upscale',
    inputType: 'image-upscale',
    description:
      "Upscale haute fidelite x4, standard industrie pre-presse. Amelioration des visages et details. Ideal pour l'impression.",
    costPerUnit: 0.1,
    costUnit: 'image',
    featured: true,
    acceptsImage: true,
    maxImages: 1,
    params: [
      {
        key: 'upscale_factor',
        label: 'Facteur',
        type: 'select',
        default: '4',
        options: [
          { value: '2', label: 'x2' },
          { value: '4', label: 'x4' },
        ],
      },
      {
        key: 'model',
        label: 'Modele',
        type: 'select',
        default: 'High Fidelity V2',
        options: [
          { value: 'High Fidelity V2', label: 'High Fidelity V2 (Fidele)' },
          { value: 'Standard V2', label: 'Standard V2' },
        ],
      },
      {
        key: 'face_enhancement',
        label: 'Ameliorer les visages',
        type: 'boolean',
        default: true,
      },
    ],
  },
  {
    id: 'fal-ai/topaz/upscale/video',
    name: 'Topaz Video AI',
    provider: 'Topaz Labs',
    backend: 'fal',
    category: 'upscale',
    inputType: 'video-upscale',
    description: 'Upscale video professionnel avec Topaz. Augmentez la resolution de vos videos.',
    costPerUnit: 0.2,
    costUnit: 'second',
    new: true,
    acceptsVideo: true,
    params: [
      {
        key: 'upscale_factor',
        label: 'Facteur',
        type: 'select',
        default: '2',
        options: [
          { value: '2', label: 'x2' },
          { value: '4', label: 'x4' },
        ],
      },
    ],
  },
  {
    id: 'fal-ai/aura-sr',
    name: 'Aura SR',
    provider: 'fal.ai',
    backend: 'fal',
    category: 'upscale',
    inputType: 'image-upscale',
    description: 'Upscale rapide x4. Ideal pour ameliorer la resolution de vos images.',
    costPerUnit: 0.02,
    costUnit: 'image',
    acceptsImage: true,
    maxImages: 1,
    params: [
      {
        key: 'upscaling_factor',
        label: 'Facteur',
        type: 'select',
        default: '4',
        options: [
          { value: '2', label: 'x2' },
          { value: '4', label: 'x4' },
        ],
      },
    ],
  },
  {
    id: 'fal-ai/clarity-upscaler',
    name: 'Clarity Upscaler',
    provider: 'fal.ai',
    backend: 'fal',
    category: 'upscale',
    inputType: 'image-upscale',
    description: 'Upscale avec amelioration des details. Ajout de details IA pour un resultat net.',
    costPerUnit: 0.04,
    costUnit: 'image',
    acceptsImage: true,
    maxImages: 1,
    params: [
      PROMPT,
      {
        key: 'scale_factor',
        label: 'Facteur',
        type: 'slider',
        default: 2,
        min: 1,
        max: 4,
        step: 0.5,
      },
      NEGATIVE_PROMPT,
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // IMAGE TOOLS (Local - traitement cote client, gratuit)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'local/grayscale',
    name: 'Noir & Blanc',
    provider: 'Tribal Studio',
    backend: 'local',
    category: 'image-editing',
    inputType: 'image-to-image',
    description:
      'Conversion en noir et blanc (niveaux de gris). Formule ITU-R BT.709 pour un rendu naturel. Traitement local instantane et gratuit.',
    costPerUnit: 0,
    costUnit: 'image',
    featured: true,
    acceptsImage: true,
    maxImages: 1,
    params: [
      {
        key: 'intensity',
        label: 'Intensite',
        type: 'slider',
        default: 100,
        min: 0,
        max: 100,
        step: 5,
      },
      {
        key: 'contrast',
        label: 'Contraste',
        type: 'slider',
        default: 0,
        min: -50,
        max: 50,
        step: 5,
      },
    ],
  },
  {
    id: 'local/sepia',
    name: 'Sepia',
    provider: 'Tribal Studio',
    backend: 'local',
    category: 'image-editing',
    inputType: 'image-to-image',
    description:
      'Effet sepia vintage. Donne un ton chaud brun/jaune a vos photos. Traitement local instantane et gratuit.',
    costPerUnit: 0,
    costUnit: 'image',
    acceptsImage: true,
    maxImages: 1,
    params: [
      {
        key: 'intensity',
        label: 'Intensite',
        type: 'slider',
        default: 100,
        min: 0,
        max: 100,
        step: 5,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // REMOVE BACKGROUND
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'fal-ai/bria/rmbg',
    name: 'Bria RMBG',
    provider: 'Bria AI',
    backend: 'fal',
    category: 'remove-bg',
    inputType: 'image-remove-bg',
    description: 'Suppression de fond rapide et precise. Commercial-ready.',
    costPerUnit: 0.01,
    costUnit: 'image',
    featured: true,
    acceptsImage: true,
    maxImages: 1,
    params: [],
  },
  {
    id: 'fal-ai/bria/background/remove',
    name: 'Bria RMBG 2.0',
    provider: 'Bria AI',
    backend: 'fal',
    category: 'remove-bg',
    inputType: 'image-remove-bg',
    description:
      'Bria RMBG 2.0: Suppression de fond haute resolution. Entraine sur donnees licenciees, usage commercial sans risque.',
    costPerUnit: 0.01,
    costUnit: 'image',
    new: true,
    acceptsImage: true,
    maxImages: 1,
    params: [],
  },
  {
    id: 'fal-ai/birefnet',
    name: 'BiRefNet',
    provider: 'fal.ai',
    backend: 'fal',
    category: 'remove-bg',
    inputType: 'image-remove-bg',
    description: 'Segmentation avancee avec BiRefNet. Excellent pour les cheveux et details fins.',
    costPerUnit: 0.01,
    costUnit: 'image',
    acceptsImage: true,
    maxImages: 1,
    params: [],
  },
  {
    id: 'fal-ai/bria/video/background-removal',
    name: 'Bria Video BG Removal',
    provider: 'Bria AI',
    backend: 'fal',
    category: 'remove-bg',
    inputType: 'video-remove-bg',
    description:
      'Suppression automatique du fond de videos. Parfait pour du contenu professionnel sans fond vert.',
    costPerUnit: 0.05,
    costUnit: 'second',
    new: true,
    acceptsVideo: true,
    params: [],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 3D
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'fal-ai/hunyuan-3d/v3.1/rapid/image-to-3d',
    name: 'Hunyuan 3D V3.1 Rapid',
    provider: 'Tencent',
    backend: 'fal',
    category: '3d',
    inputType: 'image-to-3d',
    description: 'Generation 3D rapide depuis une image. Mesh complet en quelques secondes.',
    costPerUnit: 0.1,
    costUnit: 'request',
    featured: true,
    acceptsImage: true,
    maxImages: 1,
    params: [
      {
        key: 'generate_texture',
        label: 'Generer la texture',
        type: 'boolean',
        default: true,
      },
    ],
  },
  {
    id: 'fal-ai/hunyuan-3d/v3.1/rapid/text-to-3d',
    name: 'Hunyuan 3D V3.1 Text',
    provider: 'Tencent',
    backend: 'fal',
    category: '3d',
    inputType: 'text-to-3d',
    description: 'Generation 3D depuis du texte. Creez des modeles 3D textures rapidement.',
    costPerUnit: 0.1,
    costUnit: 'request',
    new: true,
    params: [
      PROMPT,
      {
        key: 'generate_texture',
        label: 'Generer la texture',
        type: 'boolean',
        default: true,
      },
    ],
  },
  {
    id: 'fal-ai/hunyuan-3d/v3.1/pro/text-to-3d',
    name: 'Hunyuan 3D V3.1 Pro',
    provider: 'Tencent',
    backend: 'fal',
    category: '3d',
    inputType: 'text-to-3d',
    description:
      'Version Pro de Hunyuan 3D. Qualite superieure pour les modeles 3D depuis du texte.',
    costPerUnit: 0.2,
    costUnit: 'request',
    new: true,
    params: [
      PROMPT,
      {
        key: 'generate_texture',
        label: 'Generer la texture',
        type: 'boolean',
        default: true,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIO / TTS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'fal-ai/minimax/speech-2.8-hd',
    name: 'MiniMax Speech 2.8 HD',
    provider: 'MiniMax',
    backend: 'fal',
    category: 'audio',
    inputType: 'text-to-audio',
    description: 'Synthese vocale HD premium. Voix naturelles haute qualite, multi-langues.',
    costPerUnit: 0.02,
    costUnit: 'request',
    featured: true,
    new: true,
    params: [
      TEXT_INPUT,
      {
        key: 'voice_id',
        label: 'Voix',
        type: 'select',
        default: 'Wise_Woman',
        options: [
          { value: 'Wise_Woman', label: 'Femme sage' },
          { value: 'Friendly_Person', label: 'Personne amicale' },
          { value: 'Inspirational_girl', label: 'Fille inspirante' },
          { value: 'Deep_Voice_Man', label: 'Homme voix grave' },
          { value: 'Calm_Woman', label: 'Femme calme' },
          { value: 'Casual_Guy', label: 'Homme decontracte' },
        ],
      },
    ],
  },
  {
    id: 'fal-ai/minimax/speech-2.8-turbo',
    name: 'MiniMax Speech 2.8 Turbo',
    provider: 'MiniMax',
    backend: 'fal',
    category: 'audio',
    inputType: 'text-to-audio',
    description: 'Synthese vocale rapide. Voix naturelles, generation ultra-rapide.',
    costPerUnit: 0.01,
    costUnit: 'request',
    new: true,
    params: [
      TEXT_INPUT,
      {
        key: 'voice_id',
        label: 'Voix',
        type: 'select',
        default: 'Wise_Woman',
        options: [
          { value: 'Wise_Woman', label: 'Femme sage' },
          { value: 'Friendly_Person', label: 'Personne amicale' },
          { value: 'Inspirational_girl', label: 'Fille inspirante' },
          { value: 'Deep_Voice_Man', label: 'Homme voix grave' },
          { value: 'Calm_Woman', label: 'Femme calme' },
          { value: 'Casual_Guy', label: 'Homme decontracte' },
        ],
      },
    ],
  },
  {
    id: 'fal-ai/minimax-speech/v2-8',
    name: 'MiniMax Speech 2.8',
    provider: 'MiniMax',
    backend: 'fal',
    category: 'audio',
    inputType: 'text-to-audio',
    description: 'Synthese vocale standard. Voix naturelles, multi-langues.',
    costPerUnit: 0.01,
    costUnit: 'request',
    params: [
      TEXT_INPUT,
      {
        key: 'voice_id',
        label: 'Voix',
        type: 'select',
        default: 'Wise_Woman',
        options: [
          { value: 'Wise_Woman', label: 'Femme sage' },
          { value: 'Friendly_Person', label: 'Personne amicale' },
          { value: 'Inspirational_girl', label: 'Fille inspirante' },
          { value: 'Deep_Voice_Man', label: 'Homme voix grave' },
          { value: 'Calm_Woman', label: 'Femme calme' },
          { value: 'Casual_Guy', label: 'Homme decontracte' },
        ],
      },
    ],
  },
  {
    id: 'fal-ai/chatterbox/text-to-speech',
    name: 'Chatterbox TTS',
    provider: 'Resemble AI',
    backend: 'fal',
    category: 'audio',
    inputType: 'text-to-audio',
    description: 'TTS de Resemble AI. Ideal pour memes, videos, jeux et agents IA.',
    costPerUnit: 0.01,
    costUnit: 'request',
    new: true,
    params: [TEXT_INPUT],
  },
  {
    id: 'fal-ai/playai/tts/v3',
    name: 'PlayAI TTS V3',
    provider: 'PlayAI',
    backend: 'fal',
    category: 'audio',
    inputType: 'text-to-audio',
    description: 'Text-to-Speech ultra realiste. Voix expressives avec emotions.',
    costPerUnit: 0.01,
    costUnit: 'request',
    params: [
      TEXT_INPUT,
      {
        key: 'voice',
        label: 'Voix',
        type: 'select',
        default:
          's3://voice-cloning-zero-shot/d9ff78ba-d016-47f6-b0ef-dd630f59414e/female-cs/manifest.json',
        options: [
          {
            value:
              's3://voice-cloning-zero-shot/d9ff78ba-d016-47f6-b0ef-dd630f59414e/female-cs/manifest.json',
            label: 'Femme (FR)',
          },
          {
            value:
              's3://voice-cloning-zero-shot/baf1ef41-36b6-428c-9bdf-50ba54682571/original/manifest.json',
            label: 'Homme (FR)',
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MUSIC / SFX
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'fal-ai/beatoven/music-generation',
    name: 'Beatoven Music',
    provider: 'Beatoven',
    backend: 'fal',
    category: 'music',
    inputType: 'text-to-audio',
    description:
      'Musique instrumentale libre de droits. Electronique, hip hop, rock indie, cinematique, classique. Ideal pour jeux, films, reseaux sociaux.',
    costPerUnit: 0.05,
    costUnit: 'request',
    featured: true,
    new: true,
    params: [
      {
        key: 'prompt',
        label: 'Description musicale',
        type: 'textarea',
        required: true,
        placeholder: 'Decrivez la musique souhaitee (genre, ambiance, tempo...)',
      },
      {
        key: 'duration',
        label: 'Duree (secondes)',
        type: 'slider',
        default: 30,
        min: 5,
        max: 120,
        step: 5,
      },
    ],
  },
  {
    id: 'fal-ai/beatoven/sound-effect-generation',
    name: 'Beatoven SFX',
    provider: 'Beatoven',
    backend: 'fal',
    category: 'music',
    inputType: 'text-to-audio',
    description:
      'Effets sonores professionnels. Animaux, vehicules, nature, sci-fi. Pour films, jeux et contenu digital.',
    costPerUnit: 0.03,
    costUnit: 'request',
    new: true,
    params: [
      {
        key: 'prompt',
        label: 'Description du son',
        type: 'textarea',
        required: true,
        placeholder: "Decrivez l'effet sonore souhaite...",
      },
      {
        key: 'duration',
        label: 'Duree (secondes)',
        type: 'slider',
        default: 5,
        min: 1,
        max: 30,
        step: 1,
      },
    ],
  },
  {
    id: 'fal-ai/mirelo-ai/sfx-v1/video-to-video',
    name: 'Mirelo SFX (V2V)',
    provider: 'Mirelo AI',
    backend: 'fal',
    category: 'music',
    inputType: 'video-to-video',
    description:
      'Generez des sons synchronises pour vos videos. Retourne la video avec sa nouvelle bande sonore.',
    costPerUnit: 0.05,
    costUnit: 'second',
    new: true,
    acceptsVideo: true,
    params: [],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AVATAR / LIPSYNC
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'fal-ai/creatify/aurora',
    name: 'Creatify Aurora',
    provider: 'Creatify',
    backend: 'fal',
    category: 'avatar',
    inputType: 'image-to-avatar',
    description:
      'Avatar studio haute fidelite. Videos de qualite studio avec votre avatar qui parle ou chante. $0.10-0.14/s.',
    costPerUnit: 0.14,
    costUnit: 'second',
    featured: true,
    new: true,
    acceptsImage: true,
    acceptsAudio: true,
    maxImages: 1,
    params: [],
  },
  {
    id: 'fal-ai/veed/fabric-1.0',
    name: 'VEED Fabric 1.0',
    provider: 'VEED',
    backend: 'fal',
    category: 'avatar',
    inputType: 'image-to-avatar',
    description: 'VEED Fabric: Transformez une image en video parlante. Lipsync automatique.',
    costPerUnit: 0.1,
    costUnit: 'second',
    new: true,
    acceptsImage: true,
    acceptsAudio: true,
    maxImages: 1,
    params: [],
  },
  {
    id: 'fal-ai/bytedance/omnihuman/v1.5',
    name: 'OmniHuman V1.5',
    provider: 'ByteDance',
    backend: 'fal',
    category: 'avatar',
    inputType: 'image-to-avatar',
    description:
      "OmniHuman v1.5: Video haute qualite depuis image + audio. Emotions et mouvements correles a l'audio.",
    costPerUnit: 0.1,
    costUnit: 'second',
    new: true,
    acceptsImage: true,
    acceptsAudio: true,
    maxImages: 1,
    params: [],
  },
  {
    id: 'fal-ai/ai-avatar/single-text',
    name: 'AI Avatar (Texte)',
    provider: 'MultiTalk',
    backend: 'fal',
    category: 'avatar',
    inputType: 'image-to-avatar',
    description:
      'Avatar parlant depuis image + texte. Convertit le texte en parole automatiquement puis genere le lipsync.',
    costPerUnit: 0.1,
    costUnit: 'second',
    acceptsImage: true,
    maxImages: 1,
    params: [TEXT_INPUT],
  },
  {
    id: 'fal-ai/sync-lipsync/v2',
    name: 'Sync Lipsync V2',
    provider: 'Sync Labs',
    backend: 'fal',
    category: 'avatar',
    inputType: 'image-to-avatar',
    description: 'Synchronisation labiale. Faites parler un visage avec un audio.',
    costPerUnit: 0.1,
    costUnit: 'second',
    acceptsImage: true,
    acceptsAudio: true,
    maxImages: 1,
    params: [],
  },
  {
    id: 'fal-ai/pixverse/lipsync',
    name: 'PixVerse Lipsync',
    provider: 'PixVerse',
    backend: 'fal',
    category: 'avatar',
    inputType: 'video-to-video',
    description: 'Lipsync realiste par PixVerse. Synchronisation labiale haute qualite.',
    costPerUnit: 0.1,
    costUnit: 'second',
    acceptsVideo: true,
    acceptsAudio: true,
    params: [],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // IMAGE GENERATION — ADDITIONAL MODELS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'fal-ai/flux-krea-lora/stream',
    name: 'Flux Krea LoRA Stream',
    provider: 'Black Forest Labs',
    backend: 'fal',
    category: 'image-generation',
    inputType: 'text-to-image',
    description:
      'Endpoint ultra-rapide FLUX.1 [dev] avec support LoRA. Generation et personnalisation rapides pour styles, marques et produits.',
    costPerUnit: 0.02,
    costUnit: 'image',
    new: true,
    params: [PROMPT, COMMON_IMAGE_SIZE_HD, ASPECT_RATIO_FULL, NUM_IMAGES, GUIDANCE_SCALE, SEED],
  },
  {
    id: 'fal-ai/bytedance/seedream/v4/text-to-image',
    name: 'Seedream V4',
    provider: 'ByteDance',
    backend: 'fal',
    category: 'image-generation',
    inputType: 'text-to-image',
    description:
      'Seedream 4.0 de ByteDance. Architecture unifiee generation + edition. Bon pour les styles varies.',
    costPerUnit: 0.03,
    costUnit: 'image',
    params: [PROMPT, COMMON_IMAGE_SIZE_HD, ASPECT_RATIO_FULL, NUM_IMAGES, SEED],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // IMAGE EDITING — ADDITIONAL MODELS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'fal-ai/flux-2/klein/realtime',
    name: 'Flux 2 Klein Realtime',
    provider: 'Black Forest Labs',
    backend: 'fal',
    category: 'image-editing',
    inputType: 'image-to-image',
    description:
      'Generation en temps reel avec FLUX.2 [klein]. Ultra-rapide pour le prototypage et les iterations.',
    costPerUnit: 0.01,
    costUnit: 'image',
    new: true,
    acceptsImage: true,
    maxImages: 1,
    params: [PROMPT, SEED],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // VIDEO GENERATION — ADDITIONAL MODELS
  // ═══════════════════════════════════════════════════════════════════════════

  // --- Veo 3.1 Additional ---
  {
    id: 'fal-ai/veo3.1/reference-to-video',
    name: 'Veo 3.1 Reference',
    provider: 'Google DeepMind',
    backend: 'fal',
    category: 'video-generation',
    inputType: 'image-to-video',
    description:
      'Veo 3.1 reference-to-video. Generez des videos coherentes avec vos images de reference (sujets, style).',
    costPerUnit: 0.4,
    costUnit: 'second',
    new: true,
    acceptsImage: true,
    maxImages: 3,
    params: [
      PROMPT,
      {
        key: 'resolution',
        label: 'Resolution',
        type: 'select',
        default: '720p',
        options: [
          { value: '720p', label: '720p' },
          { value: '1080p', label: '1080p' },
          { value: '4k', label: '4K (premium)' },
        ],
      },
      {
        key: 'generate_audio',
        label: "Generer l'audio",
        type: 'boolean',
        default: true,
      },
    ],
  },
  {
    id: 'fal-ai/veo3.1/first-last-frame-to-video',
    name: 'Veo 3.1 First/Last Frame',
    provider: 'Google DeepMind',
    backend: 'fal',
    category: 'video-generation',
    inputType: 'image-to-video',
    description:
      'Veo 3.1: Animez entre une premiere et derniere image. Controle precis du debut et de la fin.',
    costPerUnit: 0.4,
    costUnit: 'second',
    new: true,
    acceptsImage: true,
    maxImages: 2,
    params: [
      PROMPT,
      {
        key: 'duration',
        label: 'Duree',
        type: 'select',
        default: '8s',
        options: [
          { value: '4s', label: '4 secondes' },
          { value: '6s', label: '6 secondes' },
          { value: '8s', label: '8 secondes' },
        ],
      },
      {
        key: 'resolution',
        label: 'Resolution',
        type: 'select',
        default: '720p',
        options: [
          { value: '720p', label: '720p' },
          { value: '1080p', label: '1080p' },
          { value: '4k', label: '4K (premium)' },
        ],
      },
      {
        key: 'generate_audio',
        label: "Generer l'audio",
        type: 'boolean',
        default: true,
      },
    ],
  },
  {
    id: 'fal-ai/veo3.1/fast/first-last-frame-to-video',
    name: 'Veo 3.1 Fast First/Last',
    provider: 'Google DeepMind',
    backend: 'fal',
    category: 'video-generation',
    inputType: 'image-to-video',
    description: 'Version rapide de Veo 3.1 First/Last Frame. Economique pour le prototypage.',
    costPerUnit: 0.2,
    costUnit: 'second',
    new: true,
    acceptsImage: true,
    maxImages: 2,
    params: [
      PROMPT,
      {
        key: 'generate_audio',
        label: "Generer l'audio",
        type: 'boolean',
        default: true,
      },
    ],
  },

  // --- Kling O3 Reference-to-Video ---
  {
    id: 'fal-ai/kling-video/o3/pro/reference-to-video',
    name: 'Kling O3 Pro Ref (I2V)',
    provider: 'Kuaishou',
    backend: 'fal',
    category: 'video-generation',
    inputType: 'image-to-video',
    description:
      'Kling O3 Pro Reference: Transformez images et elements en scenes video coherentes. Identite stable des personnages.',
    costPerUnit: 0.28,
    costUnit: 'second',
    new: true,
    acceptsImage: true,
    maxImages: 4,
    params: [PROMPT, DURATION_5_10, ASPECT_RATIO_VIDEO],
  },
  {
    id: 'fal-ai/kling-video/o3/standard/reference-to-video',
    name: 'Kling O3 Std Ref (I2V)',
    provider: 'Kuaishou',
    backend: 'fal',
    category: 'video-generation',
    inputType: 'image-to-video',
    description:
      'Kling O3 Standard Reference: Version economique de la generation reference-to-video.',
    costPerUnit: 0.14,
    costUnit: 'second',
    new: true,
    acceptsImage: true,
    maxImages: 4,
    params: [PROMPT, DURATION_5_10, ASPECT_RATIO_VIDEO],
  },

  // --- Kling O3/V3 Video Reference (V2V) ---
  {
    id: 'fal-ai/kling-video/o3/pro/video-to-video/reference',
    name: 'Kling O3 Pro V2V Ref',
    provider: 'Kuaishou',
    backend: 'fal',
    category: 'video-editing',
    inputType: 'video-to-video',
    description:
      'Kling O3 Pro video reference: Generez de nouveaux plans guides par une video de reference. Preserve le langage cinematographique.',
    costPerUnit: 0.28,
    costUnit: 'second',
    new: true,
    acceptsVideo: true,
    params: [PROMPT],
  },
  {
    id: 'fal-ai/kling-video/o3/standard/video-to-video/reference',
    name: 'Kling O3 Std V2V Ref',
    provider: 'Kuaishou',
    backend: 'fal',
    category: 'video-editing',
    inputType: 'video-to-video',
    description:
      'Kling O3 Standard video reference: Version economique de la generation video guidee par reference.',
    costPerUnit: 0.14,
    costUnit: 'second',
    new: true,
    acceptsVideo: true,
    params: [PROMPT],
  },

  // --- Kling 2.1 Pro/Master ---
  {
    id: 'fal-ai/kling-video/v2.1/pro/image-to-video',
    name: 'Kling 2.1 Pro (I2V)',
    provider: 'Kuaishou',
    backend: 'fal',
    category: 'video-generation',
    inputType: 'image-to-video',
    description:
      'Kling 2.1 Pro: Videos haute fidelite avec mouvements de camera precis et controle dynamique.',
    costPerUnit: 0.07,
    costUnit: 'second',
    acceptsImage: true,
    maxImages: 1,
    params: [PROMPT, DURATION_5_10, ASPECT_RATIO_VIDEO],
  },
  {
    id: 'fal-ai/kling-video/v2.1/master/image-to-video',
    name: 'Kling 2.1 Master (I2V)',
    provider: 'Kuaishou',
    backend: 'fal',
    category: 'video-generation',
    inputType: 'image-to-video',
    description:
      'Kling 2.1 Master: Qualite premium, fluidite de mouvement inegalee et visuels cinematographiques.',
    costPerUnit: 0.1,
    costUnit: 'second',
    acceptsImage: true,
    maxImages: 1,
    params: [PROMPT, DURATION_5_10, ASPECT_RATIO_VIDEO],
  },

  // --- Wan 2.6 ---
  {
    id: 'fal-ai/wan/v2.6/reference-to-video/flash',
    name: 'Wan 2.6 Ref (Flash)',
    provider: 'Alibaba',
    backend: 'fal',
    category: 'video-generation',
    inputType: 'image-to-video',
    description:
      'Wan 2.6 reference-to-video flash. Generation rapide de videos guidees par des images de reference.',
    costPerUnit: 0.05,
    costUnit: 'second',
    new: true,
    acceptsImage: true,
    maxImages: 1,
    params: [PROMPT, SEED],
  },

  // --- Wan 2.2 ---
  {
    id: 'fal-ai/wan/v2.2-a14b/image-to-video',
    name: 'Wan 2.2 A14B (I2V)',
    provider: 'Alibaba',
    backend: 'fal',
    category: 'video-generation',
    inputType: 'image-to-video',
    description:
      'Wan 2.2 image-to-video 14B. Videos haute qualite avec diversite de mouvement. Support LoRA.',
    costPerUnit: 0.05,
    costUnit: 'second',
    acceptsImage: true,
    maxImages: 1,
    params: [PROMPT, NEGATIVE_PROMPT, SEED],
  },

  // --- LTX-Video 13B Distilled ---
  {
    id: 'fal-ai/ltx-video-13b-distilled/image-to-video',
    name: 'LTX-Video 13B Distilled (I2V)',
    provider: 'Lightricks',
    backend: 'fal',
    category: 'video-generation',
    inputType: 'image-to-video',
    description:
      'LTX-Video 13B Distilled: Generez des videos depuis des prompts et images avec support LoRA custom.',
    costPerUnit: 0.05,
    costUnit: 'second',
    acceptsImage: true,
    maxImages: 1,
    params: [PROMPT, SEED],
  },

  // --- Kling Avatar ---
  {
    id: 'fal-ai/kling-video/v1/pro/ai-avatar',
    name: 'Kling AI Avatar Pro',
    provider: 'Kuaishou',
    backend: 'fal',
    category: 'avatar',
    inputType: 'image-to-avatar',
    description:
      'Kling AI Avatar Pro: Creation de videos avatar avec humains, animaux, dessins animes ou personnages stylises.',
    costPerUnit: 0.1,
    costUnit: 'second',
    acceptsImage: true,
    acceptsAudio: true,
    maxImages: 1,
    params: [],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIO — ADDITIONAL MODELS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'fal-ai/minimax/speech-02-hd',
    name: 'MiniMax Speech-02 HD',
    provider: 'MiniMax',
    backend: 'fal',
    category: 'audio',
    inputType: 'text-to-audio',
    description:
      'MiniMax Speech-02 HD: Synthese vocale haute qualite. Generation avancee multi-langues.',
    costPerUnit: 0.02,
    costUnit: 'request',
    params: [
      TEXT_INPUT,
      {
        key: 'voice_id',
        label: 'Voix',
        type: 'select',
        default: 'Wise_Woman',
        options: [
          { value: 'Wise_Woman', label: 'Femme sage' },
          { value: 'Friendly_Person', label: 'Personne amicale' },
          { value: 'Inspirational_girl', label: 'Fille inspirante' },
          { value: 'Deep_Voice_Man', label: 'Homme voix grave' },
          { value: 'Calm_Woman', label: 'Femme calme' },
          { value: 'Casual_Guy', label: 'Homme decontracte' },
        ],
      },
    ],
  },
  {
    id: 'fal-ai/dia-tts/voice-clone',
    name: 'Dia TTS Voice Clone',
    provider: 'Dia',
    backend: 'fal',
    category: 'audio',
    inputType: 'audio-to-audio',
    description:
      'Clonage de voix dialogue. Clonez des voix depuis un echantillon audio et generez des dialogues. TTS haute qualite.',
    costPerUnit: 0.02,
    costUnit: 'request',
    new: true,
    acceptsAudio: true,
    params: [
      TEXT_INPUT,
      {
        key: 'ref_text',
        label: 'Texte de reference',
        type: 'textarea',
        required: true,
        placeholder: '[S1] Premiere voix... [S2] Deuxieme voix...',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MUSIC / SFX — ADDITIONAL MODELS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'fal-ai/mirelo-ai/sfx-v1/video-to-audio',
    name: 'Mirelo SFX (V2A)',
    provider: 'Mirelo AI',
    backend: 'fal',
    category: 'music',
    inputType: 'video-to-audio',
    description:
      'Generez des sons synchronises pour vos videos. Retourne uniquement la piste sonore generee.',
    costPerUnit: 0.05,
    costUnit: 'second',
    new: true,
    acceptsVideo: true,
    params: [],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FACE SWAP
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'fal-ai/half-moon-ai/ai-face-swap/faceswapimagemulti',
    name: 'AI Face Swap (Image)',
    provider: 'Half Moon AI',
    backend: 'fal',
    category: 'face-swap',
    inputType: 'image-to-image',
    description:
      'Echangez plusieurs visages dans une photo de maniere realiste. Supporte plusieurs personnes dans une meme image.',
    costPerUnit: 0.05,
    costUnit: 'image',
    featured: true,
    new: true,
    acceptsImage: true,
    maxImages: 5,
    params: [],
  },
  {
    id: 'fal-ai/half-moon-ai/ai-face-swap/faceswapvideomulti',
    name: 'AI Face Swap (Video)',
    provider: 'Half Moon AI',
    backend: 'fal',
    category: 'face-swap',
    inputType: 'video-to-video',
    description:
      'Echangez plusieurs visages dans une video de maniere realiste. Supporte plusieurs personnes.',
    costPerUnit: 0.1,
    costUnit: 'second',
    new: true,
    acceptsVideo: true,
    acceptsImage: true,
    params: [],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 3D — ADDITIONAL MODELS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'fal-ai/meshy/v6/image-to-3d',
    name: 'Meshy 6 (I2-3D)',
    provider: 'Meshy',
    backend: 'fal',
    category: '3d',
    inputType: 'image-to-3d',
    description:
      'Meshy-6: Derniere generation de modeles 3D realistes et production-ready depuis une image. Geometrie precise et textures superieures.',
    costPerUnit: 0.2,
    costUnit: 'request',
    featured: true,
    new: true,
    acceptsImage: true,
    maxImages: 1,
    params: [
      {
        key: 'topology',
        label: 'Topologie',
        type: 'select',
        default: 'triangle',
        options: [
          { value: 'triangle', label: 'Triangle (detail)' },
          { value: 'quad', label: 'Quad (surfaces lisses)' },
        ],
      },
      {
        key: 'target_polycount',
        label: 'Nombre de polygones',
        type: 'slider',
        default: 30000,
        min: 5000,
        max: 100000,
        step: 5000,
      },
      {
        key: 'enable_pbr',
        label: 'Maps PBR (metallic, roughness, normal)',
        type: 'boolean',
        default: false,
      },
      {
        key: 'generate_texture',
        label: 'Generer la texture',
        type: 'boolean',
        default: true,
      },
    ],
  },
  {
    id: 'fal-ai/meshy/v6/text-to-3d',
    name: 'Meshy 6 (T2-3D)',
    provider: 'Meshy',
    backend: 'fal',
    category: '3d',
    inputType: 'text-to-3d',
    description: 'Meshy-6: Generez des modeles 3D realistes et production-ready depuis du texte.',
    costPerUnit: 0.2,
    costUnit: 'request',
    new: true,
    params: [
      PROMPT,
      {
        key: 'topology',
        label: 'Topologie',
        type: 'select',
        default: 'triangle',
        options: [
          { value: 'triangle', label: 'Triangle (detail)' },
          { value: 'quad', label: 'Quad (surfaces lisses)' },
        ],
      },
      {
        key: 'target_polycount',
        label: 'Nombre de polygones',
        type: 'slider',
        default: 30000,
        min: 5000,
        max: 100000,
        step: 5000,
      },
      {
        key: 'enable_pbr',
        label: 'Maps PBR',
        type: 'boolean',
        default: false,
      },
      {
        key: 'generate_texture',
        label: 'Generer la texture',
        type: 'boolean',
        default: true,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITY
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'fal-ai/x-ailab/nsfwvision',
    name: 'NSFW Vision',
    provider: 'X-AILab',
    backend: 'fal',
    category: 'utility',
    inputType: 'image-classify',
    description:
      'Detection NSFW/SFW. Predisez si une image est inappropriee. Utile pour la moderation de contenu.',
    costPerUnit: 0.005,
    costUnit: 'image',
    acceptsImage: true,
    maxImages: 1,
    params: [],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // WORKFLOW UTILITIES (FFMPEG)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'fal-ai/workflow-utilities/impulse-response',
    name: 'Impulse Response',
    provider: 'fal.ai',
    backend: 'fal',
    category: 'utility',
    inputType: 'audio-to-audio',
    description:
      'Utilitaire FFMPEG pour appliquer une reponse impulsionnelle a un fichier audio. Simule des environnements acoustiques.',
    costPerUnit: 0.005,
    costUnit: 'request',
    new: true,
    acceptsAudio: true,
    params: [
      {
        key: 'audio_url',
        label: 'Audio source',
        type: 'text',
        default: '',
      },
      {
        key: 'ir_url',
        label: 'Impulse Response URL',
        type: 'text',
        default: '',
      },
    ],
  },
  {
    id: 'fal-ai/workflow-utilities/extract-nth-frame',
    name: 'Extract Nth Frame',
    provider: 'fal.ai',
    backend: 'fal',
    category: 'utility',
    inputType: 'image-to-image',
    description:
      "Utilitaire FFMPEG pour extraire la Nieme frame d'une video. Utile pour obtenir une image specifique d'un clip.",
    costPerUnit: 0.005,
    costUnit: 'request',
    new: true,
    acceptsVideo: true,
    params: [
      {
        key: 'video_url',
        label: 'Video URL',
        type: 'text',
        default: '',
      },
      {
        key: 'n',
        label: 'Numero de frame',
        type: 'number',
        default: 1,
        min: 1,
        max: 10000,
      },
    ],
  },
  {
    id: 'fal-ai/workflow-utilities/blend-video',
    name: 'Blend Video',
    provider: 'fal.ai',
    backend: 'fal',
    category: 'utility',
    inputType: 'video-to-video',
    description:
      'Utilitaire FFMPEG pour fusionner/mixer deux videos ensemble. Blend, transition et composition video.',
    costPerUnit: 0.005,
    costUnit: 'request',
    new: true,
    acceptsVideo: true,
    params: [
      {
        key: 'video_url_1',
        label: 'Video 1 URL',
        type: 'text',
        default: '',
      },
      {
        key: 'video_url_2',
        label: 'Video 2 URL',
        type: 'text',
        default: '',
      },
    ],
  },
  {
    id: 'fal-ai/workflow-utilities/audio-compressor',
    name: 'Audio Compressor',
    provider: 'fal.ai',
    backend: 'fal',
    category: 'utility',
    inputType: 'audio-to-audio',
    description:
      'Utilitaire FFMPEG pour compresser un fichier audio. Reduit la dynamique et normalise le volume.',
    costPerUnit: 0.005,
    costUnit: 'request',
    new: true,
    acceptsAudio: true,
    params: [
      {
        key: 'audio_url',
        label: 'Audio URL',
        type: 'text',
        default: '',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // RECRAFT V3 - IMAGE TO IMAGE (VECTORISATION + EDITION)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'fal-ai/recraft/v3/image-to-image',
    name: 'Recraft V3 Image-to-Image',
    provider: 'Recraft',
    backend: 'fal',
    category: 'vectorize',
    inputType: 'image-to-image',
    description:
      'Transformez vos images en style vectoriel, illustration ou realiste. Uploadez une image + prompt pour la re-styliser. $0.04/image, $0.08 en mode vector.',
    costPerUnit: 0.04,
    costUnit: 'image',
    featured: true,
    new: true,
    acceptsImage: true,
    maxImages: 1,
    params: [
      PROMPT,
      {
        key: 'style',
        label: 'Style',
        type: 'select',
        default: 'vector_illustration',
        options: [
          // --- Vector (x2 prix) ---
          { value: 'vector_illustration', label: 'Vector (x2 prix)' },
          { value: 'vector_illustration/bold_stroke', label: 'Vector - Trait gras' },
          { value: 'vector_illustration/chemistry', label: 'Vector - Chimie' },
          { value: 'vector_illustration/colored_stencil', label: 'Vector - Pochoir couleur' },
          { value: 'vector_illustration/contour_pop_art', label: 'Vector - Contour Pop Art' },
          { value: 'vector_illustration/cosmics', label: 'Vector - Cosmique' },
          { value: 'vector_illustration/cutout', label: 'Vector - Decoupage' },
          { value: 'vector_illustration/depressive', label: 'Vector - Depressif' },
          { value: 'vector_illustration/editorial', label: 'Vector - Editorial' },
          { value: 'vector_illustration/emotional_flat', label: 'Vector - Flat emotionnel' },
          { value: 'vector_illustration/engraving', label: 'Vector - Gravure' },
          { value: 'vector_illustration/infographical', label: 'Vector - Infographie' },
          { value: 'vector_illustration/line_art', label: 'Vector - Line Art' },
          { value: 'vector_illustration/line_circuit', label: 'Vector - Circuit' },
          { value: 'vector_illustration/linocut', label: 'Vector - Linogravure' },
          { value: 'vector_illustration/marker_outline', label: 'Vector - Contour marqueur' },
          { value: 'vector_illustration/mosaic', label: 'Vector - Mosaique' },
          { value: 'vector_illustration/naivector', label: 'Vector - Naif' },
          { value: 'vector_illustration/roundish_flat', label: 'Vector - Flat arrondi' },
          { value: 'vector_illustration/segmented_colors', label: 'Vector - Couleurs segmentees' },
          { value: 'vector_illustration/sharp_contrast', label: 'Vector - Contraste net' },
          { value: 'vector_illustration/thin', label: 'Vector - Fin' },
          { value: 'vector_illustration/vector_photo', label: 'Vector - Photo vectorisee' },
          { value: 'vector_illustration/vivid_shapes', label: 'Vector - Formes vives' },
          // --- Illustration digitale ---
          { value: 'digital_illustration', label: 'Illustration digitale' },
          { value: 'digital_illustration/pixel_art', label: 'Digital - Pixel Art' },
          { value: 'digital_illustration/hand_drawn', label: 'Digital - Dessine main' },
          { value: 'digital_illustration/grain', label: 'Digital - Grain' },
          { value: 'digital_illustration/infantile_sketch', label: 'Digital - Croquis enfantin' },
          { value: 'digital_illustration/2d_art_poster', label: 'Digital - Poster 2D' },
          { value: 'digital_illustration/2d_art_poster_2', label: 'Digital - Poster 2D v2' },
          { value: 'digital_illustration/handmade_3d', label: 'Digital - 3D artisanal' },
          { value: 'digital_illustration/hand_drawn_outline', label: 'Digital - Contour dessine' },
          { value: 'digital_illustration/engraving_color', label: 'Digital - Gravure couleur' },
          { value: 'digital_illustration/antiquarian', label: 'Digital - Antiquaire' },
          { value: 'digital_illustration/bold_fantasy', label: 'Digital - Fantasy audacieux' },
          { value: 'digital_illustration/child_book', label: 'Digital - Livre enfant' },
          { value: 'digital_illustration/child_books', label: 'Digital - Livres enfants' },
          { value: 'digital_illustration/cover', label: 'Digital - Couverture' },
          { value: 'digital_illustration/crosshatch', label: 'Digital - Hachures croisees' },
          { value: 'digital_illustration/digital_engraving', label: 'Digital - Gravure digitale' },
          { value: 'digital_illustration/expressionism', label: 'Digital - Expressionnisme' },
          { value: 'digital_illustration/freehand_details', label: 'Digital - Details main levee' },
          { value: 'digital_illustration/grain_20', label: 'Digital - Grain 2.0' },
          {
            value: 'digital_illustration/graphic_intensity',
            label: 'Digital - Intensite graphique',
          },
          { value: 'digital_illustration/hard_comics', label: 'Digital - Comics dur' },
          { value: 'digital_illustration/long_shadow', label: 'Digital - Ombre longue' },
          { value: 'digital_illustration/modern_folk', label: 'Digital - Folk moderne' },
          { value: 'digital_illustration/multicolor', label: 'Digital - Multicolore' },
          { value: 'digital_illustration/neon_calm', label: 'Digital - Neon calme' },
          { value: 'digital_illustration/noir', label: 'Digital - Noir' },
          { value: 'digital_illustration/nostalgic_pastel', label: 'Digital - Pastel nostalgique' },
          { value: 'digital_illustration/outline_details', label: 'Digital - Details contour' },
          { value: 'digital_illustration/pastel_gradient', label: 'Digital - Gradient pastel' },
          { value: 'digital_illustration/pastel_sketch', label: 'Digital - Croquis pastel' },
          { value: 'digital_illustration/pop_art', label: 'Digital - Pop Art' },
          { value: 'digital_illustration/pop_renaissance', label: 'Digital - Pop Renaissance' },
          { value: 'digital_illustration/street_art', label: 'Digital - Street Art' },
          { value: 'digital_illustration/tablet_sketch', label: 'Digital - Croquis tablette' },
          { value: 'digital_illustration/urban_glow', label: 'Digital - Eclat urbain' },
          { value: 'digital_illustration/urban_sketching', label: 'Digital - Urban Sketching' },
          { value: 'digital_illustration/vanilla_dreams', label: 'Digital - Reves vanille' },
          { value: 'digital_illustration/young_adult_book', label: 'Digital - Young Adult' },
          { value: 'digital_illustration/young_adult_book_2', label: 'Digital - Young Adult v2' },
          // --- Realiste ---
          { value: 'realistic_image', label: 'Realiste' },
          { value: 'realistic_image/b_and_w', label: 'Realiste - Noir & Blanc' },
          { value: 'realistic_image/hard_flash', label: 'Realiste - Flash dur' },
          { value: 'realistic_image/hdr', label: 'Realiste - HDR' },
          { value: 'realistic_image/natural_light', label: 'Realiste - Lumiere naturelle' },
          { value: 'realistic_image/studio_portrait', label: 'Realiste - Portrait studio' },
          { value: 'realistic_image/enterprise', label: 'Realiste - Entreprise' },
          { value: 'realistic_image/motion_blur', label: 'Realiste - Flou de mouvement' },
          { value: 'realistic_image/evening_light', label: 'Realiste - Lumiere du soir' },
          { value: 'realistic_image/faded_nostalgia', label: 'Realiste - Nostalgie fanee' },
          { value: 'realistic_image/forest_life', label: 'Realiste - Vie en foret' },
          { value: 'realistic_image/mystic_naturalism', label: 'Realiste - Naturalisme mystique' },
          { value: 'realistic_image/natural_tones', label: 'Realiste - Tons naturels' },
          { value: 'realistic_image/organic_calm', label: 'Realiste - Calme organique' },
          { value: 'realistic_image/real_life_glow', label: 'Realiste - Eclat naturel' },
          { value: 'realistic_image/retro_realism', label: 'Realiste - Retro realiste' },
          { value: 'realistic_image/retro_snapshot', label: 'Realiste - Snapshot retro' },
          { value: 'realistic_image/urban_drama', label: 'Realiste - Drame urbain' },
          { value: 'realistic_image/village_realism', label: 'Realiste - Realisme villageois' },
          { value: 'realistic_image/warm_folk', label: 'Realiste - Folk chaleureux' },
        ],
      },
      {
        key: 'strength',
        label: 'Force de transformation',
        type: 'slider',
        default: 0.5,
        min: 0,
        max: 1,
        step: 0.05,
      },
      NEGATIVE_PROMPT,
      SEED,
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // VECTORIZER.AI - IMAGE TO SVG
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'vectorizer-ai/vectorize',
    name: 'Vectorizer.AI',
    provider: 'Vectorizer.AI',
    backend: 'vectorizer',
    category: 'vectorize',
    inputType: 'image-to-svg',
    description:
      'Vectorisation professionnelle : convertissez vos images bitmap (PNG, JPEG) en fichiers vectoriels SVG, EPS, PDF ou DXF. Tracage automatique haute fidelite.',
    costPerUnit: 0.05,
    costUnit: 'image',
    featured: true,
    new: true,
    acceptsImage: true,
    maxImages: 1,
    params: [
      {
        key: 'output_format',
        label: 'Format de sortie',
        type: 'select',
        default: 'svg',
        options: [
          { value: 'svg', label: 'SVG' },
          { value: 'eps', label: 'EPS' },
          { value: 'pdf', label: 'PDF' },
          { value: 'dxf', label: 'DXF' },
          { value: 'png', label: 'PNG (vectorise)' },
        ],
      },
      {
        key: 'processing_max_colors',
        label: 'Couleurs max',
        type: 'slider',
        default: 0,
        min: 0,
        max: 256,
        step: 1,
      },
      {
        key: 'mode',
        label: 'Mode',
        type: 'select',
        default: 'production',
        options: [
          { value: 'production', label: 'Production (1 credit)' },
          { value: 'preview', label: 'Preview (0.2 credit)' },
          { value: 'test', label: 'Test (gratuit, watermark)' },
        ],
      },
      {
        key: 'output_shape_stacking',
        label: 'Empilement formes',
        type: 'select',
        default: 'cutouts',
        options: [
          { value: 'cutouts', label: 'Cutouts (decoupes)' },
          { value: 'stacked', label: 'Stacked (empilees)' },
        ],
      },
      {
        key: 'output_group_by',
        label: 'Grouper par',
        type: 'select',
        default: 'none',
        options: [
          { value: 'none', label: 'Aucun' },
          { value: 'color', label: 'Couleur' },
          { value: 'parent', label: 'Parent' },
          { value: 'layer', label: 'Calque' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // OPENROUTER - IMAGE GENERATION
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'openai/gpt-image-1',
    name: 'GPT Image 1',
    provider: 'OpenAI',
    backend: 'openrouter',
    category: 'image-generation',
    inputType: 'text-to-image',
    description:
      "Modele de generation d'images d'OpenAI. Excellent pour le texte dans les images et les instructions complexes.",
    costPerUnit: 0.04,
    costUnit: 'image',
    featured: true,
    params: [
      PROMPT,
      {
        key: 'size',
        label: 'Taille',
        type: 'select',
        default: '1024x1024',
        options: [
          { value: '1024x1024', label: '1024x1024 (Carre)' },
          { value: '1536x1024', label: '1536x1024 (Paysage)' },
          { value: '1024x1536', label: '1024x1536 (Portrait)' },
          { value: 'auto', label: 'Auto' },
        ],
      },
      {
        key: 'quality',
        label: 'Qualite',
        type: 'select',
        default: 'auto',
        options: [
          { value: 'auto', label: 'Auto' },
          { value: 'low', label: 'Low (rapide)' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High (lent, meilleure qualite)' },
        ],
      },
      {
        key: 'n',
        label: "Nombre d'images",
        type: 'slider',
        default: 1,
        min: 1,
        max: 4,
        step: 1,
      },
    ],
  },
  {
    id: 'openai/dall-e-3',
    name: 'DALL-E 3',
    provider: 'OpenAI',
    backend: 'openrouter',
    category: 'image-generation',
    inputType: 'text-to-image',
    description:
      'DALL-E 3 via OpenRouter. Images de haute qualite, excellent suivi des instructions.',
    costPerUnit: 0.04,
    costUnit: 'image',
    params: [
      PROMPT,
      {
        key: 'size',
        label: 'Taille',
        type: 'select',
        default: '1024x1024',
        options: [
          { value: '1024x1024', label: '1024x1024 (Carre)' },
          { value: '1792x1024', label: '1792x1024 (Paysage)' },
          { value: '1024x1792', label: '1024x1792 (Portrait)' },
        ],
      },
      {
        key: 'quality',
        label: 'Qualite',
        type: 'select',
        default: 'standard',
        options: [
          { value: 'standard', label: 'Standard' },
          { value: 'hd', label: 'HD (meilleure qualite)' },
        ],
      },
    ],
  },
  {
    id: 'google/gemini-2.0-flash-exp:free',
    name: 'Gemini 2.0 Flash (Gratuit)',
    provider: 'Google',
    backend: 'openrouter',
    category: 'image-generation',
    inputType: 'text-to-image',
    description: "Generation d'images gratuite via Gemini 2.0 Flash. Modele multimodal de Google.",
    costPerUnit: 0,
    costUnit: 'image',
    params: [PROMPT],
  },
  {
    id: 'meta-llama/llama-4-maverick:free',
    name: 'Llama 4 Maverick (Gratuit)',
    provider: 'Meta',
    backend: 'openrouter',
    category: 'image-generation',
    inputType: 'text-to-image',
    description: "Llama 4 Maverick de Meta. Generation d'images gratuite via modele multimodal.",
    costPerUnit: 0,
    costUnit: 'image',
    params: [PROMPT],
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getModelsByCategory(category: ModelCategory): FalModel[] {
  return MODEL_REGISTRY.filter(m => m.category === category)
}

export function getModelsByBackend(backend: ProviderBackend): FalModel[] {
  return MODEL_REGISTRY.filter(m => m.backend === backend)
}

export function getFeaturedModels(): FalModel[] {
  return MODEL_REGISTRY.filter(m => m.featured)
}

export function getNewModels(): FalModel[] {
  return MODEL_REGISTRY.filter(m => m.new)
}

export function getModelById(id: string): FalModel | undefined {
  return MODEL_REGISTRY.find(m => m.id === id)
}

export function searchModels(query: string): FalModel[] {
  const q = query.toLowerCase()
  return MODEL_REGISTRY.filter(
    m =>
      m.name.toLowerCase().includes(q) ||
      m.provider.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q) ||
      m.category.includes(q)
  )
}

export const CATEGORY_INFO: Record<
  ModelCategory,
  { label: string; icon: string; color: string; description: string }
> = {
  'image-generation': {
    label: 'Generation Image',
    icon: 'Image',
    color: 'from-violet-500 to-purple-500',
    description: 'Creez des images a partir de texte',
  },
  'image-editing': {
    label: 'Edition Image',
    icon: 'Paintbrush',
    color: 'from-blue-500 to-cyan-500',
    description: 'Modifiez vos images par instruction',
  },
  'video-generation': {
    label: 'Generation Video',
    icon: 'Video',
    color: 'from-rose-500 to-pink-500',
    description: 'Creez des videos depuis texte ou image',
  },
  'video-editing': {
    label: 'Edition Video',
    icon: 'Film',
    color: 'from-orange-500 to-amber-500',
    description: 'Modifiez et transformez vos videos',
  },
  upscale: {
    label: 'Upscale',
    icon: 'ArrowUpRight',
    color: 'from-emerald-500 to-green-500',
    description: 'Augmentez la resolution de vos images et videos',
  },
  'remove-bg': {
    label: 'Supprimer Fond',
    icon: 'Eraser',
    color: 'from-sky-500 to-blue-500',
    description: "Supprimez l'arriere-plan de vos images et videos",
  },
  '3d': {
    label: '3D',
    icon: 'Box',
    color: 'from-amber-500 to-yellow-500',
    description: 'Generez des modeles 3D depuis images ou texte',
  },
  audio: {
    label: 'Audio / TTS',
    icon: 'Mic',
    color: 'from-teal-500 to-cyan-500',
    description: 'Synthese vocale et generation audio',
  },
  music: {
    label: 'Musique / SFX',
    icon: 'Music',
    color: 'from-indigo-500 to-purple-500',
    description: 'Generez de la musique et des effets sonores',
  },
  avatar: {
    label: 'Avatar / Lipsync',
    icon: 'User',
    color: 'from-fuchsia-500 to-violet-500',
    description: 'Animez des visages et avatars',
  },
  'face-swap': {
    label: 'Face Swap',
    icon: 'Repeat',
    color: 'from-pink-500 to-rose-500',
    description: 'Echangez les visages dans vos photos et videos',
  },
  vectorize: {
    label: 'Vectorisation',
    icon: 'PenTool',
    color: 'from-blue-500 to-indigo-500',
    description: 'Convertissez vos images bitmap en fichiers vectoriels SVG/EPS/PDF',
  },
  utility: {
    label: 'Utilitaires',
    icon: 'Settings',
    color: 'from-gray-500 to-slate-500',
    description: 'Outils utilitaires: moderation, classification, etc.',
  },
}

export function formatCost(model: FalModel): string {
  const unitLabels: Record<CostUnit, string> = {
    image: '/image',
    second: '/sec',
    megapixel: '/MP',
    video: '/video',
    request: '/requete',
  }
  return `$${model.costPerUnit.toFixed(3)}${unitLabels[model.costUnit]}`
}
