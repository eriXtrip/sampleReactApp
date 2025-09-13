// samplereact/data/lessonData.js

export const LESSON_CARDS = [
  { id: '1', title: 'General', type: 'general', status: true, shortDescription: 'An introductory overview of the subject, covering key concepts and foundations.' },
  { id: '2', title: 'Topic 1', type: 'ppt', status: true, shortDescription: 'A detailed presentation on the first major topic of the subject.', file: 'Jumel_A._Deblois_Jr (1).pptx', MIME: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', size: '0.32 MB',  content: 'https://drive.google.com/uc?id=1RyBrjXeRUn0tnWt1k59m9fjiEiMCNVsp&export=download' },
  { id: '3', title: 'Lesson 2', type: 'pdf', status: true, shortDescription: 'A comprehensive PDF guide for the second lesson.',file: 'Chapter1.pdf', MIME: 'application/pdf', size: '0.64 MB',  content: 'https://drive.google.com/uc?id=10GYZ4QZ_8lsDpgUdJ2J9ILQv97rmj28L&export=download' },
  { id: '4', title: 'Basic IT Concepts Pretest', type: 'test', status: false, shortDescription: 'A preliminary test to assess your initial understanding.', file: 'test-quiz (1).json', MIME: 'application/json', size: '0.00 MB', content: 'https://drive.google.com/uc?id=1KakS4H4SQ-dG2ktn0M6CuXrRTP1VZtsY&export=download' },
  { id: '5', title: 'Science Matching Game', status: false, type: 'match', shortDescription: 'An interactive game to reinforce learning through matching exercises.', file: 'game-match.json', MIME: 'application/json', size: '0.00 MB', content: 'https://drive.google.com/uc?id=15_IRkr-zelEys1B2FiRkCo_vgXFVBb_L&export=download' },
  { id: '6', title: 'Flashcard', type: 'flash', status: false, shortDescription: 'Interactive flashcards to help memorize key terms and concepts.', file: 'Science-Flash-Cards.json', MIME: 'application/json', size: '0.00 MB', content: 'https://drive.google.com/uc?id=1cNWU3tInehTpZBE5cks_ru14mi6h02py&export=download' },
  { id: '7', title: 'Grade 4 Science Post Test', type: 'test', status: false, shortDescription: 'A final test to evaluate your mastery of the subject.', file: 'SCI4-M1-Q1.json', MIME: 'application/json', size: '0.00 MB', content: 'https://drive.google.com/uc?id=1sSYJ5QSc1eKHVgil1ssRKa2a1aeezXrl&export=download' },
  { id: '8', title: 'MATATAG - Science 4 Quarter 1 Week 1 - Science Inventions', type: 'link', status: true, shortDescription: 'An external resource link for deeper exploration of the topic.', content: 'https://youtu.be/MxHmfZKHLJg?si=G4v1OWHwGmotN5u_' },
  { id: '9', title: 'Illustrate Different Angles Grade 4 Q1 LC1 MATATAG Curriculum', type: 'video', status: true, shortDescription: 'A video lesson explaining advanced concepts visually.', file: 'Illustrate Different Angles Grade 4 Q1 LC1 MATATAG Curriculum720p (1).mp4', MIME: 'video/mp4' , size: '9.69 MB', content: 'https://drive.google.com/uc?id=132kfAadQ-CYBH1PALMYIl5s49kKGGh42&export=download' },
  { id: '10', title: 'Speak This Sentence', type: 'speach', status: true, shortDescription: 'A game to test your speaking skills.', file: 'speak-english.json', MIME: 'application/json', size: '0.00 MB', content: 'https://drive.google.com/uc?id=1ZuqU3v2uOKCTHOpMT-QLUeyG74OMjRdj&export=download' },
  { id: '11', title: 'Complete The Sentence', type: 'sentence', status: true, shortDescription: 'A game to test your spelling skills.', file: 'SpellTheBea.json', MIME: 'application/json', size: '0.00 MB', content: 'https://drive.google.com/uc?id=1YTRJYPEJbi3izTt5S-BOJR4LWZWSahHb&export=download' },
  { id: '12', title: 'MathTINIK', type: 'gameIMGtext', status: true, shortDescription: 'A game to test your math skills.', file: 'mathGame.json', MIME: 'application/json', size: '0.00 MB', content: 'https://drive.google.com/uc?id=1CZx617lxllWgFpeyjoaRs17jaAIH39om&export=download' },
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

export const feedbackMessages = {
    multipleChoice: {
      correct: [
        "Great job!",
        "Nice work, that’s correct!",
        "You nailed it!"
      ],
      incorrect: [
        "Not quite, try again next time",
        "Hmm, that wasn’t right",
        "Close, but not correct"
      ]
    },
    trueFalse: {
      correct: [
        "Exactly right!",
        "Correct answer!",
        "You got it!"
      ],
      incorrect: [
        "Nope, that’s not it",
        "That’s false",
        "Oops, wrong choice"
      ]
    },
    enumeration: {
      partial: [
        "Nice! You got some correct!",
        "Good try, you got a few right!",
        "Almost there, some answers were correct!"
      ],
      perfect: [
        "Wow, you got them all correct!",
        "Perfect enumeration!",
        "You listed everything right!"
      ],
      incorrect: [
        "None matched, review again!",
        "Not correct, keep practicing",
        "That didn’t match, try again"
      ]
    },
    multiselect: {
      correct: [
        "Great selection!",
        "Perfect choices!",
        "You picked all the right ones!"
      ],
      partial: [
        "Good try, you got some correct",
        "Almost there, a few were right",
        "Nice effort, but missing some answers"
      ],
      incorrect: [
        "Oops, wrong picks",
        "That didn’t work out",
        "Try again, not correct"
      ]
    }
  };

export default {
  LESSON_CARDS,
  LESSON_TYPE_ICON_MAP,
  SUBJECT_ICON_MAP,
  feedbackMessages,
}