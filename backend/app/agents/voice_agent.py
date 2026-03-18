from __future__ import annotations

import asyncio
import json
import os
from pathlib import Path

from dotenv import load_dotenv
from livekit.agents import Agent, WorkerOptions, cli
from livekit.agents.voice import AgentSession
from livekit.plugins import openai, sarvam, silero

ENV_PATH = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(ENV_PATH)

SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")
LIVEKIT_URL = os.getenv("LIVEKIT_URL")
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")

LANGUAGE_PROFILES = {
    "en-IN": {"label": "English", "instruction_name": "English"},
    "hi-IN": {"label": "Hindi", "instruction_name": "Hindi"},
    "bn-IN": {"label": "Bengali", "instruction_name": "Bengali"},
    "ta-IN": {"label": "Tamil", "instruction_name": "Tamil"},
    "te-IN": {"label": "Telugu", "instruction_name": "Telugu"},
    "kn-IN": {"label": "Kannada", "instruction_name": "Kannada"},
    "ml-IN": {"label": "Malayalam", "instruction_name": "Malayalam"},
    "mr-IN": {"label": "Marathi", "instruction_name": "Marathi"},
    "gu-IN": {"label": "Gujarati", "instruction_name": "Gujarati"},
    "pa-IN": {"label": "Punjabi", "instruction_name": "Punjabi"},
    "od-IN": {"label": "Odia", "instruction_name": "Odia"},
}

DOCTOR_PROFILES = {
    "depression": {
        "name": "Depression Specialist Agent",
        "specialty": "depression support",
        "focus": "low mood, hopelessness, burnout, and emotional numbness",
        "style": "use warm reassurance, help the user name feelings, and suggest very small next steps",
        "presence": "sound like a warm, confident doctor who gently lifts the patient's hope",
        "speaker": "simran",
    },
    "anxiety": {
        "name": "Anxiety Specialist Agent",
        "specialty": "anxiety support",
        "focus": "racing thoughts, overthinking, stress spikes, and panic-like feelings",
        "style": "slow the pace, guide breathing, and help the user return to the present moment",
        "presence": "sound like a calm doctor who immediately creates safety and steadiness",
        "speaker": "priya",
    },
    "stress": {
        "name": "Stress Specialist Agent",
        "specialty": "stress management",
        "focus": "pressure, overload, work stress, and emotional exhaustion",
        "style": "keep the advice practical, calming, and easy to follow in daily life",
        "presence": "sound like a composed doctor who is practical, grounded, and reassuring",
        "speaker": "simran",
    },
    "sleep": {
        "name": "Sleep Specialist Agent",
        "specialty": "sleep support",
        "focus": "restlessness, poor sleep, late-night worry, and fatigue",
        "style": "sound steady and restful, and suggest calming routines that feel realistic",
        "presence": "sound like a soft-spoken doctor with a restful and soothing bedside manner",
        "speaker": "rohan",
    },
    "trauma-support": {
        "name": "Trauma Support Agent",
        "specialty": "trauma-informed support",
        "focus": "emotional safety, grounding, overwhelm, and difficult memories",
        "style": "move gently, never push, prioritize safety, and offer grounding support first",
        "presence": "sound like a very careful doctor who speaks gently and respectfully",
        "speaker": "shreya",
    },
    "youth-care": {
        "name": "Student Support Agent",
        "specialty": "student and youth mental health",
        "focus": "academic pressure, confidence issues, loneliness, and routine stress",
        "style": "use simple encouraging language and give manageable suggestions",
        "presence": "sound like an approachable doctor who is supportive, positive, and easy to talk to",
        "speaker": "kavya",
    },
}

