// SAKSHAM Seed Script
// Run: npx tsx scripts/seed.ts
// Seeds initial disaster types, learning modules, quizzes, and scenarios

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

let databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl && fs.existsSync(path.resolve('.env.local'))) {
  const envContent = fs.readFileSync(path.resolve('.env.local'), 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('DATABASE_URL=')) {
      databaseUrl = trimmed.substring('DATABASE_URL='.length).trim();
      break;
    }
  }
}

if (!databaseUrl) {
  console.error('DATABASE_URL not found in .env.local or environment');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function seed() {
  console.log('🌱 Seeding SAKSHAM database...');

  // 1. Disasters
  console.log('📋 Seeding disasters...');
  await sql`
    INSERT INTO disasters (name, icon, description) VALUES
    ('Earthquake', '🌍', 'A sudden shaking of the ground caused by seismic waves. Learn how to Drop, Cover, and Hold On.'),
    ('Flood', '🌊', 'Overflow of water onto normally dry land. Know when to evacuate and how to stay safe.'),
    ('Fire', '🔥', 'Uncontrolled burning that can spread rapidly. Learn fire safety, evacuation, and stop-drop-roll.')
    ON CONFLICT DO NOTHING
  `;

  // Get disaster IDs
  const disasters = await sql`SELECT id, name FROM disasters`;
  const earthquakeId = disasters.find((d: { name: string }) => d.name === 'Earthquake')?.id;
  const floodId = disasters.find((d: { name: string }) => d.name === 'Flood')?.id;
  const fireId = disasters.find((d: { name: string }) => d.name === 'Fire')?.id;

  // 2. Learning Modules
  console.log('📚 Seeding learning modules...');
  const modules = await sql`
    INSERT INTO learning_modules (disaster_id, title, description, difficulty, estimated_minutes, is_published)
    VALUES
    (${earthquakeId}, 'Earthquake Safety Basics', 'Learn the fundamental steps to protect yourself during an earthquake. Master Drop, Cover, and Hold On.', 'beginner', 10, true),
    (${earthquakeId}, 'Drop, Cover, Hold On Mastery', 'In-depth guide to protecting your vital organs, finding safe spots, and avoiding falling objects.', 'beginner', 8, true),
    (${floodId}, 'Flood Awareness & Warnings', 'Understand flood risks, early warning systems, and essential emergency survival preparation.', 'beginner', 12, true),
    (${floodId}, 'Flood Evacuation & Higher Ground', 'Crucial guidelines on when and how to evacuate safely without wading through fast floodwaters.', 'intermediate', 15, true),
    (${fireId}, 'Fire Safety Essentials', 'Comprehensive fire prevention, detection, fire triangle understanding, and building escape routes.', 'beginner', 10, true),
    (${fireId}, 'Stop, Drop, and Roll & Extinguishers', 'Techniques when clothes catch fire, using PASS extinguisher method, and smoke avoidance.', 'beginner', 8, true)
    ON CONFLICT DO NOTHING
    RETURNING id, title
  `;

  // 3. Quizzes
  console.log('📝 Seeding quizzes...');
  const quizResults = await sql`
    INSERT INTO quizzes (disaster_id, title, description, passing_score, is_published)
    VALUES
    (${earthquakeId}, 'Earthquake Safety Quiz', 'Test your knowledge about earthquake preparedness and response', 70, true),
    (${floodId}, 'Flood Safety Quiz', 'Test your knowledge about flood awareness and safety', 70, true),
    (${fireId}, 'Fire Safety Quiz', 'Test your knowledge about fire prevention and response', 70, true)
    ON CONFLICT DO NOTHING
    RETURNING id, title
  `;

  const quizList = quizResults.length > 0 ? quizResults : await sql`SELECT id, title FROM quizzes ORDER BY id`;

  // 5. Quiz Questions + Options
  console.log('❓ Seeding quiz questions...');
  for (const quiz of quizList) {
    if (quiz.title.includes('Earthquake')) {
      const q1 = await sql`INSERT INTO quiz_questions (quiz_id, question_text, explanation, display_order, points) VALUES (${quiz.id}, 'What should you do FIRST when you feel an earthquake?', 'The Drop, Cover, and Hold On technique is the recommended response. Running outside during shaking is dangerous.', 1, 10) ON CONFLICT DO NOTHING RETURNING id`;
      if (q1.length) {
        await sql`INSERT INTO quiz_options (question_id, option_text, is_correct, display_order) VALUES
          (${q1[0].id}, 'Run outside immediately', false, 1),
          (${q1[0].id}, 'Drop, Cover, and Hold On', true, 2),
          (${q1[0].id}, 'Stand in a doorway', false, 3),
          (${q1[0].id}, 'Call emergency services', false, 4)
          ON CONFLICT DO NOTHING`;
      }
      const q2 = await sql`INSERT INTO quiz_questions (quiz_id, question_text, explanation, display_order, points) VALUES (${quiz.id}, 'After an earthquake stops, what should you be prepared for?', 'Aftershocks are smaller earthquakes that follow the main one. They can cause additional damage.', 2, 10) ON CONFLICT DO NOTHING RETURNING id`;
      if (q2.length) {
        await sql`INSERT INTO quiz_options (question_id, option_text, is_correct, display_order) VALUES
          (${q2[0].id}, 'Nothing, it is safe now', false, 1),
          (${q2[0].id}, 'Aftershocks', true, 2),
          (${q2[0].id}, 'Immediate rebuilding', false, 3),
          (${q2[0].id}, 'Going back to sleep', false, 4)
          ON CONFLICT DO NOTHING`;
      }
      const q3 = await sql`INSERT INTO quiz_questions (quiz_id, question_text, explanation, display_order, points) VALUES (${quiz.id}, 'Which is the SAFEST place to be during an earthquake indoors?', 'Under a sturdy desk or table provides protection from falling objects.', 3, 10) ON CONFLICT DO NOTHING RETURNING id`;
      if (q3.length) {
        await sql`INSERT INTO quiz_options (question_id, option_text, is_correct, display_order) VALUES
          (${q3[0].id}, 'Near a window', false, 1),
          (${q3[0].id}, 'In an elevator', false, 2),
          (${q3[0].id}, 'Under a sturdy desk or table', true, 3),
          (${q3[0].id}, 'On the roof', false, 4)
          ON CONFLICT DO NOTHING`;
      }
      const q4 = await sql`INSERT INTO quiz_questions (quiz_id, question_text, explanation, display_order, points) VALUES (${quiz.id}, 'India is divided into how many seismic zones?', 'India has 4 seismic zones (Zone II to Zone V), with Zone V being the most earthquake-prone.', 4, 10) ON CONFLICT DO NOTHING RETURNING id`;
      if (q4.length) {
        await sql`INSERT INTO quiz_options (question_id, option_text, is_correct, display_order) VALUES
          (${q4[0].id}, '2', false, 1),
          (${q4[0].id}, '3', false, 2),
          (${q4[0].id}, '4', true, 3),
          (${q4[0].id}, '5', false, 4)
          ON CONFLICT DO NOTHING`;
      }
      const q5 = await sql`INSERT INTO quiz_questions (quiz_id, question_text, explanation, display_order, points) VALUES (${quiz.id}, 'What should you NEVER do during an earthquake?', 'Using elevators during an earthquake is extremely dangerous due to potential power failure and structural damage.', 5, 10) ON CONFLICT DO NOTHING RETURNING id`;
      if (q5.length) {
        await sql`INSERT INTO quiz_options (question_id, option_text, is_correct, display_order) VALUES
          (${q5[0].id}, 'Duck under a table', false, 1),
          (${q5[0].id}, 'Use the elevator', true, 2),
          (${q5[0].id}, 'Protect your head', false, 3),
          (${q5[0].id}, 'Stay away from windows', false, 4)
          ON CONFLICT DO NOTHING`;
      }
    }

    if (quiz.title.includes('Fire')) {
      const q1 = await sql`INSERT INTO quiz_questions (quiz_id, question_text, explanation, display_order, points) VALUES (${quiz.id}, 'What are the three things fire needs to burn?', 'The Fire Triangle consists of Heat, Fuel, and Oxygen. Remove any one to extinguish a fire.', 1, 10) ON CONFLICT DO NOTHING RETURNING id`;
      if (q1.length) {
        await sql`INSERT INTO quiz_options (question_id, option_text, is_correct, display_order) VALUES
          (${q1[0].id}, 'Water, Air, Paper', false, 1),
          (${q1[0].id}, 'Heat, Fuel, Oxygen', true, 2),
          (${q1[0].id}, 'Fire, Smoke, Wood', false, 3),
          (${q1[0].id}, 'Wind, Heat, Light', false, 4)
          ON CONFLICT DO NOTHING`;
      }
      const q2 = await sql`INSERT INTO quiz_questions (quiz_id, question_text, explanation, display_order, points) VALUES (${quiz.id}, 'If your clothes catch fire, what should you do?', 'Stop, Drop, and Roll smothers the flames and prevents the fire from spreading on your body.', 2, 10) ON CONFLICT DO NOTHING RETURNING id`;
      if (q2.length) {
        await sql`INSERT INTO quiz_options (question_id, option_text, is_correct, display_order) VALUES
          (${q2[0].id}, 'Run to find water', false, 1),
          (${q2[0].id}, 'Stop, Drop, and Roll', true, 2),
          (${q2[0].id}, 'Fan the flames', false, 3),
          (${q2[0].id}, 'Take off your clothes', false, 4)
          ON CONFLICT DO NOTHING`;
      }
      const q3 = await sql`INSERT INTO quiz_questions (quiz_id, question_text, explanation, display_order, points) VALUES (${quiz.id}, 'Why should you stay LOW during a fire?', 'Smoke and toxic gases rise. The air near the floor is cleaner and cooler, making it easier to breathe.', 3, 10) ON CONFLICT DO NOTHING RETURNING id`;
      if (q3.length) {
        await sql`INSERT INTO quiz_options (question_id, option_text, is_correct, display_order) VALUES
          (${q3[0].id}, 'To avoid being seen', false, 1),
          (${q3[0].id}, 'Smoke rises, cleaner air is below', true, 2),
          (${q3[0].id}, 'To move faster', false, 3),
          (${q3[0].id}, 'To find exits easier', false, 4)
          ON CONFLICT DO NOTHING`;
      }
    }

    if (quiz.title.includes('Flood')) {
      const q1 = await sql`INSERT INTO quiz_questions (quiz_id, question_text, explanation, display_order, points) VALUES (${quiz.id}, 'How many inches of moving water can knock a person down?', 'Even 6 inches (15cm) of fast-moving water can knock you off your feet. Never walk through floodwater.', 1, 10) ON CONFLICT DO NOTHING RETURNING id`;
      if (q1.length) {
        await sql`INSERT INTO quiz_options (question_id, option_text, is_correct, display_order) VALUES
          (${q1[0].id}, '6 inches', true, 1),
          (${q1[0].id}, '2 feet', false, 2),
          (${q1[0].id}, '4 feet', false, 3),
          (${q1[0].id}, '1 foot', false, 4)
          ON CONFLICT DO NOTHING`;
      }
      const q2 = await sql`INSERT INTO quiz_questions (quiz_id, question_text, explanation, display_order, points) VALUES (${quiz.id}, 'During a flood, you should move to:', 'Higher ground is the safest place during a flood. Avoid low-lying areas and basements.', 2, 10) ON CONFLICT DO NOTHING RETURNING id`;
      if (q2.length) {
        await sql`INSERT INTO quiz_options (question_id, option_text, is_correct, display_order) VALUES
          (${q2[0].id}, 'The basement', false, 1),
          (${q2[0].id}, 'Higher ground', true, 2),
          (${q2[0].id}, 'Near the river', false, 3),
          (${q2[0].id}, 'Under a bridge', false, 4)
          ON CONFLICT DO NOTHING`;
      }
      const q3 = await sql`INSERT INTO quiz_questions (quiz_id, question_text, explanation, display_order, points) VALUES (${quiz.id}, 'Which type of flood happens most quickly and is most dangerous?', 'Flash floods develop within minutes to hours of heavy rain, dam failure, or levee break. They are the most dangerous.', 3, 10) ON CONFLICT DO NOTHING RETURNING id`;
      if (q3.length) {
        await sql`INSERT INTO quiz_options (question_id, option_text, is_correct, display_order) VALUES
          (${q3[0].id}, 'River flood', false, 1),
          (${q3[0].id}, 'Flash flood', true, 2),
          (${q3[0].id}, 'Urban flood', false, 3),
          (${q3[0].id}, 'Coastal flood', false, 4)
          ON CONFLICT DO NOTHING`;
      }
    }
  }

  // 6. Scenarios
  console.log('🎮 Seeding scenarios...');
  const scenarioResults = await sql`
    INSERT INTO scenarios (disaster_id, title, description, difficulty, is_published)
    VALUES
    (${earthquakeId}, 'Earthquake in Classroom', 'You are in your classroom when a strong earthquake strikes. Make the right decisions to stay safe.', 'beginner', true),
    (${fireId}, 'Fire in School Lab', 'A fire breaks out in the chemistry lab while you are nearby. What do you do?', 'intermediate', true)
    ON CONFLICT DO NOTHING
    RETURNING id, title
  `;

  const scenarioList = scenarioResults.length > 0 ? scenarioResults : await sql`SELECT id, title FROM scenarios ORDER BY id`;

  // 7. Scenario Steps + Options
  console.log('🎯 Seeding scenario steps...');
  for (const scen of scenarioList) {
    if (scen.title.includes('Earthquake')) {
      const s1 = await sql`INSERT INTO scenario_steps (scenario_id, step_number, situation_text, display_order) VALUES (${scen.id}, 1, 'You are sitting in your classroom when the ground starts shaking violently. Books fall from shelves. Other students start screaming. What do you do?', 1) ON CONFLICT DO NOTHING RETURNING id`;
      if (s1.length) {
        await sql`INSERT INTO scenario_options (step_id, option_text, score, feedback, is_best_choice, display_order) VALUES
          (${s1[0].id}, 'DROP under your desk, COVER your head, and HOLD ON', 10, 'Excellent! Drop, Cover, Hold On is the recommended response during an earthquake.', true, 1),
          (${s1[0].id}, 'Run out of the classroom immediately', 3, 'Running during shaking is dangerous — you could be hit by falling debris or trip.', false, 2),
          (${s1[0].id}, 'Stand in the doorway', 5, 'Standing in doorways is an outdated recommendation. Under a desk is safer.', false, 3),
          (${s1[0].id}, 'Panic and freeze in place', 2, 'While understandable, freezing leaves you unprotected. Take cover under a sturdy surface.', false, 4)
          ON CONFLICT DO NOTHING`;
      }
      const s2 = await sql`INSERT INTO scenario_steps (scenario_id, step_number, situation_text, display_order) VALUES (${scen.id}, 2, 'The shaking has stopped. You hear the fire alarm ringing. Your teacher tells everyone to evacuate. What do you do?', 2) ON CONFLICT DO NOTHING RETURNING id`;
      if (s2.length) {
        await sql`INSERT INTO scenario_options (step_id, option_text, score, feedback, is_best_choice, display_order) VALUES
          (${s2[0].id}, 'Calmly walk to the nearest exit, following the evacuation route', 10, 'Great choice! Staying calm and following the designated route is safest.', true, 1),
          (${s2[0].id}, 'Take the elevator to get down faster', 2, 'NEVER use elevators after an earthquake — they may get stuck or the shaft may be damaged.', false, 2),
          (${s2[0].id}, 'Go back to your classroom to get your bag', 3, 'Your safety is more important than belongings. Evacuate first, retrieve items later.', false, 3),
          (${s2[0].id}, 'Run as fast as you can', 5, 'Rushing can cause stampede situations. Walk briskly but calmly.', false, 4)
          ON CONFLICT DO NOTHING`;
      }
      const s3 = await sql`INSERT INTO scenario_steps (scenario_id, step_number, situation_text, display_order) VALUES (${scen.id}, 3, 'You are now outside. Where do you go?', 3) ON CONFLICT DO NOTHING RETURNING id`;
      if (s3.length) {
        await sql`INSERT INTO scenario_options (step_id, option_text, score, feedback, is_best_choice, display_order) VALUES
          (${s3[0].id}, 'Go to the designated assembly point and wait for a headcount', 10, 'Perfect! The assembly point is where teachers can account for all students.', true, 1),
          (${s3[0].id}, 'Stand near the school building', 3, 'Stay away from buildings after an earthquake — there might be aftershocks causing further collapse.', false, 2),
          (${s3[0].id}, 'Leave the school premises to go home', 2, 'Stay at the assembly point. Your parents will be informed. Leaving makes it harder to ensure everyone is safe.', false, 3),
          (${s3[0].id}, 'Start using your phone to call parents', 5, 'While communication is important, first ensure you are at the assembly point. Keep phone lines clear for emergencies.', false, 4)
          ON CONFLICT DO NOTHING`;
      }
    }

    if (scen.title.includes('Fire')) {
      const s1 = await sql`INSERT INTO scenario_steps (scenario_id, step_number, situation_text, display_order) VALUES (${scen.id}, 1, 'You smell smoke coming from the chemistry lab next door. You see a small flame through the glass window. What is your FIRST action?', 1) ON CONFLICT DO NOTHING RETURNING id`;
      if (s1.length) {
        await sql`INSERT INTO scenario_options (step_id, option_text, score, feedback, is_best_choice, display_order) VALUES
          (${s1[0].id}, 'Alert others and pull the fire alarm', 10, 'Excellent! Alerting others and activating the alarm is the first priority (RACE: Rescue, Alarm).', true, 1),
          (${s1[0].id}, 'Try to put out the fire yourself', 3, 'Unless you are trained and the fire is very small, attempting to fight it is dangerous.', false, 2),
          (${s1[0].id}, 'Open the lab door to check', 2, 'NEVER open a door that may have fire behind it. Opening introduces oxygen and can cause a backdraft.', false, 3),
          (${s1[0].id}, 'Ignore it and continue walking', 1, 'Never ignore signs of fire. A small fire can become life-threatening in seconds.', false, 4)
          ON CONFLICT DO NOTHING`;
      }
      const s2 = await sql`INSERT INTO scenario_steps (scenario_id, step_number, situation_text, display_order) VALUES (${scen.id}, 2, 'The fire alarm is now ringing. The hallway is starting to fill with smoke. How do you evacuate?', 2) ON CONFLICT DO NOTHING RETURNING id`;
      if (s2.length) {
        await sql`INSERT INTO scenario_options (step_id, option_text, score, feedback, is_best_choice, display_order) VALUES
          (${s2[0].id}, 'Stay low and crawl below the smoke to the nearest exit', 10, 'Perfect! Smoke rises, so staying low gives you the cleanest air to breathe.', true, 1),
          (${s2[0].id}, 'Run upright through the smoke', 4, 'Running through smoke upright means breathing in toxic fumes. Stay low.', false, 2),
          (${s2[0].id}, 'Hide in a classroom and wait', 5, 'If you cannot evacuate, seal door gaps and signal from a window. But evacuation is preferred.', false, 3),
          (${s2[0].id}, 'Go back to get your friends from another floor', 3, 'Alert authorities about people who may be trapped. Do not go back into danger.', false, 4)
          ON CONFLICT DO NOTHING`;
      }
    }
  }

  // 8. Global Emergency Resources
  console.log('🚨 Seeding emergency resources...');
  await sql`
    INSERT INTO emergency_resources (institution_id, resource_type, title, phone_number, content, display_order, is_active) VALUES
    (NULL, 'phone', 'National Emergency Number', '112', 'Single emergency number for all emergencies across India', 1, true),
    (NULL, 'phone', 'Fire Department', '101', 'Call for fire emergencies', 2, true),
    (NULL, 'phone', 'Ambulance', '108', 'Emergency medical services', 3, true),
    (NULL, 'phone', 'National Disaster Response Force', '011-26107953', 'NDRF Emergency Helpline', 4, true),
    (NULL, 'phone', 'Women Helpline', '1091', 'National women emergency helpline', 5, true),
    (NULL, 'phone', 'Child Helpline', '1098', 'CHILDLINE for children in distress', 6, true)
    ON CONFLICT DO NOTHING
  `;

  console.log('✅ Seed complete!');
}

seed().catch(e => {
  console.error('❌ Seed failed:', e);
  process.exit(1);
});
