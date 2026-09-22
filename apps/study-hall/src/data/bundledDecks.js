export const BUNDLED_DECKS = [
  {
    name: "CPACC - Categories of Disabilities",
    fileName: "CPACC - Categories of Disabilities.apkg",
    packageId:
      "35d5d9962e80ffb66d995dabaa461a1a228777f73825f4f8d4028080351803a8",
    cardCount: 159,
  },
  {
    name: "CPACC - Theoretical Models",
    fileName: "CPACC - Theoretical Models.apkg",
    packageId:
      "15d0706877eb5d92520ca7441d885661fdf72f8d387a47131372ff1d85ceb769",
    cardCount: 27,
  },
  {
    name: "CPACC - Demographics Strategies and Etiquette",
    fileName: "CPACC - Demographics Strategies and Etiquette.apkg",
    packageId:
      "631822c136325df606669ff1ff00642f67f3bc7858e955831cc5d99e953ba4c5",
    cardCount: 19,
  },
  {
    name: "CPACC - Universal Design",
    fileName: "CPACC - Universal Design.apkg",
    packageId:
      "523017b032e5e55d5f5e4103c3b8781f3ceeb03e4f713bbfe4e4cf05a57c3786",
    cardCount: 81,
  },
  {
    name: "CPACC - Laws and Management",
    fileName: "CPACC - Laws and Management.apkg",
    packageId:
      "e51fccc7aa4c698cdaba1116ef15c6b157bb3d1148ea7ad0eb6e18d62330faf6",
    cardCount: 40,
  },
  {
    name: "CPACC - Quiz Questions",
    fileName: "CPACC - Quiz Questions.apkg",
    packageId:
      "c209404116f6a4da3d64000a26ef6c6091aba2c8c0e3f1523ac04c0ec62aadbf",
    cardCount: 106,
  },
];

export function bundledDeckUrl(deck) {
  return `${import.meta.env.BASE_URL}decks/${encodeURIComponent(deck.fileName)}?v=${deck.packageId}`;
}

export function isBundledDeck(deck) {
  return BUNDLED_DECKS.some((entry) => entry.packageId === deck.packageId);
}