EXERCISE_PROFILES = {
    "calm-breathing": {
        "name": "Calm Breathing Coach",
        "focus": "guiding the user through a calm breathing exercise with precise, minimal instructions",
        "style": "keep every spoken line brief, soothing, and easy to follow",
        "presence": "sound like a grounded breathing coach who speaks slowly and reassuringly",
        "speaker": "priya",
        "languages": {
            "en-IN": {
                "opening_line": "{user_name}, we are starting the calm breathing exercise now. Follow my voice and begin when I guide you.",
                "stages": {
                    "INHALE": {"label": "Breathe In", "instruction": "Breathe in slowly.", "spoken": "Breathe in slowly."},
                    "HOLD": {"label": "Hold", "instruction": "Hold your breath.", "spoken": "Hold your breath."},
                    "EXHALE": {"label": "Breathe Out", "instruction": "Breathe out slowly.", "spoken": "Breathe out slowly."},
                },
                "completion_line": "Exercise complete. Great job!",
            },
            "hi-IN": {
                "opening_line": "{user_name}, ab hum calm breathing exercise shuru kar rahe hain. Meri awaaz ke saath shuru kijiye.",
                "stages": {
                    "INHALE": {"label": "Saans Andar", "instruction": "Dheere se saans andar lijiye.", "spoken": "Dheere se saans andar lijiye."},
                    "HOLD": {"label": "Rok Kar Rakhiye", "instruction": "Saans ko roke rakhiye.", "spoken": "Saans ko roke rakhiye."},
                    "EXHALE": {"label": "Saans Bahar", "instruction": "Dheere se saans bahar chhodiye.", "spoken": "Dheere se saans bahar chhodiye."},
                },
                "completion_line": "Exercise poori ho gayi. Bahut achha kiya.",
            },
            "mr-IN": {
                "opening_line": "{user_name}, आता आपण calm breathing exercise सुरू करत आहोत. हळूवार श्वास आत घ्या.",
                "stages": {
                    "INHALE": {"label": "श्वास आत", "instruction": "हळूवार श्वास आत घ्या.", "spoken": "हळूवार श्वास आत घ्या."},
                    "HOLD": {"label": "धरा", "instruction": "श्वास रोखून धरा.", "spoken": "श्वास रोखून धरा."},
                    "EXHALE": {"label": "श्वास बाहेर", "instruction": "हळूवार श्वास बाहेर सोडा.", "spoken": "हळूवार श्वास बाहेर सोडा."},
                },
                "completion_line": "व्यायाम पूर्ण झाला. खूप छान केलंत.",
            },
        },
    }
}

AGENT_GREETING_TEMPLATES = {
    "depression": {
        "en-IN": (
            "Hello {user_name}. I'm glad you came in today. I know things may have felt heavy lately, but we will take this gently and work through it together. Tell me, how have you been feeling emotionally these past few days?"
        ),
        "mr-IN": (
            "नमस्कार {user_name}. तुम्ही आज आलात हे खूप चांगलं केलंत. सध्या सगळं जड वाटत असेल तरी आपण हे शांतपणे एकत्र समजून घेऊ. सांगा, गेल्या काही दिवसांत मनाने तुम्हाला कसं वाटत होतं?"
        ),
    },
    "anxiety": {
        "en-IN": (
            "Hello {user_name}. You're safe here, and there is no need to rush. Let's slow this down together first. Tell me, what is making you feel most anxious right now?"
        ),
        "mr-IN": (
            "नमस्कार {user_name}. तुम्ही इथे सुरक्षित आहात, आणि आपल्याला अजिबात घाई करायची नाही. आधी आपण हा क्षण थोडा शांत करूया. सांगा, आत्ता सगळ्यात जास्त अस्वस्थपणा कशामुळे जाणवतो आहे?"
        ),
    },
    "stress": {
        "en-IN": (
            "Hello {user_name}. I'm glad you came in today. If things have been feeling overloaded and tiring, we'll sort them out one step at a time. What has been putting the most pressure on you recently?"
        ),
        "mr-IN": (
            "नमस्कार {user_name}. तुम्ही आज आलात हे खूप चांगलं केलंत. सगळं खूप भरलेलं आणि थकवणारं वाटत असेल, तर आपण ते एकेक भाग करून पाहू. आत्ता सगळ्यात जास्त दडपण कशामुळे येत आहे?"
        ),
    },
    "sleep": {
        "en-IN": (
            "Hello {user_name}. Let's keep this calm and unhurried. If your nights have been restless or your mind has not been settling easily, we'll look at it gently together. How has your sleep been over the last few nights?"
        ),
        "mr-IN": (
            "नमस्कार {user_name}. आपण हे अगदी शांत आणि निवांतपणे घेऊया. जर रात्री बेचैन जात असतील किंवा मन पटकन शांत होत नसेल, तर आपण ते एकत्र समजून घेऊ. गेले काही दिवस तुमची झोप कशी झाली?"
        ),
    },
    "trauma-support": {
        "en-IN": (
            "Hello {user_name}. I'm here with you, and we'll move only at a pace that feels safe for you. You do not have to explain everything at once. What feels most important for me to understand first?"
        ),
        "mr-IN": (
            "नमस्कार {user_name}. मी इथे तुमच्यासोबत खूप जपून आहे, आणि आपण फक्त तुम्हाला सुरक्षित वाटेल त्या गतीनेच बोलू. सगळं एकदम सांगण्याची गरज नाही. सुरुवातीला कोणती गोष्ट मला समजणे सर्वात महत्त्वाचे आहे?"
        ),
    },
    "youth-care": {
        "en-IN": (
            "Hi {user_name}. I'm really glad you came in today. Even if things feel messy with studies, friends, or pressure, we can sort through it together. What has been bothering you the most lately?"
        ),
        "mr-IN": (
            "हाय {user_name}. तुम्ही आज आलात हे खूप छान आहे. अभ्यास, मित्र, किंवा दबावामुळे कितीही गोंधळ वाटत असला, तरी आपण हे एकत्र समजून घेऊ शकतो. अलीकडे सगळ्यात जास्त कोणती गोष्ट त्रास देते आहे?"
        ),
    },
}

