import asyncio
import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.core.database import AsyncSessionLocal
from app.models.institution import Institution
from app.models.user import User
from app.models.profile import Profile
from app.models.material import Material
from app.models.assignment import Assignment
from app.models.submission import Submission
from app.models.evaluation import AIEvaluation
from app.core.security import get_password_hash


async def seed_data():
    print("=== Seeding database with authentic Rajasthan & Indian Academic Registry demo data ===")
    async with AsyncSessionLocal() as db:
        try:
            # 1. Create or get Institution
            stmt = select(Institution).where(Institution.code == "RAJ-2026")
            res = await db.execute(stmt)
            inst = res.scalars().first()
            if not inst:
                inst = Institution(
                    name="Rajasthan Directorate of School Education",
                    code="RAJ-2026"
                )
                db.add(inst)
                await db.flush()
                print(f"[OK] Created Institution: {inst.name} (Code: {inst.code})")
            else:
                print(f"[INFO] Institution {inst.name} already exists.")

            # Helper function to create user
            async def get_or_create_user(email, password, role, status="active", profile_data=None):
                stmt = select(User).where(User.email == email).options(selectinload(User.profile))
                res = await db.execute(stmt)
                user = res.scalars().first()
                if not user:
                    user = User(
                        email=email,
                        password_hash=get_password_hash(password),
                        role=role,
                        status=status,
                        institution_id=inst.id if role != "SuperAdmin" else None
                    )
                    db.add(user)
                    await db.flush()

                    if profile_data:
                        prof = Profile(
                            user_id=user.id,
                            first_name=profile_data.get("first_name"),
                            last_name=profile_data.get("last_name"),
                            employee_id=profile_data.get("employee_id")
                        )
                        db.add(prof)
                    await db.flush()
                    print(f"  [USER] Created {role}: {profile_data.get('first_name')} {profile_data.get('last_name')} ({email})")
                else:
                    print(f"  [INFO] User {email} already exists.")
                return user

            # 2. Super Administrator (State / Ministry Level)
            superadmin = await get_or_create_user(
                email="superadmin@rajasthan.edu.in",
                password="SuperPassword123!",
                role="SuperAdmin",
                profile_data={"first_name": "Ministry", "last_name": "Registrar", "employee_id": "RAJ-MIN-001"}
            )

            # 3. Institution Administrators (Requested Demo Users)
            admin_devansh = await get_or_create_user(
                email="devansh.kumar@rajasthan.edu.in",
                password="AdminPassword123!",
                role="InstitutionAdmin",
                profile_data={"first_name": "Devansh", "last_name": "Kumar", "employee_id": "RAJ-DIR-001"}
            )

            admin_atharva = await get_or_create_user(
                email="atharva.joshi@rajasthan.edu.in",
                password="AdminPassword123!",
                role="InstitutionAdmin",
                profile_data={"first_name": "Atharva", "last_name": "Joshi", "employee_id": "RAJ-ADM-002"}
            )

            # 4. Teachers / Educators (Requested Demo Users)
            teachers_data = [
                {"first_name": "Ayush", "last_name": "Anand", "email": "ayush.anand@rajasthan.edu.in", "emp_id": "RAJ-TCH-101", "subject": "Physics"},
                {"first_name": "Parth", "last_name": "Shukla", "email": "parth.shukla@rajasthan.edu.in", "emp_id": "RAJ-TCH-102", "subject": "Mathematics"},
                {"first_name": "Gaurika", "last_name": "Kaushik", "email": "gaurika.kaushik@rajasthan.edu.in", "emp_id": "RAJ-TCH-103", "subject": "English & Pedagogy"},
                {"first_name": "Sanskriti", "last_name": "Chaudhary", "email": "sanskriti.chaudhary@rajasthan.edu.in", "emp_id": "RAJ-TCH-104", "subject": "Chemistry"},
                {"first_name": "Satvik", "last_name": "Kshatriya", "email": "satvik.kshatriya@rajasthan.edu.in", "emp_id": "RAJ-TCH-105", "subject": "Social Sciences & History"},
                {"first_name": "Akshat", "last_name": "Sharma", "email": "akshat@rajasthan.edu.in", "emp_id": "RAJ-TCH-106", "subject": "Computer Science"},
                {"first_name": "Vansh", "last_name": "Singhal", "email": "vansh.singhal@rajasthan.edu.in", "emp_id": "RAJ-TCH-107", "subject": "Biology & Environmental Studies"},
            ]

            teacher_objs = []
            for t in teachers_data:
                u = await get_or_create_user(
                    email=t["email"],
                    password="TeacherPassword123!",
                    role="Teacher",
                    profile_data={"first_name": t["first_name"], "last_name": t["last_name"], "employee_id": t["emp_id"]}
                )
                teacher_objs.append(u)

            # 5. Training Materials (CPD Library)
            materials_data = [
                {
                    "title": "NEP 2020: Experiential & Competency-Based Learning",
                    "description": "Comprehensive guide on moving from rote learning to activity-driven lesson design in Rajasthan secondary schools.",
                    "type": "video",
                    "url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                },
                {
                    "title": "Continuous & Comprehensive Evaluation (CCE) in Rajasthan Classrooms",
                    "description": "Formative assessment rubrics, portfolio review methodologies, and diagnostic remediation strategies.",
                    "type": "video",
                    "url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
                },
                {
                    "title": "Differentiated Instruction for Multilingual Classrooms",
                    "description": "Techniques for bridging Hindi, Rajasthani dialects, and English terminology in science and mathematics.",
                    "type": "document",
                    "url": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
                },
                {
                    "title": "DIKSHA & Digital Pedagogy Implementation Guide",
                    "description": "Integrating digital smart boards, QR-coded textbooks, and virtual labs into daily instructional workflows.",
                    "type": "document",
                    "url": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
                }
            ]

            for mat in materials_data:
                m_stmt = select(Material).where(Material.title == mat["title"])
                res = await db.execute(m_stmt)
                m = res.scalars().first()
                if not m:
                    m = Material(
                        institution_id=inst.id,
                        title=mat["title"],
                        description=mat["description"],
                        type=mat["type"],
                        file_url=mat["url"],
                        uploader_id=admin_devansh.id
                    )
                    db.add(m)
                    print(f"  [MATERIAL] Created Material: {mat['title']}")

            # 6. Assignments
            assignments_data = [
                {
                    "title": "Indira Gandhi Canal & Thar Water Security — Class 9 Lesson Design",
                    "description": "Design an inquiry-based lesson plan analyzing the socio-economic and ecological transformation of Western Rajasthan due to the Indira Gandhi Canal network. Include formative assessment checkpoints.",
                    "rubric": {
                        "criteria": [
                            {"name": "Pedagogical Clarity", "weight": 25, "description": "Structured instructional sequence with explicit learning outcomes"},
                            {"name": "Student Engagement & Inquiry", "weight": 25, "description": "Active debate, map-tracing, and roleplaying regional stakeholders"},
                            {"name": "Differentiation & Inclusion", "weight": 25, "description": "Tiered mapping tasks for varied learning paces"},
                            {"name": "Assessment Literacy", "weight": 25, "description": "Exit tickets aligned tightly with environmental policy outcomes"}
                        ]
                    }
                },
                {
                    "title": "Thermodynamics & Laboratory Experimentation — Class 11 Physics",
                    "description": "Create a hands-on laboratory lesson plan on First and Second Laws of Thermodynamics with clear safety protocols and error-analysis rubrics.",
                    "rubric": {
                        "criteria": [
                            {"name": "Conceptual Rigor", "weight": 30, "description": "Mathematical derivation and physical intuition bridging"},
                            {"name": "Practical Demonstration", "weight": 30, "description": "Calorimeter experiment setup and guided student inquiry"},
                            {"name": "Classroom Management", "weight": 20, "description": "Laboratory safety and resource distribution"},
                            {"name": "Formative Checks", "weight": 20, "description": "On-the-spot conceptual check questions"}
                        ]
                    }
                },
                {
                    "title": "Hindi Literature & Regional Heritage — Class 10 Formative Portfolio",
                    "description": "Construct a 2-week formative assessment portfolio on Rajasthani cultural heritage in medieval and modern Hindi poetry.",
                    "rubric": {
                        "criteria": [
                            {"name": "Linguistic Scaffolding", "weight": 35, "description": "Vocabulary and poetic meter analysis guidance"},
                            {"name": "Critical Thinking Prompts", "weight": 35, "description": "Connecting historical themes to contemporary society"},
                            {"name": "Exit Assessment Loop", "weight": 30, "description": "Individual creative writing rubrics"}
                        ]
                    }
                }
            ]

            created_assignments = []
            now_utc = datetime.now(timezone.utc)
            for a_data in assignments_data:
                a_stmt = select(Assignment).where(Assignment.title == a_data["title"])
                res = await db.execute(a_stmt)
                a = res.scalars().first()
                if not a:
                    a = Assignment(
                        institution_id=inst.id,
                        title=a_data["title"],
                        description=a_data["description"],
                        max_score=100,
                        due_date=now_utc + timedelta(days=30),
                        rubric=a_data["rubric"],
                        creator_id=admin_devansh.id
                    )
                    db.add(a)
                    await db.flush()
                    print(f"  [ASSIGNMENT] Created Assignment: {a.title}")
                created_assignments.append(a)

            # 7. Submissions & Evaluations for Teachers
            submissions_data = [
                {
                    "teacher_idx": 0, # Ayush Anand
                    "assignment_idx": 1, # Physics
                    "status": "evaluated",
                    "score": 88.0,
                    "text": """
Lesson Plan: Thermodynamics & Heat Engines (Class 11 Physics)
Objective: Students will analyze PV diagrams and evaluate Carnot cycle efficiency with hands-on calorimeter experiments.
Verbatim Evidence: 'Open your experiment logs: observe how temperature variance alters gas pressure before we derive the formula. The data in your calorimeter is your proof.'
Student Engagement: Group inquiry where pupils calculated thermal efficiency in teams. Cold-call distribution covered 22 of 25 students.
Differentiation: Tiered worksheet provided with advanced stretch problems on enthalpy for high-achievers.
Assessment: Single question exit ticket asking students to calculate entropy change.
                    """,
                    "evaluation": {
                        "overall_score": 88.0,
                        "feedback": "Exemplary lesson structure with outstanding student engagement and rigorous laboratory integration. Objectives were clearly modeled, revisited, and evidenced in student logs.",
                        "scores": [
                            {
                                "criterion": "Conceptual Rigor",
                                "score_assigned": 27.0,
                                "weight": 30,
                                "justification": "Mathematical derivations of PV diagrams were tightly connected to empirical lab data.",
                                "evidence_quote": "Open your experiment logs: observe how temperature variance alters gas pressure before we derive the formula."
                            },
                            {
                                "criterion": "Practical Demonstration",
                                "score_assigned": 28.0,
                                "weight": 30,
                                "justification": "Calorimeter setup was executed seamlessly with high student participation.",
                                "evidence_quote": "The data in your calorimeter is your proof — calculate the thermal transfer before we verify."
                            },
                            {
                                "criterion": "Classroom Management",
                                "score_assigned": 18.0,
                                "weight": 20,
                                "justification": "Crisp laboratory safety transitions and positive reinforcement.",
                                "evidence_quote": "Tables 1 through 4, secure your burner valves in three, two — excellent discipline today."
                            },
                            {
                                "criterion": "Formative Checks",
                                "score_assigned": 15.0,
                                "weight": 20,
                                "justification": "Exit ticket design was robust though two disengaged students needed direct follow-up.",
                                "evidence_quote": "Your exit ticket has one question: calculate entropy change as if presenting to the state board."
                            }
                        ],
                        "recommendations": [
                            {"area": "Differentiation", "action": "Incorporate adaptive multi-tier lab problem sets", "priority": "High"},
                            {"area": "Formative Assessment", "action": "Utilize digital polling for real-time concept check", "priority": "Medium"},
                            {"area": "Laboratory Extension", "action": "Introduce advanced PV simulation micro-modules", "priority": "Low"}
                        ]
                    }
                },
                {
                    "teacher_idx": 4, # Satvik Kshatriya
                    "assignment_idx": 0, # Water security
                    "status": "evaluated",
                    "score": 92.0,
                    "text": """
Lesson Design: Indira Gandhi Canal System & Water Security in Western Rajasthan (Class 9)
Pedagogy: Inquiry-driven exploration tracing canal headworks from Harike Barrage to Jaisalmer desert tail-ends.
Verbatim Evidence: 'Convince the classroom: why does a farmer in Barmer care about water management upstream at Pong Dam? Build your argument with regional crop statistics.'
Assessment: Formative exit ticket evaluating canal impact on regional agricultural economy.
                    """,
                    "evaluation": {
                        "overall_score": 92.0,
                        "feedback": "Masterful regional contextualization. The teacher effectively linked geographical concepts to live socio-economic reality across Rajasthan districts.",
                        "scores": [
                            {
                                "criterion": "Pedagogical Clarity",
                                "score_assigned": 24.0,
                                "weight": 25,
                                "justification": "Lesson objectives clearly signposted and revisited throughout.",
                                "evidence_quote": "By the end of this session, every student will defend why the canal represents life for 8 desert districts."
                            },
                            {
                                "criterion": "Student Engagement & Inquiry",
                                "score_assigned": 24.0,
                                "weight": 25,
                                "justification": "Roleplay debate between agricultural and industrial water allocation was highly vibrant.",
                                "evidence_quote": "Convince the classroom: why does a farmer in Barmer care about water management upstream at Pong Dam?"
                            },
                            {
                                "criterion": "Differentiation & Inclusion",
                                "score_assigned": 22.0,
                                "weight": 25,
                                "justification": "Visual map-based aids supported multilingual learners effectively.",
                                "evidence_quote": "Use the bilingual atlas overlay to trace canal distributaries before writing your case."
                            },
                            {
                                "criterion": "Assessment Literacy",
                                "score_assigned": 22.0,
                                "weight": 25,
                                "justification": "Formative exit ticket targeted higher-order thinking.",
                                "evidence_quote": "Your exit reflection requires evaluating water conservation policy against historical famine data."
                            }
                        ],
                        "recommendations": [
                            {"area": "Digital Geography", "action": "Integrate GIS satellite imagery into lesson design", "priority": "Medium"},
                            {"area": "Collaborative Tasks", "action": "Expand peer-review grading rubric for group debates", "priority": "Low"}
                        ]
                    }
                },
                {
                    "teacher_idx": 2, # Gaurika Kaushik
                    "assignment_idx": 2, # Hindi Literature
                    "status": "evaluated",
                    "score": 95.0,
                    "text": """
Lesson Plan: Rajasthani Heritage & Medieval Hindi Poetry (Class 10)
Structure: Comparative literary analysis connecting Meera Bai's devotional verses with regional cultural history.
Verbatim Evidence: 'Listen to the rhythm of the verse: how does the imagery of Mewar's landscape shape the poet's emotional expression? Defend your thesis with line citations.'
                    """,
                    "evaluation": {
                        "overall_score": 95.0,
                        "feedback": "Distinction-level pedagogical delivery with brilliant poetic scaffolding, deep cultural immersion, and flawless student assessment literacy.",
                        "scores": [
                            {
                                "criterion": "Linguistic Scaffolding",
                                "score_assigned": 34.0,
                                "weight": 35,
                                "justification": "Exemplary breakdown of medieval dialect terms and poetic meters.",
                                "evidence_quote": "Listen to the rhythm of the verse: how does the imagery of Mewar's landscape shape the poet's emotional expression?"
                            },
                            {
                                "criterion": "Critical Thinking Prompts",
                                "score_assigned": 33.0,
                                "weight": 35,
                                "justification": "Deep critical questioning connecting 16th century social context to contemporary literature.",
                                "evidence_quote": "Analyze how regional folklore preserves historical resistance through lyrical poetry."
                            },
                            {
                                "criterion": "Exit Assessment Loop",
                                "score_assigned": 28.0,
                                "weight": 30,
                                "justification": "Creative writing rubric provided detailed feedback on student essays.",
                                "evidence_quote": "Write your final stanza adhering strictly to traditional doha meter with personal commentary."
                            }
                        ],
                        "recommendations": [
                            {"area": "Masterclass Leadership", "action": "Nominated to deliver state-wide literature pedagogy webinar", "priority": "High"}
                        ]
                    }
                },
                {
                    "teacher_idx": 1, # Parth Shukla
                    "assignment_idx": 0, # Water security
                    "status": "processing",
                    "score": 0.0,
                    "text": "Lesson Plan Draft: Mathematical modeling of irrigation flow rates in canal networks. Submitted for preliminary AI rubric audit.",
                    "evaluation": None
                }
            ]

            for s_data in submissions_data:
                teacher = teacher_objs[s_data["teacher_idx"]]
                assignment = created_assignments[s_data["assignment_idx"]]
                
                # Check if submission exists
                sub_stmt = select(Submission).where(
                    Submission.teacher_id == teacher.id,
                    Submission.assignment_id == assignment.id
                )
                res = await db.execute(sub_stmt)
                sub = res.scalars().first()
                if not sub:
                    sub = Submission(
                        assignment_id=assignment.id,
                        teacher_id=teacher.id,
                        institution_id=inst.id,
                        s3_key=f"submissions/{teacher.id}/{assignment.id}.pdf",
                        file_mime="application/pdf",
                        status=s_data["status"],
                        extracted_text=s_data["text"].strip(),
                        score_json=s_data["evaluation"]
                    )
                    db.add(sub)
                    await db.flush()

                    if s_data["evaluation"]:
                        eval_obj = AIEvaluation(
                            submission_id=sub.id,
                            scores=s_data["evaluation"]["scores"],
                            overall_score=s_data["evaluation"]["overall_score"],
                            feedback=s_data["evaluation"]["feedback"],
                            recommendations=s_data["evaluation"]["recommendations"],
                            tokens_used=1840
                        )
                        db.add(eval_obj)
                    print(f"  [SUBMISSION] Created Submission & Evaluation for {teacher.email} ({s_data['status']})")

            await db.commit()
            print("[SUCCESS] All Rajasthan & Indian demo data seeded successfully!")
        except Exception as e:
            await db.rollback()
            print(f"[ERROR] Seeding error: {e}")
            raise


if __name__ == "__main__":
    asyncio.run(seed_data())
