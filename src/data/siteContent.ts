export type SiteLink = { id: string; text: string; href: string };

export type ContentCard = {
  id: string;
  icon: string;
  title: string;
  description: string;
  links: SiteLink[];
  linksPerPage?: number;
  keepVisible?: boolean;
};

export const siteSections = [
  { id: 'profile', title: 'Profile' },
  { id: 'about', title: 'About' },
  { id: 'projects', title: 'Projects' },
  { id: 'writings', title: 'Writings' },
  { id: 'contact', title: 'Contact' }
] as const;

export type SiteSection = (typeof siteSections)[number];
export const writingsPerPage = 3;

// Rendering and header search share this list, including off-page entries.
export const projectCards: ContentCard[] = [
  {
    id: 'resources', icon: 'fas fa-folder-open', title: 'Resources',
    description: 'A collection of useful tools, references, and learning materials.',
    keepVisible: true, links: []
  },
  {
    id: 'websites', icon: 'fas fa-globe', title: 'Websites',
    description: 'Portfolio of my websites and web apps.',
    links: [
      { id: 'habit-hall', href: 'https://habithall.com', text: 'Habit Hall' },
      { id: 'insert-sight', href: 'https://insertsight.com', text: 'Insert Sight' }
    ]
  },
  {
    id: 'media', icon: 'fas fa-video', title: 'Media',
    description: 'Checkout my YouTube channels, videos, and art.', links: []
  },
  {
    id: 'extensions', icon: 'fas fa-puzzle-piece', title: 'Extensions',
    description: 'Browser extensions and automation tools.',
    links: [{ id: 'tab-master', href: 'https://github.com/AirealAce/tab-master', text: 'Tab Master' }]
  },
  {
    id: 'sample-projects', icon: 'fas fa-music', title: 'Sample Projects',
    description: 'Mock up, sample projects, and scrapped ideas.', linksPerPage: 6,
    links: [
      { id: 'japan-prefecture-atlas', href: 'https://japan-themed-site.pages.dev', text: 'Japan Prefecture Atlas' },
      { id: 'smash-spirit-clash', href: 'https://smash-spirit-clash.pages.dev', text: 'Smash Spirit Clash' },
      { id: 'royal-chat', href: 'https://royalchat.aaronmills.co', text: 'Royal Chat' },
      { id: 'voice-noter', href: 'https://voicenoter.aaronmills.co', text: 'Voice Noter' },
      { id: 'create-inc', href: 'https://createinc.aaronmills.co', text: 'Create.Inc' },
      { id: 'hobe-design-house', href: 'https://mock.hobedesignhouse.aaronmills.co', text: 'Hobe Design House' },
      { id: 'demo-game', href: 'https://demo-jump-game.aaronmills.co', text: 'Demo Game' },
      { id: 'kawaii-studio', href: 'https://kawaiistudio.aaronmills.co', text: 'KawaiiStudio' },
      { id: 'sonimon', href: 'https://sonicmon.aaronmills.co', text: 'Sonimon' },
      { id: 'translator', href: 'https://translator.aaronmills.co', text: 'Translator' },
      { id: 'sprite-saga', href: 'https://spritesaga.aaronmills.co', text: 'Sprite Saga' }
    ]
  },
  {
    id: 'academic-projects', icon: 'fas fa-laptop-code', title: 'Academic Projects',
    description: 'Collection of web development and full-stack apps completed at Florida Atlantic University.',
    linksPerPage: 6,
    links: [
      { id: 'project-0', href: 'https://internetcomputing.aaronmills.co', text: 'Project 0' },
      { id: 'project-1', href: 'https://internetcomputing.aaronmills.co/p1', text: 'Project 1' },
      { id: 'project-2', href: 'https://internetcomputing.aaronmills.co/p2', text: 'Project 2' },
      { id: 'project-3', href: 'https://internetcomputing.aaronmills.co/p3', text: 'Project 3' },
      { id: 'project-4', href: 'https://internetcomputing.aaronmills.co/p4', text: 'Project 4' },
      { id: 'jp-study', href: 'https://jpstudy.aaronmills.co', text: 'JP Study' },
      { id: 'flashcards', href: 'https://flashcards.aaronmills.co', text: 'Flashcards' },
      { id: 'flashcards-2', href: 'https://flashcards2.aaronmills.co', text: 'Flashcards 2' },
      { id: 'cat-maker', href: 'https://catmaker.aaronmills.co', text: 'Cat Maker' },
      { id: 'recipes', href: 'https://recipes.aaronmills.co', text: 'Recipes' },
      { id: 'recipe-stats', href: 'https://recipestatistics.aaronmills.co', text: 'Recipe Stats' },
      { id: 'character-party', href: 'https://characterparty.aaronmills.co', text: 'Character Party' },
      { id: 'preneur-manure', href: 'https://preneurmanure.aaronmills.co', text: 'Preneur Manure' }
    ]
  }
];

// Add writing buttons to each card's links array; search includes them automatically.
export const writingCards: ContentCard[] = [
  {
    id: 'book-notes', icon: 'fas fa-book', title: 'Book Notes',
    description: 'Notes and takeaways from books I have read.', links: []
  },
  {
    id: 'biography-notes', icon: 'fas fa-user-pen', title: 'Biography Notes',
    description: 'Notes about remarkable people and their lives.', links: []
  },
  {
    id: 'other-pieces', icon: 'fas fa-pen-nib', title: 'Other Pieces',
    description: 'Essays, observations, reflections, channelings, scripts, and other written pieces.', links: []
  },
  {
    id: 'japanese', icon: 'fas fa-language', title: '日本語',
    description: 'Japanese-language notes and written pieces.', links: []
  }
];

export const entryId = (sectionId: string, cardId: string, linkId: string) => (
  `entry-${sectionId}-${cardId}-${linkId}`
);