DEFAULT_GREETING_TEMPLATE = {
    "en-IN": "Hello {user_name}. I am your {agent_name}. I am glad you are here today. How are you feeling right now?",
    "mr-IN": "नमस्कार {user_name}. मी तुमचा {agent_name} आहे. तुम्ही आज इथे आला आहात याचा मला आनंद आहे. आत्ता तुम्हाला कसं वाटतंय?",
}


def _require_env() -> None:
    missing_env = [
        name
        for name, value in {
            "SARVAM_API_KEY": SARVAM_API_KEY,
            "LIVEKIT_URL": LIVEKIT_URL,
            "LIVEKIT_API_KEY": LIVEKIT_API_KEY,
            "LIVEKIT_API_SECRET": LIVEKIT_API_SECRET,
        }.items()
        if not value
    ]

    if missing_env:
        raise ValueError(f"Missing required environment variables: {', '.join(missing_env)}")


def _parse_room_context(room_name: str | None) -> tuple[str, str, str]:
    normalized = (room_name or "").strip()
    if normalized.lower().startswith("mental-health-exercise-"):
        remainder = normalized[len("mental-health-exercise-") :]
        exercise_id, separator, rest = remainder.partition("__")
        if not separator:
            return "exercise", "calm-breathing", "en-IN"

        language_code, _separator, _suffix = rest.partition("__")
        exercise_key = exercise_id if exercise_id in EXERCISE_PROFILES else "calm-breathing"
        language_key = language_code if language_code in LANGUAGE_PROFILES else "en-IN"
        return "exercise", exercise_key, language_key

    if not normalized.lower().startswith("mental-health-"):
        return "doctor", "depression", "mr-IN"

    remainder = normalized[len("mental-health-") :]
    doctor_id, separator, rest = remainder.partition("__")
    if not separator:
        return "doctor", "depression", "mr-IN"

    language_code, _separator, _suffix = rest.partition("__")
    doctor_key = doctor_id if doctor_id in DOCTOR_PROFILES else "depression"
    language_key = language_code if language_code in LANGUAGE_PROFILES else "mr-IN"
    return "doctor", doctor_key, language_key


def _safe_user_name(name: str | None, identity: str | None) -> str:
    candidate = (name or "").strip()
    if candidate:
        first = candidate.split()[0].strip()
        return first or "friend"

    fallback = (identity or "").strip()
    if not fallback:
        return "friend"

    cleaned = fallback.replace("-", " ").replace("_", " ").strip()
    first_token = cleaned.split()[0] if cleaned else ""
    return first_token or "friend"


def _build_opening_greeting(doctor_id: str, language_code: str, agent_name: str, user_name: str) -> str:
    language_templates = AGENT_GREETING_TEMPLATES.get(doctor_id, {})
    template = (
        language_templates.get(language_code)
        or language_templates.get("en-IN")
        or DEFAULT_GREETING_TEMPLATE.get(language_code)
        or DEFAULT_GREETING_TEMPLATE["en-IN"]
    )
    return template.format(agent_name=agent_name, user_name=user_name)


