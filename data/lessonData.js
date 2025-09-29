// samplereact/data/lessonData.js

export const LESSONS = [
  { id: '1', belong_to_sub: '1', title: 'Comprehend literary texts',status: true, description: 'The learners demonstrate their expanding vocabulary knowledge and grammatical awareness, comprehension of literary and informational texts, and composing and creating processes; and their receptive and productive skills in order to produce age-appropriate and gender-responsive texts based on one’s purpose, context, and target audience.\n\n\nPerformance Standards: The learners apply comprehension of literary and informational texts and produce narrative and expository texts based on their purpose, context, and target audience using simple, compound, and complex sentences, and age-appropriate and gender-sensitive language.\n\n\nLearning Competencies:\n\n- EN4LR-1-1 Comprehend literary texts\n\n  1. Identify the setting, characters, and plot\n\n  2. Sequence the events of a narrative (at least 6 events)\n\n  3. Make predictions\n\n  4. Draw conclusions based on the text read\n\n\nContent: Making Predictions, Elements of a Story, Drawing Conclusions', Quarter: 1 },
  { id: '2', belong_to_sub: '2', title: 'Advanced Grammar', status: false, description: 'Learn complex grammatical structures, tenses, and punctuation rules...', Quarter: 1 },
  { id: '3', belong_to_sub: '3', title: 'Reading Comprehension', status: false, description: 'Enhance your understanding of texts, analyze context, and improve critical reading skills.', Quarter: 1 },
];


export const LESSON_CARDS = [
  { id: '1', belong_to_lesson: '1', title: 'General', type: 'general', status: true, shortDescription: 'An introductory overview of the subject, covering key concepts and foundations.' },
  { id: '2', belong_to_lesson: '1', title: 'Topic 1', type: 'ppt', status: true, shortDescription: 'Bailey, C.S. (1906). The legend of the dipper. Accessed via CommonLit.', file: 'THE LEGEND OF THE DIPPER.pptx', MIME: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', size: '0.32 MB',  content: 'https://drive.google.com/uc?id=1o-Jw-8AamQPX2cy6gV57cfj_likUMGAW&export=download' },
  { id: '3', belong_to_lesson: '1', title: 'Lesson 2', type: 'pdf', status: true, shortDescription: 'A comprehensive PDF guide for the second lesson.',file: 'Chapter1.pdf', MIME: 'application/pdf', size: '34.21 MB',  content: 'https://drive.google.com/uc?id=10GYZ4QZ_8lsDpgUdJ2J9ILQv97rmj28L&export=download' },
  { id: '4', belong_to_lesson: '1', title: 'Basic IT Concepts Pretest', type: 'test', status: false, shortDescription: 'A preliminary test to assess your initial understanding.', file: 'test-quiz (1).json', MIME: 'application/json', size: '0.00 MB', content: 'https://drive.google.com/uc?id=1KakS4H4SQ-dG2ktn0M6CuXrRTP1VZtsY&export=download' },
  { id: '5', belong_to_lesson: '1', title: 'Science Matching Game', status: false, type: 'match', shortDescription: 'An interactive game to reinforce learning through matching exercises.', file: 'game-match.json', MIME: 'application/json', size: '0.00 MB', content: 'https://drive.google.com/uc?id=15_IRkr-zelEys1B2FiRkCo_vgXFVBb_L&export=download' },
  { id: '6', belong_to_lesson: '2', title: 'Flashcard', type: 'flash', status: false, shortDescription: 'Interactive flashcards to help memorize key terms and concepts.', file: 'Science-Flash-Cards.json', MIME: 'application/json', size: '0.00 MB', content: 'https://drive.google.com/uc?id=1cNWU3tInehTpZBE5cks_ru14mi6h02py&export=download' },
  { id: '7', belong_to_lesson: '2', title: 'Grade 4 Science Post Test', type: 'test', status: false, shortDescription: 'A final test to evaluate your mastery of the subject.', file: 'SCI4-M1-Q1.json', MIME: 'application/json', size: '0.00 MB', content: 'https://drive.google.com/uc?id=1sSYJ5QSc1eKHVgil1ssRKa2a1aeezXrl&export=download' },
  { id: '8', belong_to_lesson: '2', title: 'MATATAG - Science 4 Quarter 1 Week 1 - Science Inventions', type: 'link', status: true, shortDescription: 'An external resource link for deeper exploration of the topic.', content: 'https://youtu.be/MxHmfZKHLJg?si=G4v1OWHwGmotN5u_' },
  { id: '9', belong_to_lesson: '2', title: 'Illustrate Different Angles Grade 4 Q1 LC1 MATATAG Curriculum', type: 'video', status: true, shortDescription: 'A video lesson explaining advanced concepts visually.', file: 'Illustrate Different Angles Grade 4 Q1 LC1 MATATAG Curriculum720p (1).mp4', MIME: 'video/mp4' , size: '9.69 MB', content: 'https://drive.google.com/uc?id=132kfAadQ-CYBH1PALMYIl5s49kKGGh42&export=download' },
  { id: '10', belong_to_lesson: '2', title: 'Speak This Sentence', type: 'speach', status: true, shortDescription: 'A game to test your speaking skills.', file: 'speak-english.json', MIME: 'application/json', size: '0.00 MB', content: 'https://drive.google.com/uc?id=1ZuqU3v2uOKCTHOpMT-QLUeyG74OMjRdj&export=download' },
  { id: '11', belong_to_lesson: '3', title: 'Complete The Sentence', type: 'sentence', status: true, shortDescription: 'A game to test your spelling skills.', file: 'SpellTheBea.json', MIME: 'application/json', size: '0.00 MB', content: 'https://drive.google.com/uc?id=1YTRJYPEJbi3izTt5S-BOJR4LWZWSahHb&export=download' },
  { id: '12', belong_to_lesson: '3', title: 'MathTINIK', type: 'gameIMGtext', status: true, shortDescription: 'A game to test your math skills.', file: 'mathGame.json', MIME: 'application/json', size: '0.00 MB', content: 'https://drive.google.com/uc?id=1CZx617lxllWgFpeyjoaRs17jaAIH39om&export=download' },
  { id: '13', belong_to_lesson: '3', title: 'Elements of the Story Rap', type: 'link', status: true, shortDescription: 'Bloom, J. (2017, April 7). Elements of the story rap [Video]. YouTube.', content: 'https://www.youtube.com/watch?v=0eY-fkyacW0&t=197s' },
  { id: '14', belong_to_lesson: '3', title: 'Short Story Elements', type: 'link', status: true, shortDescription: 'Hess, N. (2014, September 9). Short story elements [Video]. YouTube.', content: 'https://www.youtube.com/watch?v=VDmhl-SU5Yk&t=42s' },
  { id: '15', belong_to_lesson: '3', title: 'Plot Mountain! The Plot Diagram Song', type: 'link', status: true, shortDescription: 'Scratch Garden. (2015, November 15). Plot mountain! The plot diagram song. YouTube.', content: 'https://www.youtube.com/watch?v=NpWHZJZQDSE&t=128s' },
];

export const LESSON_TYPE_ICON_MAP = {
  general: 'information-circle-outline',
  ppt: 'easel-outline',
  pdf: 'document-attach-outline',
  video: 'videocam-outline',
  url: 'link-outline',
  quiz: 'document-text-outline',
  game_match: 'game-controller-outline',
  game_flash: 'copy-outline',
  game_speak: 'mic-outline',
  game_comp: 'extension-puzzle-outline',
  game_img: 'dice-outline',
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