const data = {
  headerMenus: [
    {
      name: 'Whats New',
      href: '/search?tag=todays-deal',
    },
    {
      name: 'Feed',
      href: '/#browsing-history',
    },
    {
      name: 'Leaderboard',
      href: '/page/customer-service',
    },
    {
      name: 'Quest',
      href: '/page/about-us',
    },
    {
      name: 'Help',
      href: '/page/help',
    },
  ],
  carousels: [
    {
      title: 'Pass CAMRT, Sonography Canada, ARDMS, ARRT on 1st Try',
      buttonCaption: 'Start Now!',
      image: '/images/banner1.jpg',
      url: '/search?category=Sonography',
      isPublished: true,
    },
    {
      title: 'We give you the wings to fly',
      buttonCaption: 'Start Now!',
      image: '/images/banner2.jpg',
      url: '/search?category=Radiography',
      isPublished: true,
    },
  ],

  quizzes: [
    {
      name: 'Ultrasound Physics & Instrumentation Basics',
      description:
        'Core concepts for ARDMS SPI and Sonography Canada exams – transducers, wave properties, artifacts, Doppler basics',
      image:
        'https://images.unsplash.com/photo-1581593443255-db4646e739b0?w=1200&auto=format&fit=crop&q=80',
      category: 'ARDMS',
      tags: ['Sonography'],
    },
    {
      name: 'Chest & Thoracic Radiography Essentials',
      description:
        'Key chest X-ray findings, signs, and patterns for ARRT Radiography exam preparation',
      image:
        'https://images.unsplash.com/photo-1581593443255-db4646e739b0?w=1200&auto=format&fit=crop&q=80',
      category: 'ARRT',
      tags: ['Radiography'],
    },
    {
      name: 'Radiation Protection & Safety Fundamentals',
      description:
        'Radiation biology, protection principles, ALARA, shielding, and regulatory concepts for CAMRT',
      image:
        'https://images.unsplash.com/photo-1581593443255-db4646e739b0?w=1200&auto=format&fit=crop&q=80',
      category: 'CAMRT',
      tags: ['Radiography'],
    },
  ],

  questions: [
    // ─── Quiz 1: Ultrasound Physics & Instrumentation Basics (ARDMS) ──────────
    {
      quizName: 'Ultrasound Physics & Instrumentation Basics',
      question:
        'Which ultrasound wave property is directly related to the frequency of the transducer?',
      image: null,
      options: [
        { text: 'Wavelength', isCorrect: false },
        { text: 'Propagation speed', isCorrect: false },
        { text: 'Period', isCorrect: false },
        { text: 'All of the above', isCorrect: true },
      ],
      tips: 'Higher frequency → shorter wavelength & shorter period (speed is constant in soft tissue ~1540 m/s)',
      isPublished: true,
    },
    {
      quizName: 'Ultrasound Physics & Instrumentation Basics',
      question:
        'The primary advantage of using a higher frequency transducer is:',
      image: null,
      options: [
        { text: 'Better penetration', isCorrect: false },
        { text: 'Improved axial resolution', isCorrect: true },
        { text: 'Lower attenuation', isCorrect: false },
        { text: 'Decreased scattering', isCorrect: false },
      ],
      tips: 'Higher frequency = shorter pulse length = better axial resolution, but more attenuation',
      isPublished: true,
    },
    {
      quizName: 'Ultrasound Physics & Instrumentation Basics',
      question:
        'Which artifact is caused by multiple strong reflectors and appears as equally spaced echoes deep to the structure?',
      image: 'https://radiopaedia.org/cases/reverberation-artifact-1?lang=us',
      options: [
        { text: 'Shadowing', isCorrect: false },
        { text: 'Comet-tail', isCorrect: false },
        { text: 'Ring-down', isCorrect: false },
        { text: 'Reverberation', isCorrect: true },
      ],
      tips: 'Classic example: gas in bowel or metallic objects',
      isPublished: true,
    },
    {
      quizName: 'Ultrasound Physics & Instrumentation Basics',
      question: 'The Doppler shift frequency is directly proportional to:',
      image: null,
      options: [
        { text: 'Transducer frequency and flow velocity', isCorrect: true },
        { text: 'Angle of insonation only', isCorrect: false },
        { text: 'Propagation speed only', isCorrect: false },
        { text: 'None of the above', isCorrect: false },
      ],
      tips: 'fd = 2 × v × f × cosθ / c → depends on f (transducer freq) and v (velocity)',
      isPublished: true,
    },
    {
      quizName: 'Ultrasound Physics & Instrumentation Basics',
      question:
        'Which ultrasound mode is most commonly used to measure blood flow velocity with range resolution?',
      image: null,
      options: [
        { text: 'B-mode', isCorrect: false },
        { text: 'M-mode', isCorrect: false },
        { text: 'Pulsed-wave Doppler', isCorrect: true },
        { text: 'Power Doppler', isCorrect: false },
      ],
      tips: 'PW Doppler provides velocity information with range resolution',
      isPublished: true,
    },
    {
      quizName: 'Ultrasound Physics & Instrumentation Basics',
      question: 'Acoustic impedance mismatch is greatest between:',
      image: null,
      options: [
        { text: 'Soft tissue and muscle', isCorrect: false },
        { text: 'Soft tissue and air', isCorrect: true },
        { text: 'Muscle and fat', isCorrect: false },
        { text: 'Liver and kidney', isCorrect: false },
      ],
      tips: 'Air-soft tissue interface causes ~100% reflection → strong reverberation',
      isPublished: true,
    },
    {
      quizName: 'Ultrasound Physics & Instrumentation Basics',
      question:
        'Which factor does NOT affect ultrasound attenuation in soft tissue?',
      image: null,
      options: [
        { text: 'Frequency', isCorrect: false },
        { text: 'Path length', isCorrect: false },
        { text: 'Tissue type', isCorrect: false },
        { text: 'Transducer diameter', isCorrect: true },
      ],
      tips: 'Attenuation is mainly frequency, path length, and tissue dependent',
      isPublished: true,
    },
    {
      quizName: 'Ultrasound Physics & Instrumentation Basics',
      question:
        'The term “axial resolution” refers to the ability to distinguish structures along the:',
      image: null,
      options: [
        { text: 'Beam axis (depth)', isCorrect: true },
        { text: 'Perpendicular to beam', isCorrect: false },
        { text: 'Lateral direction', isCorrect: false },
        { text: 'Elevational plane', isCorrect: false },
      ],
      tips: 'Axial = along beam path; lateral = side-to-side',
      isPublished: true,
    },
    {
      quizName: 'Ultrasound Physics & Instrumentation Basics',
      question:
        'Which artifact is commonly seen posterior to fluid-filled structures?',
      image: null,
      options: [
        { text: 'Reverberation', isCorrect: false },
        { text: 'Acoustic enhancement', isCorrect: true },
        { text: 'Edge shadowing', isCorrect: false },
        { text: 'Mirror image', isCorrect: false },
      ],
      tips: 'Fluid has low attenuation → more sound reaches deeper tissues',
      isPublished: true,
    },
    {
      quizName: 'Ultrasound Physics & Instrumentation Basics',
      question: 'Power Doppler is particularly useful because it is:',
      image: null,
      options: [
        { text: 'Angle-dependent', isCorrect: false },
        { text: 'Very sensitive to low flow', isCorrect: true },
        { text: 'Able to show flow direction', isCorrect: false },
        { text: 'Quantitative', isCorrect: false },
      ],
      tips: 'Detects flow amplitude, not direction or velocity',
      isPublished: true,
    },

    // ─── Quiz 2: Chest & Thoracic Radiography Essentials (ARRT) ───────────────
    {
      quizName: 'Chest & Thoracic Radiography Essentials',
      question:
        "The 'deep sulcus sign' on supine chest X-ray is suggestive of:",
      image: null,
      options: [
        { text: 'Pneumothorax', isCorrect: true },
        { text: 'Pleural effusion', isCorrect: false },
        { text: 'Pulmonary edema', isCorrect: false },
        { text: 'Atelectasis', isCorrect: false },
      ],
      tips: 'Deep costophrenic sulcus due to air in pleural space',
      isPublished: true,
    },
    {
      quizName: 'Chest & Thoracic Radiography Essentials',
      question:
        'Which finding on chest X-ray is most consistent with congestive heart failure?',
      image: null,
      options: [
        { text: 'Cephalization of pulmonary vessels', isCorrect: true },
        { text: 'Lobar consolidation', isCorrect: false },
        { text: 'Hyperinflation', isCorrect: false },
        { text: 'Cavitation', isCorrect: false },
      ],
      tips: 'Upper lobe vessel prominence due to increased pulmonary venous pressure',
      isPublished: true,
    },
    {
      quizName: 'Chest & Thoracic Radiography Essentials',
      question: "The 'silhouette sign' is most commonly associated with:",
      image: null,
      options: [
        { text: 'Pneumothorax', isCorrect: false },
        { text: 'Lobar pneumonia', isCorrect: true },
        { text: 'Pulmonary embolism', isCorrect: false },
        { text: 'Interstitial fibrosis', isCorrect: false },
      ],
      tips: 'Loss of normal silhouette (e.g. right heart border) due to adjacent consolidation',
      isPublished: true,
    },
    {
      quizName: 'Chest & Thoracic Radiography Essentials',
      question: "The 'spine sign' on lateral chest X-ray suggests:",
      image: null,
      options: [
        { text: 'Pneumothorax', isCorrect: false },
        { text: 'Pleural effusion', isCorrect: true },
        { text: 'Pneumomediastinum', isCorrect: false },
        { text: 'Aortic dissection', isCorrect: false },
      ],
      tips: 'Spine stays dense inferiorly with effusion',
      isPublished: true,
    },
    {
      quizName: 'Chest & Thoracic Radiography Essentials',
      question:
        'Which structure is normally visible on a PA chest X-ray due to air in the trachea?',
      image: null,
      options: [
        { text: 'Right paratracheal stripe', isCorrect: false },
        { text: 'Azygos fissure', isCorrect: false },
        { text: 'Tracheal air column', isCorrect: true },
        { text: 'Minor fissure', isCorrect: false },
      ],
      tips: 'Air-filled trachea appears as a vertical lucency',
      isPublished: true,
    },
    {
      quizName: 'Chest & Thoracic Radiography Essentials',
      question: "A 'reverse batwing' appearance on chest X-ray is typical of:",
      image: null,
      options: [
        { text: 'Pulmonary edema', isCorrect: true },
        { text: 'Aspiration pneumonia', isCorrect: false },
        { text: 'Bronchiectasis', isCorrect: false },
        { text: 'Lung abscess', isCorrect: false },
      ],
      tips: 'Central alveolar opacities sparing costophrenic angles',
      isPublished: true,
    },
    {
      quizName: 'Chest & Thoracic Radiography Essentials',
      question: "The 'golden S sign' is classically associated with:",
      image: null,
      options: [
        { text: 'Right upper lobe collapse', isCorrect: true },
        { text: 'Left lower lobe collapse', isCorrect: false },
        { text: 'Pneumothorax', isCorrect: false },
        { text: 'Pleural effusion', isCorrect: false },
      ],
      tips: 'Reverse S shape due to RUL collapse + hilar mass',
      isPublished: true,
    },
    {
      quizName: 'Chest & Thoracic Radiography Essentials',
      question:
        'Which finding is most suggestive of pneumomediastinum on chest X-ray?',
      image: null,
      options: [
        { text: 'Continuous diaphragm sign', isCorrect: true },
        { text: 'Deep sulcus sign', isCorrect: false },
        { text: 'Kerley B lines', isCorrect: false },
        { text: 'Cephalization', isCorrect: false },
      ],
      tips: 'Air outlines the central diaphragm',
      isPublished: true,
    },
    {
      quizName: 'Chest & Thoracic Radiography Essentials',
      question:
        'The most common cause of lobar consolidation on chest X-ray is:',
      image: null,
      options: [
        { text: 'Bacterial pneumonia', isCorrect: true },
        { text: 'Pulmonary embolism', isCorrect: false },
        { text: 'Interstitial lung disease', isCorrect: false },
        { text: 'Pneumothorax', isCorrect: false },
      ],
      tips: 'Airspace opacification with air bronchograms',
      isPublished: true,
    },
    {
      quizName: 'Chest & Thoracic Radiography Essentials',
      question: "The 'hilum overlay sign' helps distinguish:",
      image: null,
      options: [
        { text: 'Anterior vs posterior mediastinal mass', isCorrect: true },
        { text: 'Pneumonia vs atelectasis', isCorrect: false },
        { text: 'Pleural effusion vs consolidation', isCorrect: false },
        { text: 'Pneumothorax vs pneumomediastinum', isCorrect: false },
      ],
      tips: 'If hilum is visible through mass → anterior',
      isPublished: true,
    },

    // ─── Quiz 3: Radiation Protection & Safety Fundamentals (CAMRT) ──────────
    {
      quizName: 'Radiation Protection & Safety Fundamentals',
      question: 'The ALARA principle stands for:',
      options: [
        { text: 'As Low As Reasonably Achievable', isCorrect: true },
        { text: 'As Low As Radiation Allowed', isCorrect: false },
        { text: 'All Levels Are Risky Always', isCorrect: false },
        { text: 'As Long As Radiation is Avoided', isCorrect: false },
      ],
      tips: 'Core radiation protection philosophy',
      isPublished: true,
    },
    {
      quizName: 'Radiation Protection & Safety Fundamentals',
      question: 'Which is the most effective method of radiation protection?',
      options: [
        { text: 'Time', isCorrect: false },
        { text: 'Distance', isCorrect: false },
        { text: 'Shielding', isCorrect: false },
        { text: 'All are equally important', isCorrect: true },
      ],
      tips: 'Time, distance, and shielding are the three cardinal principles',
      isPublished: true,
    },
    {
      quizName: 'Radiation Protection & Safety Fundamentals',
      question: 'The unit of absorbed dose is:',
      options: [
        { text: 'Sievert (Sv)', isCorrect: false },
        { text: 'Gray (Gy)', isCorrect: true },
        { text: 'Roentgen (R)', isCorrect: false },
        { text: 'Becquerel (Bq)', isCorrect: false },
      ],
      tips: 'Gray measures energy absorbed per unit mass',
      isPublished: true,
    },
    {
      quizName: 'Radiation Protection & Safety Fundamentals',
      question: 'Effective dose is measured in:',
      options: [
        { text: 'Gray (Gy)', isCorrect: false },
        { text: 'Sievert (Sv)', isCorrect: true },
        { text: 'Roentgen (R)', isCorrect: false },
        { text: 'Curie (Ci)', isCorrect: false },
      ],
      tips: 'Accounts for biological effectiveness and tissue weighting',
      isPublished: true,
    },
    {
      quizName: 'Radiation Protection & Safety Fundamentals',
      question:
        'The primary source of scatter radiation during fluoroscopy is:',
      options: [
        { text: 'Patient', isCorrect: true },
        { text: 'X-ray tube', isCorrect: false },
        { text: 'Image intensifier', isCorrect: false },
        { text: 'Collimator', isCorrect: false },
      ],
      tips: 'Scatter originates from the patient’s body',
      isPublished: true,
    },
    {
      quizName: 'Radiation Protection & Safety Fundamentals',
      question:
        'Which protective device is most important for reducing operator dose during fluoroscopy?',
      options: [
        { text: 'Lead apron', isCorrect: false },
        { text: 'Thyroid shield', isCorrect: false },
        { text: 'Ceiling-suspended lead shield', isCorrect: true },
        { text: 'Lead glasses', isCorrect: false },
      ],
      tips: 'Most effective scatter barrier between operator and patient',
      isPublished: true,
    },
    {
      quizName: 'Radiation Protection & Safety Fundamentals',
      question:
        'The maximum permissible dose for a radiation worker (whole body) per year is:',
      options: [
        { text: '20 mSv', isCorrect: true },
        { text: '50 mSv', isCorrect: false },
        { text: '100 mSv', isCorrect: false },
        { text: '150 mSv', isCorrect: false },
      ],
      tips: 'ICRP and Canadian regulatory limit (averaged over 5 years)',
      isPublished: true,
    },
    {
      quizName: 'Radiation Protection & Safety Fundamentals',
      question:
        'Which type of radiation has the highest linear energy transfer (LET)?',
      options: [
        { text: 'X-rays', isCorrect: false },
        { text: 'Alpha particles', isCorrect: true },
        { text: 'Gamma rays', isCorrect: false },
        { text: 'Beta particles', isCorrect: false },
      ],
      tips: 'Alpha particles deposit energy densely → high biological damage',
      isPublished: true,
    },
    {
      quizName: 'Radiation Protection & Safety Fundamentals',
      question: 'The main purpose of collimation in radiography is to reduce:',
      options: [
        { text: 'Patient dose', isCorrect: true },
        { text: 'Image contrast', isCorrect: false },
        { text: 'Scatter radiation only', isCorrect: false },
        { text: 'Tube loading', isCorrect: false },
      ],
      tips: 'Limits field size → reduces exposed tissue volume',
      isPublished: true,
    },
    {
      quizName: 'Radiation Protection & Safety Fundamentals',
      question:
        'Which personal dosimeter is best suited for measuring effective dose?',
      options: [
        { text: 'Film badge', isCorrect: false },
        { text: 'TLD (thermoluminescent dosimeter)', isCorrect: true },
        { text: 'Pocket ion chamber', isCorrect: false },
        { text: 'Geiger counter', isCorrect: false },
      ],
      tips: 'TLD provides accurate integrated dose over time',
      isPublished: true,
    },
  ],

  users: [
    {
      email: 'jane.sonographer@example.com',
      username: 'janesono',
      password: '$2b$10$KZ7j8f9p0q1r2s3t4u5v6w7x8y9z0a1b2c3d4e5f6g7h8i9j0k1l2m', // bcrypt hash example
      fullName: 'Jane Sonographer',
      avatar:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      role: 'user',
      isVerified: true,
      favoriteCategories: ['ARDMS', 'Sonography Canada'],
      lifetimeTotalScore: 1850,
    },
    {
      email: 'mike.radiographer@example.com',
      username: 'mikerad',
      password: '$2b$10$a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7',
      fullName: 'Mike Radiographer',
      avatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      role: 'user',
      isVerified: true,
      favoriteCategories: ['ARRT', 'CAMRT'],
      lifetimeTotalScore: 1420,
    },
    {
      email: 'sarah.tech@example.com',
      username: 'sarahcamrt',
      password: '$2b$10$b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8',
      fullName: 'Sarah Tech',
      avatar:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
      role: 'user',
      isVerified: true,
      favoriteCategories: ['CAMRT'],
      lifetimeTotalScore: 960,
    },
    {
      email: 'admin@flyprep.com',
      username: 'admin',
      password: '$2b$10$c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9',
      fullName: 'Admin User',
      role: 'admin',
      isVerified: true,
      favoriteCategories: [],
      lifetimeTotalScore: 0,
    },
    {
      email: 'moderator@flyprep.com',
      username: 'moderator1',
      password: '$2b$10$d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0',
      fullName: 'Moderator One',
      role: 'moderator',
      isVerified: true,
      favoriteCategories: [],
      lifetimeTotalScore: 0,
    },
  ],

  reviews: [
    {
      quizName: 'Ultrasound Physics & Instrumentation Basics',
      userEmail: 'jane.sonographer@example.com',
      title: 'Excellent physics review!',
      comment:
        'Very clear explanations on artifacts and Doppler. Perfect for SPI prep.',
      rating: 5,
    },
    {
      quizName: 'Ultrasound Physics & Instrumentation Basics',
      userEmail: 'mike.radiographer@example.com',
      title: 'Solid but needs more images',
      comment:
        'Good content, but would love more visual examples of artifacts.',
      rating: 4,
    },
    {
      quizName: 'Chest & Thoracic Radiography Essentials',
      userEmail: 'sarah.tech@example.com',
      title: 'Great for ARRT review',
      comment:
        'The silhouette and spine signs were explained perfectly. Highly recommend.',
      rating: 5,
    },
    {
      quizName: 'Chest & Thoracic Radiography Essentials',
      userEmail: 'jane.sonographer@example.com',
      title: 'Helpful signs section',
      comment:
        'Loved the deep sulcus and golden S sign explanations. Very useful.',
      rating: 4,
    },
    {
      quizName: 'Radiation Protection & Safety Fundamentals',
      userEmail: 'mike.radiographer@example.com',
      title: 'ALARA made simple',
      comment: 'Clear breakdown of time/distance/shielding and dose limits.',
      rating: 5,
    },
    {
      quizName: 'Radiation Protection & Safety Fundamentals',
      userEmail: 'admin@flyprep.com',
      title: 'Good foundational content',
      comment: 'Excellent for new techs. Would add more regulatory detail.',
      rating: 4,
    },
  ],

  leaderboardEntries: [
    // Week 10 – Global
    {
      period: '2025-week-10',
      userEmail: 'jane.sonographer@example.com',
      totalScore: 850,
      quizAttempts: 12,
      averagePercentage: 88.5,
      bestPercentage: 96,
      lastAttemptAt: new Date('2025-03-05T14:30:00Z'),
      categoryScores: { ARDMS: 620, 'Sonography Canada': 230 },
    },
    {
      period: '2025-week-10',
      userEmail: 'mike.radiographer@example.com',
      totalScore: 720,
      quizAttempts: 9,
      averagePercentage: 82,
      bestPercentage: 94,
      lastAttemptAt: new Date('2025-03-06T09:15:00Z'),
      categoryScores: { ARRT: 500, CAMRT: 220 },
    },
    {
      period: '2025-week-10',
      userEmail: 'sarah.tech@example.com',
      totalScore: 680,
      quizAttempts: 11,
      averagePercentage: 78,
      bestPercentage: 89,
      lastAttemptAt: new Date('2025-03-07T11:45:00Z'),
      categoryScores: { CAMRT: 680 },
    },

    // Week 11 – Global
    {
      period: '2025-week-11',
      userEmail: 'jane.sonographer@example.com',
      totalScore: 920,
      quizAttempts: 15,
      averagePercentage: 90.2,
      bestPercentage: 98,
      lastAttemptAt: new Date('2025-03-12T16:20:00Z'),
      categoryScores: { ARDMS: 700, 'Sonography Canada': 220 },
    },
    {
      period: '2025-week-11',
      userEmail: 'mike.radiographer@example.com',
      totalScore: 790,
      quizAttempts: 10,
      averagePercentage: 85,
      bestPercentage: 93,
      lastAttemptAt: new Date('2025-03-13T08:50:00Z'),
      categoryScores: { ARRT: 550, CAMRT: 240 },
    },

    // Month 03 – Global
    {
      period: '2025-month-03',
      userEmail: 'jane.sonographer@example.com',
      totalScore: 2450,
      quizAttempts: 38,
      averagePercentage: 89,
      bestPercentage: 98,
      lastAttemptAt: new Date('2025-03-20T13:10:00Z'),
      categoryScores: { ARDMS: 1800, 'Sonography Canada': 650 },
    },
    {
      period: '2025-month-03',
      userEmail: 'mike.radiographer@example.com',
      totalScore: 1980,
      quizAttempts: 28,
      averagePercentage: 84,
      bestPercentage: 94,
      lastAttemptAt: new Date('2025-03-25T10:30:00Z'),
      categoryScores: { ARRT: 1300, CAMRT: 680 },
    },
    // ... you can add more entries as needed
  ],
}

export default data