class MentalHealthAgent(Agent):
    def __init__(self, doctor_profile: dict[str, str], language_profile: dict[str, str], language_code: str) -> None:
        instructions = f"""
You are {doctor_profile['name']}, a calm and supportive AI mental health voice doctor.
Your specialty is {doctor_profile['specialty']}.
Your main focus is {doctor_profile['focus']}.
Conversation style:
- Listen carefully and patiently.
- Respond STRICTLY in {language_profile['instruction_name']}.
- {doctor_profile['style']}.
- {doctor_profile['presence']}.
- Keep responses warm, natural, and conversational.
- Speak like a real human doctor in a calm one-to-one conversation, not like a bot or scripted assistant.
- Use gentle empathy, reflective listening, and emotionally natural phrases.
- Vary your sentence openings so every reply does not sound the same.
- Sometimes acknowledge the user's feeling first before giving guidance.
- Use short supportive phrases that sound human, such as "I understand", "that sounds difficult", or their natural equivalent in the selected language.
- Avoid overly formal, mechanical, or repetitive wording.
- Usually respond with 3 to 6 sentences when the user shares a real concern.
- Give slightly fuller emotional support, reassurance, and practical guidance before stopping.
- Begin the very first reply with the user's first name and a distinct tone that matches your specialty.
- Pause often and let the user speak instead of giving long monologues.
- Never give a medical diagnosis.
- If the user appears at risk of harming themselves or others, strongly encourage immediate help from trusted people and emergency services.
""".strip()

        super().__init__(
            instructions=instructions,
            stt=sarvam.STT(
                model="saaras:v3",
                language=language_code,
                mode="transcribe",
                flush_signal=True,
            ),
            llm=openai.LLM(
                base_url="https://api.sarvam.ai/v1",
                api_key=SARVAM_API_KEY,
                model="sarvam-30b",
            ),
            tts=sarvam.TTS(
                model="bulbul:v3",
                target_language_code=language_code,
                speaker=doctor_profile["speaker"],
            ),
        )


class ExerciseCoachAgent(Agent):
    def __init__(self, exercise_profile: dict[str, str], language_profile: dict[str, str], language_code: str) -> None:
        instructions = f"""
You are {exercise_profile['name']}, a calm AI exercise voice coach.
Your job is guiding a mental wellness exercise with short, precise spoken cues.
Conversation style:
- Respond STRICTLY in {language_profile['instruction_name']}.
- {exercise_profile['style']}.
- {exercise_profile['presence']}.
- Speak in very short lines.
- Do not improvise long explanations.
- During the active exercise, only say the requested cue for the current stage.
- Keep the tone calm, steady, and supportive.
- Never give a diagnosis or unrelated advice during the exercise flow.
        """.strip()

        super().__init__(
            instructions=instructions,
            stt=sarvam.STT(
                model="saaras:v3",
                language=language_code,
                mode="transcribe",
                flush_signal=True,
            ),
            llm=openai.LLM(
                base_url="https://api.sarvam.ai/v1",
                api_key=SARVAM_API_KEY,
                model="sarvam-30b",
            ),
            tts=sarvam.TTS(
                model="bulbul:v3",
                target_language_code=language_code,
                speaker=exercise_profile["speaker"],
            ),
        )


def _exercise_language_pack(exercise_profile: dict[str, str], language_code: str) -> dict[str, str]:
    languages = exercise_profile.get("languages", {})
    return languages.get(language_code) or languages.get("en-IN") or {}


