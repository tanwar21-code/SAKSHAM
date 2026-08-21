import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const moduleResult = await query(
      `SELECT lm.*, d.name as disaster_name, d.icon
       FROM learning_modules lm
       JOIN disasters d ON d.id = lm.disaster_id
       WHERE lm.id = $1 AND lm.is_published = true`,
      [id]
    );

    if (moduleResult.length === 0) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    const mod = moduleResult[0] as {
      id: number;
      title: string;
      description: string;
      disaster_name: string;
      icon: string;
      difficulty: string;
      estimated_minutes: number;
    };

    // Generate rich structured lessons based on module content
    let lessons: Array<{ id: number; title: string; lesson_type: string; content: string; display_order: number }> = [];

    const disasterLower = mod.disaster_name.toLowerCase();

    if (disasterLower.includes('earthquake')) {
      lessons = [
        {
          id: 1,
          title: 'Understanding Earthquakes',
          lesson_type: 'theory',
          display_order: 1,
          content: `
            <p>An <strong>earthquake</strong> is the sudden violent shaking of the ground resulting from movements within the earth's crust or volcanic action.</p>
            <h3>Key Disaster Facts</h3>
            <ul>
              <li>Earthquakes happen without prior warning.</li>
              <li>India is classified into 4 seismic zones (Zone II to Zone V).</li>
              <li>Zone V represents the highest seismic risk zones (Himalayan belt, Kutch, Northeast).</li>
            </ul>
            <div class="do"><strong>✅ Golden Rule:</strong> Drop, Cover, and Hold On immediately when shaking begins.</div>
          `,
        },
        {
          id: 2,
          title: 'Before the Quake: Hazard Hunt & Preparation',
          lesson_type: 'theory',
          display_order: 2,
          content: `
            <h3>Preparation at School & Home</h3>
            <ul>
              <li><strong>Secure Heavy Furniture:</strong> Anchor cupboards, shelves, and heavy appliances to the walls.</li>
              <li><strong>Emergency Go-Bag:</strong> Pack clean water bottles, first-aid kit, torch/flashlight, whistle, and emergency contact list.</li>
              <li><strong>Know Your Exits:</strong> Identify two safe exit paths from each room or classroom.</li>
            </ul>
            <div class="dont"><strong>❌ NEVER:</strong> Place heavy objects or photo frames above beds or student study desks.</div>
          `,
        },
        {
          id: 3,
          title: 'During the Quake: Drop, Cover, Hold On',
          lesson_type: 'action',
          display_order: 3,
          content: `
            <h3>The 3 Core Steps:</h3>
            <ol>
              <li><strong>DROP:</strong> Drop down onto your hands and knees. This position protects you from being knocked down.</li>
              <li><strong>COVER:</strong> Cover your head and neck with your arms. If sturdy shelter like a desk or table is nearby, crawl underneath it.</li>
              <li><strong>HOLD ON:</strong> Hold on to your shelter with one hand and stay ready to move with it until shaking stops.</li>
            </ol>
            <div class="dont"><strong>❌ DANGER:</strong> Do NOT run outside while tremors are active. Falling glass, tiles, and power lines cause most injuries.</div>
          `,
        },
        {
          id: 4,
          title: 'Post-Earthquake Evacuation & Safety',
          lesson_type: 'evacuation',
          display_order: 4,
          content: `
            <h3>Immediate Actions After Shaking Stops:</h3>
            <ul>
              <li><strong>Calm Evacuation:</strong> Walk briskly to the designated outdoor assembly point.</li>
              <li><strong>Avoid Hazards:</strong> Stay far away from damaged masonry, downed electric wires, and glass panels.</li>
              <li><strong>Expect Aftershocks:</strong> Secondary tremors frequently follow the main quake.</li>
            </ul>
            <div class="do"><strong>✅ Emergency Contacts:</strong> Call <strong>112</strong> (National Emergency) or <strong>108</strong> (Ambulance).</div>
          `,
        },
      ];
    } else if (disasterLower.includes('fire')) {
      lessons = [
        {
          id: 1,
          title: 'Understanding Fire & The Fire Triangle',
          lesson_type: 'theory',
          display_order: 1,
          content: `
            <p>Fire is a chemical reaction that requires three elements to burn: <strong>Fuel, Oxygen, and Heat</strong>.</p>
            <h3>Common School Fire Hazards</h3>
            <ul>
              <li>Overloaded electrical extension boards and worn cables.</li>
              <li>Chemistry lab chemicals and open bunsen burner flames.</li>
              <li>Combustible clutter near electrical breaker panels.</li>
            </ul>
            <div class="do"><strong>✅ Rule of Thumb:</strong> Removing any one component of the triangle will extinguish the fire.</div>
          `,
        },
        {
          id: 2,
          title: 'The R.A.C.E Protocol',
          lesson_type: 'action',
          display_order: 2,
          content: `
            <h3>When Fire or Smoke is Detected:</h3>
            <ol>
              <li><strong>R - Rescue:</strong> Alert and assist anyone in immediate danger.</li>
              <li><strong>A - Alarm:</strong> Pull the nearest manual call point fire alarm and yell "FIRE!".</li>
              <li><strong>C - Contain:</strong> Close doors and windows behind you to slow smoke spread.</li>
              <li><strong>E - Evacuate:</strong> Move calmly toward the nearest designated emergency fire exit.</li>
            </ol>
            <div class="dont"><strong>❌ NEVER:</strong> Use elevators or lifts during a fire alarm. Always use stairwells.</div>
          `,
        },
        {
          id: 3,
          title: 'Stop, Drop, and Roll',
          lesson_type: 'action',
          display_order: 3,
          content: `
            <h3>If Your Clothing Catches Fire:</h3>
            <ol>
              <li><strong>STOP:</strong> Do not run! Running fans the flames and makes the fire burn faster.</li>
              <li><strong>DROP:</strong> Drop flat to the ground and cover your face with your hands.</li>
              <li><strong>ROLL:</strong> Roll back and forth continuously until all flames are smothered.</li>
            </ol>
            <div class="do"><strong>✅ Tip:</strong> If another person catches fire, wrap them tightly in a thick blanket or coat.</div>
          `,
        },
        {
          id: 4,
          title: 'Smoke Escape & Using Fire Extinguishers (P.A.S.S)',
          lesson_type: 'practical',
          display_order: 4,
          content: `
            <h3>Smoke Inhalation Defense:</h3>
            <p>Toxic smoke rises. <strong>Crawl on your hands and knees</strong> where the coolest, cleanest breathable air is located.</p>
            <h3>P.A.S.S Extinguisher Method:</h3>
            <ul>
              <li><strong>P:</strong> Pull the safety pin.</li>
              <li><strong>A:</strong> Aim low at the base of the fire.</li>
              <li><strong>S:</strong> Squeeze the lever slowly.</li>
              <li><strong>S:</strong> Sweep from side to side.</li>
            </ul>
            <div class="do"><strong>✅ Emergency Number:</strong> Fire Department <strong>101</strong> or Emergency <strong>112</strong>.</div>
          `,
        },
      ];
    } else if (disasterLower.includes('flood')) {
      lessons = [
        {
          id: 1,
          title: 'Types of Floods & Early Warnings',
          lesson_type: 'theory',
          display_order: 1,
          content: `
            <p>Floods occur when water inundates land that is normally dry, often caused by heavy monsoon downpours, dam overflow, or cloudbursts.</p>
            <h3>Types of Flooding</h3>
            <ul>
              <li><strong>Flash Floods:</strong> Rapid raging torrents occurring within minutes of extreme rain.</li>
              <li><strong>Riverine Floods:</strong> Gradual rising of river levels beyond embankments.</li>
              <li><strong>Urban Floods:</strong> Drainage blockages causing deep waterlogged roads in cities.</li>
            </ul>
          `,
        },
        {
          id: 2,
          title: 'Flood Preparedness & Survival Kit',
          lesson_type: 'theory',
          display_order: 2,
          content: `
            <h3>Essential Steps Before Water Rises:</h3>
            <ul>
              <li>Turn off main power breaker switches and gas valves to prevent electrocution and leaks.</li>
              <li>Move critical identity papers, dry rations, and electronics to the top floor or upper shelves.</li>
              <li>Keep an emergency radio or phone charged to monitor IMD meteorological broadcasts.</li>
            </ul>
            <div class="do"><strong>✅ Always:</strong> Store 3 days of clean drinking water in sealed containers.</div>
          `,
        },
        {
          id: 3,
          title: 'Turn Around, Don\'t Drown',
          lesson_type: 'action',
          display_order: 3,
          content: `
            <h3>The Hidden Power of Moving Water:</h3>
            <ul>
              <li><strong>6 Inches (15 cm):</strong> Rushing water of this depth can sweep an adult off their feet.</li>
              <li><strong>12 Inches (30 cm):</strong> Can easily float small cars and motorcycles into deep drains.</li>
              <li><strong>2 Feet (60 cm):</strong> Can carry away almost any heavy SUV or bus.</li>
            </ul>
            <div class="dont"><strong>❌ NEVER:</strong> Swim, play, or drive through flooded underpasses or submerged streets.</div>
          `,
        },
        {
          id: 4,
          title: 'Safe Evacuation & Post-Flood Hygiene',
          lesson_type: 'evacuation',
          display_order: 4,
          content: `
            <h3>Evacuation Protocol:</h3>
            <ul>
              <li>Evacuate early when flood warnings are issued; do not wait until water enters the building.</li>
              <li>Follow designated elevated evacuation routes mapped by local authorities.</li>
              <li>Never drink raw tap or well water post-flood without boiling; contamination is widespread.</li>
            </ul>
            <div class="do"><strong>✅ National Helpline:</strong> NDRF Helpline <strong>011-26107953</strong> / Emergency <strong>112</strong>.</div>
          `,
        },
      ];
    } else {
      // Default structured slides for custom modules
      lessons = [
        {
          id: 1,
          title: `Introduction: ${mod.title}`,
          lesson_type: 'theory',
          display_order: 1,
          content: `
            <p>${mod.description || 'Welcome to this disaster preparedness training module.'}</p>
            <h3>Module Objectives</h3>
            <ul>
              <li>Understand the specific threats and characteristics of this emergency scenario.</li>
              <li>Learn life-saving protocols and quick decision-making under stress.</li>
              <li>Master evacuation and safety coordination procedures.</li>
            </ul>
          `,
        },
        {
          id: 2,
          title: 'Action Steps & Safety Protocols',
          lesson_type: 'action',
          display_order: 2,
          content: `
            <h3>Key Survival Rules</h3>
            <p>During an active emergency, rapid calm response minimizes injuries and protects lives.</p>
            <div class="do"><strong>✅ DO:</strong> Follow verified emergency instructions from teachers and authorities.</div>
            <div class="dont"><strong>❌ DON'T:</strong> Spread unverified rumors or panic in enclosed areas.</div>
          `,
        },
        {
          id: 3,
          title: 'Evacuation & Assembly Point',
          lesson_type: 'evacuation',
          display_order: 3,
          content: `
            <h3>Safe Assembly & Headcount</h3>
            <p>Always proceed to the open ground assembly area away from structural hazards and wait for roll-call verification.</p>
            <div class="do"><strong>✅ Emergency Helpline:</strong> Dial <strong>112</strong> for immediate assistance.</div>
          `,
        },
      ];
    }

    const progress = await query(
      `SELECT progress_percentage, completed
       FROM module_progress
       WHERE student_id = $1 AND module_id = $2`,
      [session.userId, id]
    );

    const relatedQuiz = await query(
      `SELECT id, title FROM quizzes
       WHERE is_published = true AND (
         module_id = $1 OR (module_id IS NULL AND disaster_id = $2)
       )
       ORDER BY CASE WHEN module_id = $1 THEN 0 ELSE 1 END
       LIMIT 1`,
      [id, (moduleResult[0] as Record<string, unknown>).disaster_id]
    );

    return NextResponse.json({
      module: moduleResult[0],
      lessons,
      progress: progress[0] || { progress_percentage: 0, completed: false },
      relatedQuiz: relatedQuiz[0] || null,
    });
  } catch (error) {
    console.error('Module detail error:', error);
    return NextResponse.json({ error: 'Failed to load module' }, { status: 500 });
  }
}
