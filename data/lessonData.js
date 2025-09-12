// samplereact/data/lessonData.js

export const LESSON_CARDS = [
  { id: '1', title: 'General', type: 'general', status: true, shortDescription: 'An introductory overview of the subject, covering key concepts and foundations.' },
  { id: '2', title: 'Topic 1', type: 'ppt', status: true, shortDescription: 'A detailed presentation on the first major topic of the subject.', file: 'Jumel_A._Deblois_Jr (1).pptx', MIME: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', size: '0.32 MB',  content: 'https://drive.google.com/uc?id=18cvUZg4gKs_ITW4HrhVOCULK47RB5qM3&export=download' },
  { id: '3', title: 'Lesson 2', type: 'pdf', status: true, shortDescription: 'A comprehensive PDF guide for the second lesson.',file: 'Chapter1.pdf', MIME: 'application/pdf', size: '0.64 MB',  content: 'https://drive.google.com/uc?id=1-TTh6JGZXChGh1SqFw-CmnZguPZuPQfg&export=download' },
  { id: '4', title: 'Basic IT Concepts Pretest', type: 'test', status: false, shortDescription: 'A preliminary test to assess your initial understanding.', file: 'test-quiz (1).json', MIME: 'application/json', size: '0.00 MB', content: 'https://drive.google.com/uc?id=1gi0517ZD4VS8crGW04O1L-OV9OcURLnb&export=download' },
  { id: '5', title: 'Science Matching Game', status: false, type: 'match', shortDescription: 'An interactive game to reinforce learning through matching exercises.', file: 'game-match.json', MIME: 'application/json', size: '0.00 MB', content: 'https://drive.google.com/uc?id=1w9tVE55jpLFOLQjMc25frJGxe7uGK8Xm&export=download' },
  { id: '6', title: 'Flashcard', type: 'flash', status: false, shortDescription: 'Interactive flashcards to help memorize key terms and concepts.', file: 'Science-Flash-Cards.json', MIME: 'application/json', size: '0.00 MB', content: 'https://drive.google.com/uc?id=1OWT9jgv-ky4Fdvb7A3x176kGM6zxHPZY&export=download' },
  { id: '7', title: 'Grade 4 Science Post Test', type: 'test', status: false, shortDescription: 'A final test to evaluate your mastery of the subject.', file: 'SCI4-M1-Q1.json', MIME: 'application/json', size: '0.00 MB', content: 'https://drive.google.com/uc?id=1JOP7iu2JFfVwI5oonni0JWFpl54fiY7D&export=download' },
  { id: '8', title: 'MATATAG - Science 4 Quarter 1 Week 1 - Science Inventions', type: 'link', status: true, shortDescription: 'An external resource link for deeper exploration of the topic.', content: 'https://youtu.be/MxHmfZKHLJg?si=G4v1OWHwGmotN5u_' },
  { id: '9', title: 'Illustrate Different Angles Grade 4 Q1 LC1 MATATAG Curriculum', type: 'video', status: true, shortDescription: 'A video lesson explaining advanced concepts visually.', file: 'Illustrate Different Angles Grade 4 Q1 LC1 MATATAG Curriculum720p (1).mp4', MIME: 'video/mp4' , size: '9.69 MB', content: 'https://drive.google.com/uc?id=1970H0wtUQNjUAJsZI8qDkY-3U_q2Vrlr&export=download' },
  { id: '10', title: 'Speak This Sentence', type: 'speach', status: true, shortDescription: 'A game to test your speaking skills.', file: 'speak-english.json', MIME: 'application/json', size: '0.00 MB', content: 'https://drive.google.com/uc?id=1pygcV9M8g-f62BUPgIRH0V9N8fJbXAf5&export=download' },
  { id: '11', title: 'Complete The Sentence', type: 'sentence', status: true, shortDescription: 'A game to test your spelling skills.', file: 'SpellTheBea.json', MIME: 'application/json', size: '0.00 MB', content: 'https://drive.google.com/uc?id=14k0ymqHbVlidLKIN2ZQTW8S_EJvEsUZT&export=download' },
  { id: '12', title: 'MathTINIK', type: 'gameIMGtext', status: true, shortDescription: 'A game to test your math skills.', file: 'mathGame.json', MIME: 'application/json', size: '0.00 MB', content: 'https://drive.google.com/uc?id=1ynwWHL0GR-7E5uTLrLObb_QNx0dUT6N2&export=download' },
];

export const LESSON_TYPE_ICON_MAP = {
  general: 'information-circle-outline',
  ppt: 'easel-outline',
  pdf: 'document-attach-outline',
  video: 'videocam-outline',
  link: 'link-outline',
  test: 'document-text-outline',
  match: 'game-controller-outline',
  flash: 'copy-outline',
  speach: 'mic-outline',
  sentence: 'extension-puzzle-outline',
  gameIMGtext: 'dice-outline',
};

export const SUBJECT_ICON_MAP = {
  Mathematics: require('../assets/icons/math_.png'),
  Science: require('../assets/icons/saturn_.png'),
  English: require('../assets/icons/english_.png'),
  Filipino: require('../assets/icons/filipino_.png'),
};

export default {
  LESSON_CARDS,
  LESSON_TYPE_ICON_MAP,
  SUBJECT_ICON_MAP,
}