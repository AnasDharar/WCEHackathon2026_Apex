from __future__ import annotations

from calendar import monthrange
from copy import deepcopy
from datetime import datetime
from secrets import token_urlsafe
from threading import Lock
from typing import Any


def _clock_label(dt: datetime | None = None) -> str:
    dt = dt or datetime.now()
    return dt.strftime("%I:%M %p").lstrip("0")


def _today_clock_label(dt: datetime | None = None) -> str:
    return f"Today, {_clock_label(dt)}"


def _slot_to_date_time(slot: str) -> tuple[str, str]:
    if " - " not in slot:
        return slot, "TBD"
    date_part, time_part = slot.split(" - ", 1)
    return date_part.strip(), time_part.strip()


def _normalize_event_category(category: str | None) -> str | None:
    if category is None:
        return None

    normalized = category.strip().lower().replace("_", "-").replace(" ", "-")
    if not normalized:
        return None

    aliases = {
        "workshop": "workshop",
        "workshops": "workshop",
        "masterclass": "masterclass",
        "masterclasses": "masterclass",
        "community": "community-circle",
        "circle": "community-circle",
        "circles": "community-circle",
        "community-circle": "community-circle",
        "community-circles": "community-circle",
        "communitycircle": "community-circle",
        "communitycircles": "community-circle",
    }
    return aliases.get(normalized)


def _event_category_label(category: str) -> str:
    if category == "masterclass":
        return "Masterclasses"
    if category == "community-circle":
        return "Community Circles"
    return "Workshops"


def _infer_event_category(title: str) -> str:
    lowered = title.lower()
    if "masterclass" in lowered:
        return "masterclass"
    if "circle" in lowered:
        return "community-circle"
    return "workshop"


def _with_event_category(event: dict[str, Any]) -> dict[str, Any]:
    item = deepcopy(event)
    category = _normalize_event_category(str(item.get("category")) if item.get("category") is not None else None)
    if category is None:
        category = _infer_event_category(str(item.get("title", "")))
    category_label = _event_category_label(category)
    item["category"] = category
    item["category_label"] = category_label
    item["event_type"] = category
    item["eventType"] = category
    item["type"] = category_label
    return item


