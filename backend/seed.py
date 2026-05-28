import asyncio
from datetime import datetime, timedelta
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.core.database import AsyncSessionLocal
from app.models.institution import Institution
from app.models.user import User
from app.models.profile import Profile
from app.models.material import Material
from app.models.assignment import Assignment
from app.core.security import get_password_hash


async def seed_data():
    print("Seeding database with default interactive accounts...")
    async with AsyncSessionLocal() as db:
        try:
            # 1. Create or get Institution
            stmt = select(Institution).where(Institution.code == "OAK-123")
            res = await db.execute(stmt)
            inst = res.scalars().first()
            if not inst:
                inst = Institution(
                    name="Oakridge Academy",
                    code="OAK-123"
                )
                db.add(inst)
                await db.flush()
                print(f"Created Institution: {inst.name} (Code: {inst.code})")
            else:
                print(f"Institution {inst.name} already exists.")

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
                    print(f"Created {role} User: {email} / {password}")
                else:
                    print(f"User {email} already exists.")
                return user

            # 2. Seed SuperAdmin
            superadmin = await get_or_create_user(
                email="superadmin@edusupervision.com",
                password="SuperPassword123!",
                role="SuperAdmin",
                profile_data={"first_name": "Platform", "last_name": "SuperAdmin"}
            )

            # 3. Seed InstitutionAdmin
            admin = await get_or_create_user(
                email="admin@oakridge.edu",
                password="AdminPassword123!",
                role="InstitutionAdmin",
                profile_data={"first_name": "Institution", "last_name": "Administrator", "employee_id": "ADM-001"}
            )

            # 4. Seed Teacher
            teacher = await get_or_create_user(
                email="teacher@oakridge.edu",
                password="TeacherPassword123!",
                role="Teacher",
                profile_data={"first_name": "Jane", "last_name": "Doe", "employee_id": "EMP-101"}
            )

            # 5. Seed Training Material (Video)
            material_stmt = select(Material).where(Material.title == "Classroom Management Techniques")
            res = await db.execute(material_stmt)
            material = res.scalars().first()
            if not material:
                material = Material(
                    institution_id=inst.id,
                    title="Classroom Management Techniques",
                    description="Learn modern methods for maintaining classroom engagement and organization.",
                    type="video",
                    file_url="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                    uploader_id=admin.id
                )
                db.add(material)
                await db.flush()
                print(f"Created Video Material: {material.title}")
            else:
                print(f"Material '{material.title}' already exists.")

            # 6. Seed Assignment
            assign_stmt = select(Assignment).where(Assignment.title == "Reflective Essay on Classroom Management")
            res = await db.execute(assign_stmt)
            assignment = res.scalars().first()
            if not assignment:
                assignment = Assignment(
                    institution_id=inst.id,
                    title="Reflective Essay on Classroom Management",
                    description="Watch the Classroom Management video and write a 500-word reflection essay describing how you will implement engagement strategies.",
                    max_score=100,
                    due_date=datetime.utcnow() + timedelta(days=30),
                    rubric={
                        "criteria": [
                            {"name": "Clarity & Structure", "max_points": 40},
                            {"name": "Relevance & Application", "max_points": 40},
                            {"name": "Grammar & Formatting", "max_points": 20}
                        ]
                    },
                    creator_id=admin.id
                )
                db.add(assignment)
                await db.flush()
                print(f"Created Assignment: {assignment.title}")
            else:
                print(f"Assignment '{assignment.title}' already exists.")

            await db.commit()
            print("Database seeding completed successfully!")
        except Exception as e:
            await db.rollback()
            print(f"Seeding failed with exception: {e}")
            raise


if __name__ == "__main__":
    asyncio.run(seed_data())