async def entrypoint(ctx) -> None:
    _require_env()
    await ctx.connect()

    room_type, profile_id, language_code = _parse_room_context(getattr(ctx.room, "name", ""))
    language_profile = LANGUAGE_PROFILES[language_code]

    session = AgentSession(
        vad=silero.VAD.load(),
        turn_detection="stt",
        min_endpointing_delay=0.4,
        max_endpointing_delay=1.2,
        min_interruption_duration=0.2,
        false_interruption_timeout=1.2,
        resume_false_interruption=True,
    )

    if room_type == "exercise":
        exercise_profile = EXERCISE_PROFILES[profile_id]
        await session.start(
            agent=ExerciseCoachAgent(exercise_profile, language_profile, language_code),
            room=ctx.room,
        )

        speech_lock = asyncio.Lock()
        linked_participant = session.room_io.linked_participant
        user_name = _safe_user_name(
            getattr(linked_participant, "name", None),
            getattr(linked_participant, "identity", None),
        )
        exercise_pack = _exercise_language_pack(exercise_profile, language_code)
        active_task: asyncio.Task | None = None

        async def _speak_text(text: str):
            async with speech_lock:
                return await session.say(text, allow_interruptions=False, add_to_chat_ctx=False)

        async def _publish_ui_event(payload: dict) -> None:
            await ctx.room.local_participant.publish_data(
                json.dumps(payload),
                reliable=True,
                topic="exercise-ui",
            )

        async def _run_calm_breathing_session(payload: dict) -> None:
            total_duration = int(payload.get("session_duration") or 60)
            stage_sequence = payload.get("stages") or [
                {"key": "INHALE", "duration": 4},
                {"key": "HOLD", "duration": 4},
                {"key": "EXHALE", "duration": 4},
            ]
            session_time_remaining = total_duration

            while session_time_remaining > 0:
                for index, stage in enumerate(stage_sequence):
                    stage_key = stage.get("key")
                    stage_duration = int(stage.get("duration") or 0)
                    stage_copy = exercise_pack.get("stages", {}).get(stage_key)

                    if not stage_key or not stage_copy or stage_duration <= 0:
                        continue

                    instruction = stage_copy["instruction"]
                    spoken = stage_copy["spoken"]

                    if index == 0 and session_time_remaining == total_duration:
                        intro_handle = await _speak_text(
                            exercise_pack["opening_line"].format(user_name=user_name)
                        )
                        await intro_handle.wait_for_playout()
                        await asyncio.sleep(0.35)

                    stage_handle = await _speak_text(spoken)
                    wait_for_generation = getattr(stage_handle, "_wait_for_generation", None)
                    if callable(wait_for_generation):
                        await wait_for_generation()
                    wait_for_scheduled = getattr(stage_handle, "_wait_for_scheduled", None)
                    if callable(wait_for_scheduled):
                        await wait_for_scheduled()
                    await _publish_ui_event(
                        {
                            "type": "stage_started",
                            "exercise_id": profile_id,
                            "stage": stage_key,
                            "label": stage_copy["label"],
                            "instruction": instruction,
                            "duration": stage_duration,
                            "session_time_remaining": session_time_remaining,
                        }
                    )
                    await asyncio.sleep(stage_duration)

                    session_time_remaining -= stage_duration
                    if session_time_remaining <= 0:
                        break

            await _publish_ui_event(
                {
                    "type": "exercise_completed",
                    "exercise_id": profile_id,
                    "message": exercise_pack["completion_line"],
                }
            )
            await _speak_text(exercise_pack["completion_line"])

        def _on_data_received(data_packet) -> None:
            if getattr(data_packet, "topic", "") != "exercise-coach":
                return

            try:
                payload = json.loads(data_packet.data.decode("utf-8"))
            except Exception:
                return

            event_type = payload.get("type")
            nonlocal active_task

            if event_type == "exercise_started":
                if active_task and not active_task.done():
                    active_task.cancel()
                active_task = asyncio.create_task(_run_calm_breathing_session(payload))
            elif event_type == "exercise_stopped":
                if active_task and not active_task.done():
                    active_task.cancel()

        ctx.room.on("data_received", _on_data_received)
        await asyncio.Future()
        return

    doctor_profile = DOCTOR_PROFILES[profile_id]
    await session.start(
        agent=MentalHealthAgent(doctor_profile, language_profile, language_code),
        room=ctx.room,
    )

    linked_participant = session.room_io.linked_participant
    user_name = _safe_user_name(
        getattr(linked_participant, "name", None),
        getattr(linked_participant, "identity", None),
    )
    opening_greeting = _build_opening_greeting(
        doctor_id=profile_id,
        language_code=language_code,
        agent_name=doctor_profile["name"],
        user_name=user_name,
    )
    await session.say(opening_greeting)


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
        )
    )