class InMemoryStore:
    def __init__(self) -> None:
        self._lock = Lock()

        self._profile: dict[str, Any] = {
            "id": "user-1",
            "name": "John Doe",
            "first_name": "John",
            "email": "john.doe@example.com",
            "onboarding_complete": False,
        }

        self._test_results: list[dict[str, Any]] = [
            {
                "id": 1,
                "title": "Weekly Stress Assessment",
                "score": "Low",
                "feedback": "Great progress! Your stress levels have decreased by 15% this week.",
                "date": "Feb 20, 2026",
            },
            {
                "id": 2,
                "title": "Sleep Quality Analysis",
                "score": "Good",
                "feedback": "Your sleep pattern is improving. Keep a consistent bedtime routine.",
                "date": "Feb 18, 2026",
            },
        ]

        self._today_habits: list[dict[str, Any]] = [
            {"id": 1, "name": "Drink 2L water", "schedule": "Daily", "done": True},
            {"id": 2, "name": "Walk 5,000 steps", "schedule": "Daily", "done": True},
            {"id": 3, "name": "Meditate for 10 minutes", "schedule": "Mon, Wed, Fri", "done": False},
            {"id": 4, "name": "Digital sunset at 10 PM", "schedule": "Daily", "done": False},
        ]

        self._habit_stats: list[dict[str, Any]] = [
            {"id": 1, "label": "Current Streak", "value": "11 Days", "note": "+2 from last week"},
            {"id": 2, "label": "Completion Rate", "value": "82%", "note": "23 of 28 habits done"},
            {"id": 3, "label": "Best Category", "value": "Hydration", "note": "7 day consistency"},
        ]

        self._weekly_progress: list[dict[str, Any]] = [
            {"day": "Sun", "done": True},
            {"day": "Mon", "done": True},
            {"day": "Tue", "done": False},
            {"day": "Wed", "done": True},
            {"day": "Thu", "done": True},
            {"day": "Fri", "done": False},
            {"day": "Sat", "done": True},
        ]

        self._habit_breakdown: list[dict[str, Any]] = [
            {"id": 1, "name": "Hydration", "progress": 92},
            {"id": 2, "name": "Movement", "progress": 78},
            {"id": 3, "name": "Mindfulness", "progress": 66},
            {"id": 4, "name": "Sleep Routine", "progress": 71},
        ]

        self._calendar_completed_days_feb_2026 = {
            1,
            2,
            4,
            5,
            6,
            8,
            9,
            10,
            12,
            14,
            15,
            17,
            18,
            19,
            20,
            21,
            22,
            24,
            25,
            26,
            27,
        }

        self._resources: list[dict[str, Any]] = [
            {
                "id": 1,
                "title": "NIMH Guide: Anxiety Disorders",
                "type": "Article",
                "duration": "9 min read",
                "level": "Beginner",
                "author": "National Institute of Mental Health",
                "source": "NIMH",
                "description": "Overview of anxiety symptoms, treatment options, and when to seek care.",
                "tags": ["anxiety", "stress", "education"],
                "recommended": True,
                "url": "https://www.nimh.nih.gov/health/topics/anxiety-disorders",
                "thumbnail_url": "https://picsum.photos/seed/nimh-anxiety/1200/675",
            },
            {
                "id": 2,
                "title": "NIMH Guide: Depression",
                "type": "Article",
                "duration": "8 min read",
                "level": "Beginner",
                "author": "National Institute of Mental Health",
                "source": "NIMH",
                "description": "A practical starter on depression signs, risk factors, and support paths.",
                "tags": ["depression", "mood", "support"],
                "recommended": True,
                "url": "https://www.nimh.nih.gov/health/topics/depression",
                "thumbnail_url": "https://picsum.photos/seed/nimh-depression/1200/675",
            },
            {
                "id": 3,
                "title": "CDC Mental Health Basics",
                "type": "Article",
                "duration": "7 min read",
                "level": "Beginner",
                "author": "Centers for Disease Control and Prevention",
                "source": "CDC",
                "description": "Evidence-based fundamentals of mental health and daily protective habits.",
                "tags": ["mental-health", "self-care", "habits"],
                "recommended": True,
                "url": "https://www.cdc.gov/mental-health/",
                "thumbnail_url": "https://picsum.photos/seed/cdc-mental-health/1200/675",
            },
            {
                "id": 4,
                "title": "WHO Mental Health Facts",
                "type": "Article",
                "duration": "6 min read",
                "level": "Beginner",
                "author": "World Health Organization",
                "source": "WHO",
                "description": "Global perspective on mental health trends, prevention, and care access.",
                "tags": ["mental-health", "awareness", "support"],
                "recommended": False,
                "url": "https://www.who.int/health-topics/mental-health",
                "thumbnail_url": "https://picsum.photos/seed/who-mental-health/1200/675",
            },
            {
                "id": 5,
                "title": "APA: Coping With Stress",
                "type": "Article",
                "duration": "5 min read",
                "level": "Beginner",
                "author": "American Psychological Association",
                "source": "APA",
                "description": "Simple stress-coping strategies for work, school, and personal challenges.",
                "tags": ["stress", "coping", "anxiety"],
                "recommended": True,
                "url": "https://www.apa.org/topics/stress",
                "thumbnail_url": "https://picsum.photos/seed/apa-stress/1200/675",
            },
            {
                "id": 6,
                "title": "Sleep Foundation Sleep Hygiene Guide",
                "type": "Article",
                "duration": "8 min read",
                "level": "Beginner",
                "author": "Sleep Foundation",
                "source": "Sleep Foundation",
                "description": "A practical sleep hygiene checklist to improve sleep quality and consistency.",
                "tags": ["sleep", "routine", "recovery"],
                "recommended": True,
                "url": "https://www.sleepfoundation.org/sleep-hygiene",
                "thumbnail_url": "https://picsum.photos/seed/sleep-hygiene/1200/675",
            },
            {
                "id": 7,
                "title": "HelpGuide Stress Management Techniques",
                "type": "Article",
                "duration": "10 min read",
                "level": "Intermediate",
                "author": "HelpGuide",
                "source": "HelpGuide",
                "description": "Detailed stress management techniques with actionable examples.",
                "tags": ["stress", "calm", "self-care"],
                "recommended": True,
                "url": "https://www.helpguide.org/mental-health/stress/stress-management",
                "thumbnail_url": "https://picsum.photos/seed/helpguide-stress/1200/675",
            },
            {
                "id": 8,
                "title": "Mindful.org Beginner Meditation Guide",
                "type": "Article",
                "duration": "6 min read",
                "level": "Beginner",
                "author": "Mindful.org",
                "source": "Mindful",
                "description": "How to start a mindfulness practice in under 10 minutes daily.",
                "tags": ["mindfulness", "meditation", "calm"],
                "recommended": True,
                "url": "https://www.mindful.org/meditation/mindfulness-getting-started/",
                "thumbnail_url": "https://picsum.photos/seed/mindful-meditation/1200/675",
            },
            {
                "id": 9,
                "title": "Psychology Today: Burnout Basics",
                "type": "Article",
                "duration": "6 min read",
                "level": "Beginner",
                "author": "Psychology Today",
                "source": "Psychology Today",
                "description": "Understand burnout signs and build a personal recovery plan.",
                "tags": ["burnout", "stress", "recovery"],
                "recommended": False,
                "url": "https://www.psychologytoday.com/us/basics/burnout",
                "thumbnail_url": "https://picsum.photos/seed/burnout-guide/1200/675",
            },
            {
                "id": 10,
                "title": "Mayo Clinic: Stress Symptoms and Causes",
                "type": "Article",
                "duration": "5 min read",
                "level": "Beginner",
                "author": "Mayo Clinic",
                "source": "Mayo Clinic",
                "description": "Clear overview of physical and emotional stress warning signs.",
                "tags": ["stress", "awareness", "health"],
                "recommended": False,
                "url": "https://www.mayoclinic.org/healthy-lifestyle/stress-management/in-depth/stress-symptoms/art-20050987",
                "thumbnail_url": "https://picsum.photos/seed/mayo-stress/1200/675",
            },
            {
                "id": 11,
                "title": "YouTube: Box Breathing Tutorial",
                "type": "Video",
                "duration": "5-8 min",
                "level": "Beginner",
                "author": "YouTube Creators",
                "source": "YouTube",
                "description": "Guided box breathing videos for immediate stress relief.",
                "tags": ["breathing", "anxiety", "calm"],
                "recommended": True,
                "url": "https://www.youtube.com/results?search_query=box+breathing+tutorial",
                "thumbnail_url": "https://picsum.photos/seed/youtube-box-breathing/1200/675",
            },
            {
                "id": 12,
                "title": "YouTube: 10 Minute Guided Meditation",
                "type": "Video",
                "duration": "10 min",
                "level": "Beginner",
                "author": "YouTube Creators",
                "source": "YouTube",
                "description": "Short daily guided meditation sessions for focus and calm.",
                "tags": ["meditation", "mindfulness", "focus"],
                "recommended": True,
                "url": "https://www.youtube.com/results?search_query=10+minute+guided+meditation",
                "thumbnail_url": "https://picsum.photos/seed/youtube-guided-meditation/1200/675",
            },
            {
                "id": 13,
                "title": "YouTube: Progressive Muscle Relaxation",
                "type": "Video",
                "duration": "10-15 min",
                "level": "Beginner",
                "author": "YouTube Creators",
                "source": "YouTube",
                "description": "Body-based relaxation routines to reduce mental and physical tension.",
                "tags": ["relaxation", "stress", "sleep"],
                "recommended": True,
                "url": "https://www.youtube.com/results?search_query=progressive+muscle+relaxation",
                "thumbnail_url": "https://picsum.photos/seed/youtube-pmr/1200/675",
            },
            {
                "id": 14,
                "title": "YouTube: Sleep Meditation for Beginners",
                "type": "Video",
                "duration": "20 min",
                "level": "Beginner",
                "author": "YouTube Creators",
                "source": "YouTube",
                "description": "Long-form wind-down meditation videos designed for bedtime.",
                "tags": ["sleep", "meditation", "calm"],
                "recommended": True,
                "url": "https://www.youtube.com/results?search_query=sleep+meditation+for+beginners",
                "thumbnail_url": "https://picsum.photos/seed/youtube-sleep-meditation/1200/675",
            },
            {
                "id": 15,
                "title": "YouTube: Study Focus Lo-fi Sessions",
                "type": "Audio",
                "duration": "30+ min",
                "level": "All Levels",
                "author": "YouTube Creators",
                "source": "YouTube",
                "description": "Background focus audio to reduce distraction during study blocks.",
                "tags": ["focus", "study", "productivity"],
                "recommended": False,
                "url": "https://www.youtube.com/results?search_query=study+focus+lofi",
                "thumbnail_url": "https://picsum.photos/seed/youtube-study-focus/1200/675",
            },
            {
                "id": 16,
                "title": "YouTube: Gentle Morning Stretch Routine",
                "type": "Video",
                "duration": "10 min",
                "level": "Beginner",
                "author": "YouTube Creators",
                "source": "YouTube",
                "description": "Light movement to improve mood regulation and daily energy.",
                "tags": ["movement", "self-care", "routine"],
                "recommended": False,
                "url": "https://www.youtube.com/results?search_query=gentle+morning+stretch+routine",
                "thumbnail_url": "https://picsum.photos/seed/youtube-stretch/1200/675",
            },
            {
                "id": 17,
                "title": "Spotify: Anxiety Relief Podcast Search",
                "type": "Podcast",
                "duration": "20-40 min",
                "level": "All Levels",
                "author": "Spotify Creators",
                "source": "Spotify",
                "description": "Podcast episodes focused on anxiety coping and emotional resilience.",
                "tags": ["anxiety", "podcast", "support"],
                "recommended": True,
                "url": "https://open.spotify.com/search/anxiety%20relief%20podcast",
                "thumbnail_url": "https://picsum.photos/seed/spotify-anxiety-podcast/1200/675",
            },
            {
                "id": 18,
                "title": "Spotify: Sleep Stories Search",
                "type": "Audio",
                "duration": "15-45 min",
                "level": "All Levels",
                "author": "Spotify Creators",
                "source": "Spotify",
                "description": "Sleep stories and calming audio tracks for nighttime wind-down.",
                "tags": ["sleep", "audio", "relaxation"],
                "recommended": True,
                "url": "https://open.spotify.com/search/sleep%20stories",
                "thumbnail_url": "https://picsum.photos/seed/spotify-sleep-stories/1200/675",
            },
            {
                "id": 19,
                "title": "Apple Podcasts: Mindfulness Collection",
                "type": "Podcast",
                "duration": "10-30 min",
                "level": "All Levels",
                "author": "Apple Podcasts Creators",
                "source": "Apple Podcasts",
                "description": "Discover mindfulness shows that cover meditation and emotional balance.",
                "tags": ["mindfulness", "podcast", "meditation"],
                "recommended": False,
                "url": "https://podcasts.apple.com/us/genre/podcasts-health-fitness/id1512",
                "thumbnail_url": "https://picsum.photos/seed/apple-mindfulness-podcast/1200/675",
            },
            {
                "id": 20,
                "title": "Apple Podcasts: Better Sleep Collection",
                "type": "Podcast",
                "duration": "15-40 min",
                "level": "All Levels",
                "author": "Apple Podcasts Creators",
                "source": "Apple Podcasts",
                "description": "Audio series for sleep routines, insomnia tips, and night calming.",
                "tags": ["sleep", "podcast", "recovery"],
                "recommended": False,
                "url": "https://podcasts.apple.com/us/genre/podcasts-health-fitness/id1512",
                "thumbnail_url": "https://picsum.photos/seed/apple-sleep-podcast/1200/675",
            },
            {
                "id": 21,
                "title": "Insight Timer: Free Meditation Library",
                "type": "Toolkit",
                "duration": "Flexible",
                "level": "All Levels",
                "author": "Insight Timer",
                "source": "Insight Timer",
                "description": "Large collection of free guided meditations and breathing practices.",
                "tags": ["meditation", "mindfulness", "toolkit"],
                "recommended": True,
                "url": "https://insighttimer.com/",
                "thumbnail_url": "https://picsum.photos/seed/insight-timer/1200/675",
            },
            {
                "id": 22,
                "title": "UCLA Mindful: Guided Meditations",
                "type": "Audio",
                "duration": "3-19 min",
                "level": "Beginner",
                "author": "UCLA Health",
                "source": "UCLA",
                "description": "Clinical mindfulness center audio tracks for grounding and relaxation.",
                "tags": ["mindfulness", "audio", "calm"],
                "recommended": True,
                "url": "https://www.uclahealth.org/programs/marc/free-guided-meditations",
                "thumbnail_url": "https://picsum.photos/seed/ucla-mindful/1200/675",
            },
            {
                "id": 23,
                "title": "NHS Mental Health Self-help Hub",
                "type": "Article",
                "duration": "10 min read",
                "level": "Beginner",
                "author": "NHS",
                "source": "NHS",
                "description": "Trusted self-help guides for anxiety, low mood, and emotional wellbeing.",
                "tags": ["self-care", "support", "mental-health"],
                "recommended": True,
                "url": "https://www.nhs.uk/mental-health/",
                "thumbnail_url": "https://picsum.photos/seed/nhs-mental-health/1200/675",
            },
            {
                "id": 24,
                "title": "Verywell Mind Mental Health Library",
                "type": "Article",
                "duration": "Flexible",
                "level": "Beginner",
                "author": "Verywell Mind",
                "source": "Verywell Mind",
                "description": "Easy-to-read explainers on stress, habits, and coping strategies.",
                "tags": ["mental-health", "education", "self-care"],
                "recommended": False,
                "url": "https://www.verywellmind.com/",
                "thumbnail_url": "https://picsum.photos/seed/verywell-mind/1200/675",
            },
            {
                "id": 25,
                "title": "Coursera: Positive Psychology Courses",
                "type": "Course",
                "duration": "2-6 weeks",
                "level": "Intermediate",
                "author": "Coursera Instructors",
                "source": "Coursera",
                "description": "Structured learning on resilience, optimism, and wellbeing science.",
                "tags": ["course", "self-growth", "mindset"],
                "recommended": False,
                "url": "https://www.coursera.org/search?query=positive%20psychology",
                "thumbnail_url": "https://picsum.photos/seed/coursera-positive-psychology/1200/675",
            },
            {
                "id": 26,
                "title": "edX: Mental Health and Wellness Courses",
                "type": "Course",
                "duration": "2-8 weeks",
                "level": "Intermediate",
                "author": "edX Instructors",
                "source": "edX",
                "description": "Academic-style wellness courses to deepen mental health literacy.",
                "tags": ["course", "mental-health", "education"],
                "recommended": False,
                "url": "https://www.edx.org/search?q=mental%20health",
                "thumbnail_url": "https://picsum.photos/seed/edx-mental-health/1200/675",
            },
            {
                "id": 27,
                "title": "Khan Academy: Growth Mindset Lessons",
                "type": "Course",
                "duration": "30-90 min",
                "level": "Beginner",
                "author": "Khan Academy",
                "source": "Khan Academy",
                "description": "Short lessons on mindset and learning resilience for students.",
                "tags": ["mindset", "productivity", "study"],
                "recommended": False,
                "url": "https://www.khanacademy.org/search?page_search_query=growth%20mindset",
                "thumbnail_url": "https://picsum.photos/seed/khan-growth-mindset/1200/675",
            },
            {
                "id": 28,
                "title": "Google Wellbeing Digital Wellness Hub",
                "type": "Toolkit",
                "duration": "Flexible",
                "level": "All Levels",
                "author": "Google Wellbeing",
                "source": "Google",
                "description": "Tools and guidance for healthier screen habits and attention management.",
                "tags": ["digital-wellbeing", "focus", "habits"],
                "recommended": False,
                "url": "https://wellbeing.google/",
                "thumbnail_url": "https://picsum.photos/seed/google-wellbeing/1200/675",
            },
            {
                "id": 29,
                "title": "Notion Personal Habit Templates",
                "type": "Toolkit",
                "duration": "Flexible",
                "level": "Beginner",
                "author": "Notion Creators",
                "source": "Notion",
                "description": "Ready-made templates for habit tracking, reflection, and routines.",
                "tags": ["habits", "toolkit", "routine"],
                "recommended": False,
                "url": "https://www.notion.so/templates/category/personal",
                "thumbnail_url": "https://picsum.photos/seed/notion-habits/1200/675",
            },
            {
                "id": 30,
                "title": "Trello Personal Wellbeing Boards",
                "type": "Toolkit",
                "duration": "Flexible",
                "level": "Beginner",
                "author": "Trello Community",
                "source": "Trello",
                "description": "Kanban-style wellness planning boards for simple daily execution.",
                "tags": ["productivity", "self-care", "planning"],
                "recommended": False,
                "url": "https://trello.com/templates/personal",
                "thumbnail_url": "https://picsum.photos/seed/trello-wellbeing/1200/675",
            },
            {
                "id": 31,
                "title": "Headspace: Stress and Anxiety Meditations",
                "type": "Audio",
                "duration": "3-20 min",
                "level": "Beginner",
                "author": "Headspace",
                "source": "Headspace",
                "description": "Guided sessions designed for stress reset and calmer thinking.",
                "tags": ["anxiety", "meditation", "calm"],
                "recommended": True,
                "url": "https://www.headspace.com/meditation/stress",
                "thumbnail_url": "https://picsum.photos/seed/headspace-stress/1200/675",
            },
            {
                "id": 32,
                "title": "Calm Blog: Sleep and Relaxation Tips",
                "type": "Article",
                "duration": "5 min read",
                "level": "Beginner",
                "author": "Calm",
                "source": "Calm",
                "description": "Simple sleep and relaxation tips you can apply tonight.",
                "tags": ["sleep", "relaxation", "self-care"],
                "recommended": True,
                "url": "https://www.calm.com/blog",
                "thumbnail_url": "https://picsum.photos/seed/calm-blog-sleep/1200/675",
            },
            {
                "id": 33,
                "title": "Breathwrk Breathing Exercise App",
                "type": "Toolkit",
                "duration": "2-10 min",
                "level": "Beginner",
                "author": "Breathwrk",
                "source": "Breathwrk",
                "description": "Guided breathing protocols for energy, stress, and sleep.",
                "tags": ["breathing", "anxiety", "focus"],
                "recommended": True,
                "url": "https://www.breathwrk.com/",
                "thumbnail_url": "https://picsum.photos/seed/breathwrk-app/1200/675",
            },
            {
                "id": 34,
                "title": "Pomofocus Deep Work Timer",
                "type": "Toolkit",
                "duration": "25 min blocks",
                "level": "Beginner",
                "author": "Pomofocus",
                "source": "Pomofocus",
                "description": "Simple pomodoro timer to rebuild focus and reduce procrastination.",
                "tags": ["focus", "productivity", "habits"],
                "recommended": True,
                "url": "https://pomofocus.io/",
                "thumbnail_url": "https://picsum.photos/seed/pomofocus/1200/675",
            },
            {
                "id": 35,
                "title": "988 Lifeline: Help and Self-support",
                "type": "Support",
                "duration": "Immediate",
                "level": "All Levels",
                "author": "988 Lifeline",
                "source": "988 Lifeline",
                "description": "Immediate support resources and self-help guidance during crisis moments.",
                "tags": ["support", "crisis", "safety"],
                "recommended": True,
                "url": "https://988lifeline.org/help-yourself/",
                "thumbnail_url": "https://picsum.photos/seed/988-support/1200/675",
            },
            {
                "id": 36,
                "title": "SAMHSA National Helpline Resources",
                "type": "Support",
                "duration": "Immediate",
                "level": "All Levels",
                "author": "SAMHSA",
                "source": "SAMHSA",
                "description": "Substance use and mental health treatment referral information.",
                "tags": ["support", "helpline", "mental-health"],
                "recommended": True,
                "url": "https://www.samhsa.gov/find-help/national-helpline",
                "thumbnail_url": "https://picsum.photos/seed/samhsa-helpline/1200/675",
            },
        ]

        self._resource_categories: list[dict[str, Any]] = [
            {"id": 1, "name": "Stress & Anxiety", "count": 0, "tone": "bg-emerald-100 text-emerald-700"},
            {"id": 2, "name": "Sleep", "count": 0, "tone": "bg-sky-100 text-sky-700"},
            {"id": 3, "name": "Mindfulness", "count": 0, "tone": "bg-violet-100 text-violet-700"},
            {"id": 4, "name": "Self Care", "count": 0, "tone": "bg-amber-100 text-amber-700"},
        ]

        self._resource_collections: list[dict[str, Any]] = [
            {"id": 1, "name": "Exam Week Calm Kit", "items": 12},
            {"id": 2, "name": "Better Sleep Plan", "items": 10},
            {"id": 3, "name": "Daily Focus + Mindfulness", "items": 14},
        ]

        self._counselors: list[dict[str, Any]] = [
            {
                "id": 1,
                "name": "Dr. Sarah Wilson",
                "specialty": "Clinical Psychologist",
                "years_experience": 10,
                "languages": ["English", "Hindi"],
                "rating": 4.9,
            },
            {
                "id": 2,
                "name": "Mr. Rajesh Kumar",
                "specialty": "Student Counselor",
                "years_experience": 5,
                "languages": ["Hindi", "Marathi", "English"],
                "rating": 4.8,
            },
            {
                "id": 3,
                "name": "Ms. Priya Desai",
                "specialty": "Wellness Coach",
                "years_experience": 7,
                "languages": ["English", "Gujarati"],
                "rating": 4.7,
            },
        ]

        self._appointments: list[dict[str, Any]] = [
            {
                "id": 1,
                "counselor_id": 1,
                "patient_name": "John Doe",
                "doctor": "Dr. Sarah Wilson",
                "specialty": "Clinical Psychologist",
                "date": "Feb 25, 2026",
                "time": "10:00 AM",
                "mode": "Online",
                "location": "Online",
                "status": "Confirmed",
                "meet_link": "https://meet.google.com/abc-defg-hij",
                "notes": None,
            },
            {
                "id": 2,
                "counselor_id": 2,
                "patient_name": "John Doe",
                "doctor": "Mr. Rajesh Kumar",
                "specialty": "Student Counselor",
                "date": "Feb 28, 2026",
                "time": "2:30 PM",
                "mode": "Online",
                "location": "Online",
                "status": "Confirmed",
                "meet_link": "https://meet.google.com/xyz-uvwx-yz",
                "notes": None,
            },
            {
                "id": 3,
                "counselor_id": 3,
                "patient_name": "John Doe",
                "doctor": "Ms. Priya Desai",
                "specialty": "Wellness Coach",
                "date": "Mar 3, 2026",
                "time": "11:15 AM",
                "mode": "In-person",
                "location": "Counselor Office",
                "status": "Pending",
                "meet_link": None,
                "notes": None,
            },
        ]

        self._appointment_stats: list[dict[str, Any]] = [
            {"id": 1, "label": "Upcoming This Week", "value": "3"},
            {"id": 2, "label": "Sessions Completed", "value": "12"},
            {"id": 3, "label": "Avg Session Rating", "value": "4.8/5"},
        ]

        self._available_slots: list[str] = [
            "Mon, Feb 23 - 9:30 AM",
            "Mon, Feb 23 - 4:00 PM",
            "Tue, Feb 24 - 11:00 AM",
            "Wed, Feb 25 - 6:15 PM",
        ]

        self._prep_checklist: list[str] = [
            "Complete your mood check-in before each session",
            "Note 2 priorities to discuss with your specialist",
            "Keep a water bottle and a quiet place ready",
            "Join 5 minutes early to avoid delays",
        ]

        self._featured_event: dict[str, Any] = {
            "title": "Mental Fitness Bootcamp",
            "date": "March 5, 2026",
            "time": "6:30 PM",
            "mode": "Live Online",
            "description": (
                "A practical 90-minute session with guided exercises for stress regulation, "
                "emotional resilience, and better routines."
            ),
        }

        self._upcoming_events: list[dict[str, Any]] = [
            {
                "id": 1,
                "title": "Mindful Monday Workshop",
                "date": "Feb 23, 2026",
                "time": "6:00 PM",
                "host": "Dr. Priya Menon",
                "attendees": 84,
                "mode": "Online",
                "capacity": 120,
                "category": "workshop",
            },
            {
                "id": 2,
                "title": "Sleep Reset Masterclass",
                "date": "Feb 27, 2026",
                "time": "7:30 PM",
                "host": "Dr. Sarah Wilson",
                "attendees": 59,
                "mode": "Online",
                "capacity": 80,
                "category": "masterclass",
            },
            {
                "id": 3,
                "title": "Wellness Circle: Student Burnout",
                "date": "Mar 2, 2026",
                "time": "5:00 PM",
                "host": "Community Team",
                "attendees": 112,
                "mode": "Hybrid",
                "capacity": 150,
                "category": "community-circle",
            },
        ]

        self._weekly_lineup: list[dict[str, Any]] = [
            {"id": 1, "day": "Monday", "topic": "Focus and Productivity", "time": "6:00 PM"},
            {"id": 2, "day": "Wednesday", "topic": "Breathwork and Calm", "time": "7:00 PM"},
            {"id": 3, "day": "Friday", "topic": "Better Sleep Habits", "time": "8:00 PM"},
            {"id": 4, "day": "Sunday", "topic": "Reflection and Planning", "time": "5:30 PM"},
        ]

        self._community_stats: list[dict[str, Any]] = [
            {"id": 1, "label": "Active Members", "value": "2,438"},
            {"id": 2, "label": "Support Groups", "value": "34"},
            {"id": 3, "label": "Posts This Week", "value": "189"},
        ]

        self._community_posts: list[dict[str, Any]] = [
            {
                "id": 1,
                "author": "Ananya R.",
                "role": "Student",
                "time": "2h ago",
                "content": (
                    "Tried the 4-4-6 breathing routine before class today. "
                    "It really helped me settle down and focus."
                ),
                "likes": 42,
                "comments": 9,
            },
            {
                "id": 2,
                "author": "Rohan S.",
                "role": "Working Professional",
                "time": "5h ago",
                "content": (
                    "If anyone is struggling with sleep, reducing screen brightness after 9 PM "
                    "made a big difference for me."
                ),
                "likes": 31,
                "comments": 14,
            },
            {
                "id": 3,
                "author": "Dr. Nidhi Kapoor",
                "role": "Community Mentor",
                "time": "1d ago",
                "content": (
                    "Reminder: emotional regulation gets easier with repetition. "
                    "Start with tiny routines and keep them realistic."
                ),
                "likes": 67,
                "comments": 21,
            },
        ]

        self._support_groups: list[dict[str, Any]] = [
            {"id": 1, "name": "Exam Stress Circle", "members": 286, "next": "Today, 8:00 PM"},
            {"id": 2, "name": "Sleep Better Club", "members": 194, "next": "Mon, 9:00 PM"},
            {"id": 3, "name": "Young Professionals Support", "members": 321, "next": "Wed, 7:30 PM"},
        ]

        self._mentors: list[dict[str, Any]] = [
            {"id": 1, "name": "Dr. Sarah Wilson", "specialty": "Emotional Wellness"},
            {"id": 2, "name": "Dr. James Chen", "specialty": "Habit Coaching"},
            {"id": 3, "name": "Priya Menon", "specialty": "Mindfulness"},
        ]

        self._chat_quick_prompts: list[str] = [
            "Create a 5-minute calm routine",
            "Help me reframe negative thoughts",
            "Build a better bedtime plan",
            "Suggest stress-relief activities",
        ]

        self._chat_insights: list[dict[str, Any]] = [
            {"id": 1, "label": "Mood trend", "value": "Stable", "tone": "text-emerald-700 bg-emerald-100"},
            {"id": 2, "label": "Stress level", "value": "Moderate", "tone": "text-amber-700 bg-amber-100"},
            {"id": 3, "label": "Sleep quality", "value": "Improving", "tone": "text-sky-700 bg-sky-100"},
        ]

        self._chat_conversations: list[dict[str, Any]] = [
            {"id": 1, "title": "Sleep routine check-in", "time": "Today, 9:20 AM", "status": "Active"},
            {"id": 2, "title": "Pre-exam anxiety support", "time": "Yesterday, 8:10 PM", "status": "Resolved"},
            {"id": 3, "title": "Mood tracking summary", "time": "Feb 20, 2026", "status": "Resolved"},
        ]

        self._chat_messages: dict[int, list[dict[str, Any]]] = {
            1: [
                {
                    "id": 1,
                    "conversation_id": 1,
                    "role": "assistant",
                    "text": "Hi there, welcome back. Would you like a quick check-in on stress and sleep today?",
                    "time": "9:18 AM",
                },
                {
                    "id": 2,
                    "conversation_id": 1,
                    "role": "user",
                    "text": "Yes, I felt overloaded this morning and could not focus well.",
                    "time": "9:19 AM",
                },
                {
                    "id": 3,
                    "conversation_id": 1,
                    "role": "assistant",
                    "text": "Thanks for sharing. Start with 4-4-6 breathing for three rounds, then pick one 15-minute task.",
                    "time": "9:19 AM",
                },
                {
                    "id": 4,
                    "conversation_id": 1,
                    "role": "assistant",
                    "text": "Want me to suggest one short focus task based on your routine?",
                    "time": "9:20 AM",
                },
            ],
            2: [],
            3: [],
        }

        self._next_post_id = 4
        self._next_conversation_id = 4
        self._next_message_id = 5
        self._next_appointment_id = 4
        self._next_test_result_id = 3

        # Auth/session + assessment persistence (in-memory for demo backend)
        default_user = {
            "id": "user-1",
            "name": "John Doe",
            "first_name": "John",
            "email": "john.doe@example.com",
            "password": "password123",
            "onboarding_complete": False,
        }
        self._users_by_id: dict[str, dict[str, Any]] = {default_user["id"]: default_user}
        self._users_by_email: dict[str, dict[str, Any]] = {default_user["email"]: default_user}
        self._active_tokens: dict[str, str] = {}
        self._assessment_history_by_user: dict[str, list[dict[str, Any]]] = {"user-1": []}
        self._test_results_by_user: dict[str, list[dict[str, Any]]] = {"user-1": deepcopy(self._test_results)}

    def _refresh_habit_stats_locked(self) -> None:
        done_count = sum(1 for habit in self._today_habits if habit["done"])
        total = len(self._today_habits)
        completion_pct = int((done_count / total) * 100) if total else 0
        self._habit_stats[1]["value"] = f"{completion_pct}%"
        self._habit_stats[1]["note"] = f"{done_count} of {total} habits done today"

    def _find_appointment_index(self, appointment_id: int) -> int:
        for idx, appointment in enumerate(self._appointments):
            if appointment["id"] == appointment_id:
                return idx
        raise KeyError(f"Appointment {appointment_id} not found")

    def _find_counselor(self, counselor_id: int) -> dict[str, Any]:
        for counselor in self._counselors:
            if counselor["id"] == counselor_id:
                return counselor
        raise KeyError(f"Counselor {counselor_id} not found")

    def _find_post_index(self, post_id: int) -> int:
        for idx, post in enumerate(self._community_posts):
            if post["id"] == post_id:
                return idx
        raise KeyError(f"Post {post_id} not found")

    def _find_event_index(self, event_id: int) -> int:
        for idx, event in enumerate(self._upcoming_events):
            if event["id"] == event_id:
                return idx
        raise KeyError(f"Event {event_id} not found")

    def _find_conversation_index(self, conversation_id: int) -> int:
        for idx, conversation in enumerate(self._chat_conversations):
            if conversation["id"] == conversation_id:
                return idx
        raise KeyError(f"Conversation {conversation_id} not found")

    def _public_user(self, user: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": user["id"],
            "name": user["name"],
            "first_name": user["first_name"],
            "email": user["email"],
            "onboarding_complete": bool(user.get("onboarding_complete", False)),
        }

    def _first_name_from_email(self, email: str) -> str:
        local_part = email.split("@", 1)[0]
        cleaned = local_part.replace(".", " ").replace("_", " ").replace("-", " ").strip()
        if not cleaned:
            return "User"
        return cleaned.split(" ")[0].capitalize()

    def _full_name_from_email(self, email: str) -> str:
        local_part = email.split("@", 1)[0]
        cleaned = local_part.replace(".", " ").replace("_", " ").replace("-", " ").strip()
        if not cleaned:
            return "User"
        return " ".join(piece.capitalize() for piece in cleaned.split())

    def _first_name_from_name(self, name: str) -> str:
        cleaned = " ".join(name.strip().split())
        if not cleaned:
            return "User"
        return cleaned.split(" ")[0]

    def _set_active_profile_locked(self, user: dict[str, Any]) -> None:
        self._profile = self._public_user(user)

    def sync_external_identity(
        self,
        user_id: str | None,
        name: str | None,
        first_name: str | None,
        email: str | None,
    ) -> dict[str, Any] | None:
        normalized_user_id = (user_id or "").strip()
        normalized_email = (email or "").strip().lower()
        normalized_name = " ".join((name or "").split()).strip()
        normalized_first_name = " ".join((first_name or "").split()).strip()

        if not any((normalized_user_id, normalized_email, normalized_name, normalized_first_name)):
            return None

        with self._lock:
            user: dict[str, Any] | None = None
            if normalized_user_id:
                user = self._users_by_id.get(normalized_user_id)
            if user is None and normalized_email:
                user = self._users_by_email.get(normalized_email)

            if user is None:
                resolved_user_id = normalized_user_id or f"user-{len(self._users_by_id) + 1}"
                resolved_name = normalized_name or (
                    self._full_name_from_email(normalized_email) if normalized_email else "User"
                )
                resolved_first_name = normalized_first_name or self._first_name_from_name(resolved_name)
                user = {
                    "id": resolved_user_id,
                    "name": resolved_name,
                    "first_name": resolved_first_name,
                    "email": normalized_email or f"{resolved_user_id}@local.user",
                    "password": "",
                    "onboarding_complete": False,
                }
            else:
                previous_email = str(user.get("email", "")).strip().lower()

                resolved_name = normalized_name or str(user.get("name", "")).strip()
                if not resolved_name:
                    resolved_name = self._full_name_from_email(normalized_email) if normalized_email else "User"

                resolved_first_name = normalized_first_name or str(user.get("first_name", "")).strip()
                if not resolved_first_name:
                    resolved_first_name = self._first_name_from_name(resolved_name)

                resolved_email = normalized_email or previous_email
                if not resolved_email:
                    resolved_email = f"{user['id']}@local.user"

                user["name"] = resolved_name
                user["first_name"] = resolved_first_name
                user["email"] = resolved_email
                user["onboarding_complete"] = bool(user.get("onboarding_complete", False))

                if previous_email and previous_email != resolved_email:
                    self._users_by_email.pop(previous_email, None)

            self._users_by_id[user["id"]] = user
            self._users_by_email[str(user["email"]).strip().lower()] = user
            self._assessment_history_by_user.setdefault(user["id"], [])
            self._test_results_by_user.setdefault(user["id"], deepcopy(self._test_results))
            self._set_active_profile_locked(user)
            return self._public_user(user)

    def authenticate_user(self, email: str, password: str) -> tuple[str, dict[str, Any], str]:
        normalized_email = email.strip().lower()
        normalized_password = password.strip()

        if not normalized_email or not normalized_password:
            raise ValueError("Email and password are required.")

        with self._lock:
            user = self._users_by_email.get(normalized_email)
            if user:
                if user["password"] != normalized_password:
                    raise ValueError("Invalid email or password.")
            else:
                user_id = f"user-{len(self._users_by_id) + 1}"
                user = {
                    "id": user_id,
                    "name": self._full_name_from_email(normalized_email),
                    "first_name": self._first_name_from_email(normalized_email),
                    "email": normalized_email,
                    "password": normalized_password,
                    "onboarding_complete": False,
                }
                self._users_by_id[user_id] = user
                self._users_by_email[normalized_email] = user
                self._assessment_history_by_user[user_id] = []
                self._test_results_by_user[user_id] = []

            token = token_urlsafe(24)
            self._active_tokens[token] = user["id"]
            self._set_active_profile_locked(user)
            next_step = "dashboard" if user.get("onboarding_complete") else "assessment"
            return token, self._public_user(user), next_step

    def get_user_by_token(self, token: str) -> dict[str, Any] | None:
        normalized_token = token.strip()
        if not normalized_token:
            return None

        with self._lock:
            user_id = self._active_tokens.get(normalized_token)
            if not user_id:
                return None
            user = self._users_by_id.get(user_id)
            if not user:
                return None
            self._set_active_profile_locked(user)
            return self._public_user(user)

    def invalidate_token(self, token: str) -> None:
        with self._lock:
            self._active_tokens.pop(token.strip(), None)

    def get_assessment_status(self, user_id: str) -> dict[str, Any]:
        user = self._users_by_id.get(user_id)
        if not user:
            raise KeyError(f"User {user_id} not found")
        history = self._assessment_history_by_user.get(user_id, [])
        return {
            "needs_assessment": not bool(user.get("onboarding_complete")),
            "onboarding_complete": bool(user.get("onboarding_complete")),
            "total_submissions": len(history),
            "last_submitted_at": history[0]["submitted_at"] if history else None,
        }

    def get_assessment_history(self, user_id: str) -> list[dict[str, Any]]:
        return deepcopy(self._assessment_history_by_user.get(user_id, []))

    def save_assessment_submission(self, user_id: str, submission: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            user = self._users_by_id.get(user_id)
            if not user:
                raise KeyError(f"User {user_id} not found")

            history = self._assessment_history_by_user.setdefault(user_id, [])
            submission_record = deepcopy(submission)
            submission_record["id"] = len(history) + 1
            history.insert(0, submission_record)

            user["onboarding_complete"] = True
            if self._profile.get("id") == user_id:
                self._profile["onboarding_complete"] = True

            cards = self._test_results_by_user.setdefault(user_id, [])
            for item in submission_record.get("questionnaire_results", []):
                cards.insert(
                    0,
                    {
                        "id": self._next_test_result_id,
                        "title": item.get("title", "Assessment"),
                        "score": f"{item.get('severity', 'N/A')} ({item.get('total_score', 0)})",
                        "feedback": item.get("interpretation", ""),
                        "date": submission_record.get("submitted_at_display", datetime.now().strftime("%b %d, %Y")),
                    },
                )
                self._next_test_result_id += 1

            self._test_results_by_user[user_id] = cards[:20]
            return deepcopy(submission_record)

    def get_profile(self) -> dict[str, Any]:
        return deepcopy(self._profile)

    def get_dashboard_overview(self) -> dict[str, Any]:
        active_user_id = str(self._profile.get("id", "user-1"))
        test_results = self._test_results_by_user.get(active_user_id, self._test_results)
        return {
            "welcome_name": self._profile["first_name"],
            "test_results": deepcopy(test_results),
            "live_appointments": deepcopy(self._appointments[:2]),
            "today_habits": deepcopy(self._today_habits),
            "habit_calendar": self.get_habit_calendar(year=2026, month=2)["days"],
            "resource_highlights": deepcopy(self._resources[:4]),
        }

    def list_habit_stats(self) -> list[dict[str, Any]]:
        return deepcopy(self._habit_stats)

    def list_today_habits(self) -> list[dict[str, Any]]:
        return deepcopy(self._today_habits)

    def update_habit(self, habit_id: int, done: bool) -> dict[str, Any]:
        with self._lock:
            for habit in self._today_habits:
                if habit["id"] == habit_id:
                    habit["done"] = done
                    self._refresh_habit_stats_locked()
                    return deepcopy(habit)
        raise KeyError(f"Habit {habit_id} not found")

    def list_weekly_progress(self) -> list[dict[str, Any]]:
        return deepcopy(self._weekly_progress)

    def list_habit_breakdown(self) -> list[dict[str, Any]]:
        return deepcopy(self._habit_breakdown)

    def _is_completed_day(self, year: int, month: int, day: int) -> bool:
        if year == 2026 and month == 2:
            return day in self._calendar_completed_days_feb_2026
        return (day + month) % 2 == 0

    def get_habit_calendar(self, year: int, month: int) -> dict[str, Any]:
        first_day_weekday = datetime(year, month, 1).weekday()  # Monday=0
        first_day = (first_day_weekday + 1) % 7  # convert to Sunday=0
        days_in_month = monthrange(year, month)[1]

        days: list[dict[str, Any]] = []
        for _ in range(first_day):
            days.append({"day": None, "completed": False})
        for day in range(1, days_in_month + 1):
            days.append({"day": day, "completed": self._is_completed_day(year, month, day)})

        return {"year": year, "month": month, "days": days}

    def list_resource_categories(self) -> list[dict[str, Any]]:
        category_keywords = {
            "Stress & Anxiety": {"stress", "anxiety", "burnout", "breathing", "calm", "panic"},
            "Sleep": {"sleep", "insomnia", "bedtime", "recovery", "rest", "wind-down"},
            "Mindfulness": {"mindfulness", "meditation", "awareness", "breathwork", "grounding"},
            "Self Care": {"self-care", "selfcare", "routine", "habits", "movement", "support", "focus"},
        }

        counts = {item["name"]: 0 for item in self._resource_categories}
        for item in self._resources:
            text = f"{item.get('title', '')} {item.get('description', '')}".lower()
            tags = {str(tag).lower() for tag in item.get("tags", [])}
            for category, keywords in category_keywords.items():
                if tags.intersection(keywords) or any(keyword in text for keyword in keywords):
                    counts[category] = counts.get(category, 0) + 1

        categories = deepcopy(self._resource_categories)
        for category in categories:
            category["count"] = counts.get(category["name"], 0)
        return categories

    def list_resources(
        self,
        query: str | None = None,
        resource_type: str | None = None,
        recommended: bool | None = None,
        limit: int | None = None,
    ) -> list[dict[str, Any]]:
        resources = deepcopy(self._resources)

        if resource_type:
            normalized_type = resource_type.strip().lower()
            resources = [item for item in resources if item["type"].lower() == normalized_type]

        if recommended is not None:
            resources = [item for item in resources if bool(item.get("recommended")) is recommended]

        if query:
            normalized_query = query.strip().lower()
            resources = [
                item
                for item in resources
                if normalized_query in item["title"].lower()
                or normalized_query in item.get("description", "").lower()
                or normalized_query in item.get("author", "").lower()
                or normalized_query in item.get("source", "").lower()
                or normalized_query in item.get("url", "").lower()
                or any(normalized_query in tag.lower() for tag in item.get("tags", []))
            ]

        if limit is not None:
            resources = resources[: max(limit, 0)]

        return resources

    def list_resource_collections(self) -> list[dict[str, Any]]:
        return deepcopy(self._resource_collections)

    def list_ai_resource_pool(self) -> list[dict[str, Any]]:
        return [
            {
                "id": item["id"],
                "title": item["title"],
                "type": item["type"],
                "description": item["description"],
                "tags": item.get("tags", []),
                "duration": item.get("duration"),
                "level": item.get("level"),
                "author": item.get("author"),
                "source": item.get("source"),
                "url": item.get("url"),
                "thumbnail_url": item.get("thumbnail_url"),
                "recommended": item.get("recommended", False),
            }
            for item in deepcopy(self._resources)
        ]

    def list_appointment_stats(self) -> list[dict[str, Any]]:
        stats = deepcopy(self._appointment_stats)
        stats[0]["value"] = str(len(self._appointments))
        return stats

    def list_counselors(self, language: str | None = None) -> list[dict[str, Any]]:
        counselors = deepcopy(self._counselors)

        if language:
            normalized = language.strip().lower()
            if normalized and normalized != "all":
                counselors = [
                    item
                    for item in counselors
                    if any(normalized == lang.lower() for lang in item.get("languages", []))
                ]

        return counselors

    def list_appointments(self) -> list[dict[str, Any]]:
        return deepcopy(self._appointments)

    def list_open_slots(self) -> list[str]:
        return deepcopy(self._available_slots)

    def list_prep_checklist(self) -> list[str]:
        return deepcopy(self._prep_checklist)

    def book_appointment(
        self,
        counselor_id: int | None,
        specialist_type: str | None,
        preferred_slot: str,
        mode: str,
        location: str | None,
        notes: str | None,
    ) -> dict[str, Any]:
        normalized_specialist = (specialist_type or "").strip()
        normalized_mode = (mode or "Online").strip() or "Online"
        normalized_location = (location or "").strip()
        selected_counselor: dict[str, Any] | None = None

        if counselor_id is not None:
            selected_counselor = self._find_counselor(counselor_id)
        elif normalized_specialist:
            lower_specialist = normalized_specialist.lower()
            for counselor in self._counselors:
                counselor_specialty = str(counselor.get("specialty", "")).lower()
                if lower_specialist in counselor_specialty or counselor_specialty in lower_specialist:
                    selected_counselor = counselor
                    break

        if selected_counselor:
            doctor = selected_counselor["name"]
            final_specialty = selected_counselor["specialty"]
        else:
            doctor = "Dr. Team Specialist"
            final_specialty = normalized_specialist or "General Counselor"

        is_online = normalized_mode.lower() in {"online", "video session", "audio session", "video", "audio"}
        final_location = normalized_location or ("Online" if is_online else "Counselor Office")
        date_value, time_value = _slot_to_date_time(preferred_slot)

        with self._lock:
            appointment = {
                "id": self._next_appointment_id,
                "counselor_id": selected_counselor["id"] if selected_counselor else None,
                "patient_name": str(self._profile.get("name", "User")).strip() or "User",
                "doctor": doctor,
                "specialty": final_specialty,
                "date": date_value,
                "time": time_value,
                "mode": normalized_mode,
                "location": final_location,
                "status": "Confirmed",
                "meet_link": f"https://meet.google.com/{token_urlsafe(8).lower()}" if is_online else None,
                "notes": notes,
            }
            self._appointments.insert(0, appointment)
            self._next_appointment_id += 1

            if preferred_slot in self._available_slots:
                self._available_slots.remove(preferred_slot)

            return deepcopy(appointment)

    def reschedule_appointment(self, appointment_id: int, preferred_slot: str) -> dict[str, Any]:
        date_value, time_value = _slot_to_date_time(preferred_slot)

        with self._lock:
            idx = self._find_appointment_index(appointment_id)
            self._appointments[idx]["date"] = date_value
            self._appointments[idx]["time"] = time_value
            self._appointments[idx]["status"] = "Confirmed"
            mode_value = str(self._appointments[idx].get("mode", "")).lower()
            if mode_value in {"online", "video session", "audio session", "video", "audio"} and not self._appointments[idx].get(
                "meet_link"
            ):
                self._appointments[idx]["meet_link"] = f"https://meet.google.com/{token_urlsafe(8).lower()}"

            if preferred_slot in self._available_slots:
                self._available_slots.remove(preferred_slot)
            return deepcopy(self._appointments[idx])

    def get_featured_event(self) -> dict[str, Any]:
        return deepcopy(self._featured_event)

    def list_upcoming_events(self, category: str | None = None) -> list[dict[str, Any]]:
        events = [_with_event_category(event) for event in self._upcoming_events]
        normalized_category = _normalize_event_category(category)
        if normalized_category:
            events = [event for event in events if event.get("category") == normalized_category]
        return events

    def list_weekly_lineup(self) -> list[dict[str, Any]]:
        return deepcopy(self._weekly_lineup)

    def register_event(self, event_id: int, waitlist_only: bool = False) -> tuple[str, str, dict[str, Any]]:
        with self._lock:
            idx = self._find_event_index(event_id)
            event = self._upcoming_events[idx]

            if waitlist_only:
                status = "waitlisted"
                message = "You have been added to the waitlist."
            elif event["attendees"] < event["capacity"]:
                event["attendees"] += 1
                status = "reserved"
                message = "Your spot has been reserved."
            else:
                status = "waitlisted"
                message = "This event is full. You are now on the waitlist."

            return status, message, _with_event_category(event)

    def list_community_stats(self) -> list[dict[str, Any]]:
        stats = deepcopy(self._community_stats)
        stats[2]["value"] = str(max(int(stats[2]["value"]), len(self._community_posts)))
        return stats

    def list_community_posts(self) -> list[dict[str, Any]]:
        posts = deepcopy(self._community_posts)
        return sorted(posts, key=lambda item: item["id"], reverse=True)

    def create_post(self, author: str, role: str, content: str) -> dict[str, Any]:
        with self._lock:
            post = {
                "id": self._next_post_id,
                "author": author,
                "role": role,
                "time": "Just now",
                "content": content,
                "likes": 0,
                "comments": 0,
            }
            self._community_posts.append(post)
            self._next_post_id += 1
            return deepcopy(post)

    def like_post(self, post_id: int) -> dict[str, Any]:
        with self._lock:
            idx = self._find_post_index(post_id)
            self._community_posts[idx]["likes"] += 1
            return deepcopy(self._community_posts[idx])

    def reply_post(self, post_id: int, _: str) -> dict[str, Any]:
        with self._lock:
            idx = self._find_post_index(post_id)
            self._community_posts[idx]["comments"] += 1
            return deepcopy(self._community_posts[idx])

    def list_support_groups(self) -> list[dict[str, Any]]:
        return deepcopy(self._support_groups)

    def list_mentors(self) -> list[dict[str, Any]]:
        return deepcopy(self._mentors)

    def list_conversations(self) -> list[dict[str, Any]]:
        return deepcopy(self._chat_conversations)

    def create_conversation(self, title: str | None = None) -> dict[str, Any]:
        with self._lock:
            conversation = {
                "id": self._next_conversation_id,
                "title": (title or "New wellness chat").strip(),
                "time": _today_clock_label(),
                "status": "Active",
            }
            self._chat_conversations.insert(0, conversation)
            self._chat_messages[conversation["id"]] = []
            self._next_conversation_id += 1
            return deepcopy(conversation)

    def list_messages(self, conversation_id: int) -> list[dict[str, Any]]:
        if conversation_id not in self._chat_messages:
            raise KeyError(f"Conversation {conversation_id} not found")
        return deepcopy(self._chat_messages[conversation_id])

    def list_recent_history(self, conversation_id: int, limit: int = 8) -> list[dict[str, Any]]:
        history = self.list_messages(conversation_id)
        return history[-limit:]

    def add_message(self, conversation_id: int, role: str, text: str) -> dict[str, Any]:
        with self._lock:
            if conversation_id not in self._chat_messages:
                raise KeyError(f"Conversation {conversation_id} not found")

            message = {
                "id": self._next_message_id,
                "conversation_id": conversation_id,
                "role": role,
                "text": text.strip(),
                "time": _clock_label(),
            }
            self._chat_messages[conversation_id].append(message)
            self._next_message_id += 1

            idx = self._find_conversation_index(conversation_id)
            self._chat_conversations[idx]["time"] = _today_clock_label()
            if role == "assistant":
                self._chat_conversations[idx]["status"] = "Active"

            return deepcopy(message)

    def list_quick_prompts(self) -> list[str]:
        return deepcopy(self._chat_quick_prompts)

    def get_chat_insights(self) -> list[dict[str, Any]]:
        return deepcopy(self._chat_insights)

    def set_chat_insights(self, insights: list[dict[str, Any]]) -> list[dict[str, Any]]:
        with self._lock:
            self._chat_insights = deepcopy(insights)
            return deepcopy(self._chat_insights)
