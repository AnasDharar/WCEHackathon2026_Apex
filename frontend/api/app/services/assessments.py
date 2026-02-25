from __future__ import annotations

from datetime import datetime
from typing import Any

from fastapi import HTTPException

from app.schemas.assessments import QuestionnaireSubmission

PHQ_GAD_OPTIONS = {
    0: "Not at all",
    1: "Several days",
    2: "More than half the days",
    3: "Nearly every day",
}

ONBOARDING_TEST_IDS: tuple[str, ...] = ("phq9", "gad7")

ASSESSMENT_DEFINITIONS: dict[str, dict[str, Any]] = {
    "phq9": {
        "id": "phq9",
        "title": "PHQ-9 (Depression Test)",
        "use": "Depression symptom screening",
        "duration": "Last 2 weeks",
        "options": [{"value": value, "label": label} for value, label in PHQ_GAD_OPTIONS.items()],
        "questions": [
            {"id": "phq9_q1", "text": "Little interest or pleasure in doing things"},
            {"id": "phq9_q2", "text": "Feeling down, depressed, or hopeless"},
            {"id": "phq9_q3", "text": "Trouble falling or staying asleep, or sleeping too much"},
            {"id": "phq9_q4", "text": "Feeling tired or having little energy"},
            {"id": "phq9_q5", "text": "Poor appetite or overeating"},
            {"id": "phq9_q6", "text": "Feeling bad about yourself - or that you are a failure"},
            {"id": "phq9_q7", "text": "Trouble concentrating on things (reading/studying)"},
            {"id": "phq9_q8", "text": "Moving or speaking slowly OR being very restless"},
            {"id": "phq9_q9", "text": "Thoughts that you would be better off dead or hurting yourself"},
        ],
    },
    "gad7": {
        "id": "gad7",
        "title": "GAD-7 (General Anxiety Disorder Test)",
        "use": "Anxiety level measurement",
        "duration": "Last 2 weeks",
        "options": [{"value": value, "label": label} for value, label in PHQ_GAD_OPTIONS.items()],
        "questions": [
            {"id": "gad7_q1", "text": "Feeling nervous, anxious, or on edge"},
            {"id": "gad7_q2", "text": "Not being able to stop or control worrying"},
            {"id": "gad7_q3", "text": "Worrying too much about different things"},
            {"id": "gad7_q4", "text": "Trouble relaxing"},
            {"id": "gad7_q5", "text": "Being so restless that it is hard to sit still"},
            {"id": "gad7_q6", "text": "Becoming easily annoyed or irritable"},
            {"id": "gad7_q7", "text": "Feeling afraid as if something awful might happen"},
        ],
    },
}


def get_assessment_catalog() -> list[dict[str, Any]]:
    return [ASSESSMENT_DEFINITIONS[test_id] for test_id in ONBOARDING_TEST_IDS]


def _severity_gad7(total_score: int) -> tuple[str, str]:
    if total_score <= 4:
        return "Minimal", "Symptoms are currently minimal. Keep following stabilizing routines."
    if total_score <= 9:
        return "Mild", "Mild anxiety patterns are present. Daily coping routines can help reduce escalation."
    if total_score <= 14:
        return "Moderate", "Moderate anxiety levels are present. Structured support and coping plans are recommended."
    return "Severe", "High anxiety burden detected. Professional mental health support is strongly recommended."


def _severity_phq9(total_score: int) -> tuple[str, str]:
    if total_score <= 4:
        return "Minimal", "Depression symptoms are currently minimal."
    if total_score <= 9:
        return "Mild", "Mild depressive symptoms are present. Early support can prevent worsening."
    if total_score <= 14:
        return "Moderate", "Moderate depressive symptoms are present. Consider timely professional guidance."
    if total_score <= 19:
        return "Moderately Severe", "Significant depressive symptoms are present. Professional evaluation is advised."
    return "Severe", "Severe depressive symptom burden detected. Prompt professional support is strongly advised."


def _extract_submission_map(submissions: list[QuestionnaireSubmission]) -> dict[str, list[int]]:
    submission_map: dict[str, list[int]] = {}
    for item in submissions:
        if item.test_id in submission_map:
            raise HTTPException(status_code=400, detail=f"Duplicate submission for test_id '{item.test_id}'.")
        submission_map[item.test_id] = item.answers
    return submission_map


def _validate_required_submissions(submission_map: dict[str, list[int]]) -> None:
    required = set(ONBOARDING_TEST_IDS)
    provided = set(submission_map.keys())
    if provided != required:
        missing = sorted(required - provided)
        extras = sorted(provided - required)
        detail_parts: list[str] = []
        if missing:
            detail_parts.append(f"Missing submissions: {', '.join(missing)}")
        if extras:
            detail_parts.append(f"Unexpected submissions: {', '.join(extras)}")
        raise HTTPException(status_code=400, detail=". ".join(detail_parts))


def _validate_answer_range(test_id: str, answers: list[int]) -> None:
    for index, score in enumerate(answers, start=1):
        if score < 0 or score > 3:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid score {score} for {test_id} question {index}. Expected 0-3.",
            )


def _validate_answer_count(test_id: str, answers: list[int]) -> None:
    expected_count = len(ASSESSMENT_DEFINITIONS[test_id]["questions"])
    if len(answers) != expected_count:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid answer count for {test_id}. Expected {expected_count}, received {len(answers)}.",
        )


def _build_breakdown(test_id: str, answers: list[int]) -> list[dict[str, Any]]:
    definition = ASSESSMENT_DEFINITIONS[test_id]
    breakdown: list[dict[str, Any]] = []
    for idx, score in enumerate(answers):
        question = definition["questions"][idx]
        breakdown.append(
            {
                "question_id": question["id"],
                "question": question["text"],
                "score": score,
                "label": PHQ_GAD_OPTIONS[score],
                "adjusted_score": None,
            }
        )
    return breakdown


def _result_for_gad7(answers: list[int]) -> dict[str, Any]:
    total_score = sum(answers)
    severity, interpretation = _severity_gad7(total_score)
    return {
        "test_id": "gad7",
        "title": ASSESSMENT_DEFINITIONS["gad7"]["title"],
        "total_score": total_score,
        "max_score": 21,
        "severity": severity,
        "interpretation": interpretation,
        "breakdown": _build_breakdown("gad7", answers),
        "sensitive_alert": False,
    }


def _result_for_phq9(answers: list[int]) -> dict[str, Any]:
    total_score = sum(answers)
    severity, interpretation = _severity_phq9(total_score)
    sensitive_alert = answers[8] > 0
    return {
        "test_id": "phq9",
        "title": ASSESSMENT_DEFINITIONS["phq9"]["title"],
        "total_score": total_score,
        "max_score": 27,
        "severity": severity,
        "interpretation": interpretation,
        "breakdown": _build_breakdown("phq9", answers),
        "sensitive_alert": sensitive_alert,
    }


def _build_recommendation_context(results: list[dict[str, Any]]) -> list[dict[str, str]]:
    responses: list[dict[str, str]] = []
    for result in results:
        responses.append(
            {
                "question": f"{result['title']} overall",
                "answer": f"Severity: {result['severity']} (score {result['total_score']}/{result['max_score']}).",
            }
        )
        for item in result["breakdown"]:
            if item["score"] >= 2:
                responses.append(
                    {
                        "question": item["question"],
                        "answer": f"{item['label']} (score {item['score']})",
                    }
                )
    return responses


def _build_summary(results: list[dict[str, Any]]) -> str:
    by_test_id = {item["test_id"]: item for item in results}
    labels = {"phq9": "PHQ-9", "gad7": "GAD-7"}
    parts: list[str] = []
    for test_id in ONBOARDING_TEST_IDS:
        item = by_test_id.get(test_id)
        if not item:
            continue
        parts.append(f"{labels.get(test_id, test_id.upper())}: {item['severity']}")
    return " | ".join(parts)


def _build_alerts(results: list[dict[str, Any]]) -> tuple[bool, list[dict[str, str]]]:
    phq9_result = next(item for item in results if item["test_id"] == "phq9")
    q9_item = phq9_result["breakdown"][8]
    if q9_item["score"] <= 0:
        return False, []

    return True, [
        {
            "level": "critical",
            "title": "Immediate Support Recommended",
            "message": (
                "Your PHQ-9 response indicates possible self-harm thoughts. "
                "Please contact emergency support immediately. In the US/Canada, call or text 988."
            ),
        }
    ]


def score_assessment_submissions(submissions: list[QuestionnaireSubmission]) -> dict[str, Any]:
    submission_map = _extract_submission_map(submissions)
    _validate_required_submissions(submission_map)

    for test_id in ONBOARDING_TEST_IDS:
        answers = submission_map[test_id]
        _validate_answer_count(test_id, answers)
        _validate_answer_range(test_id, answers)

    results = [
        _result_for_phq9(submission_map["phq9"]),
        _result_for_gad7(submission_map["gad7"]),
    ]

    requires_immediate_attention, alerts = _build_alerts(results)
    recommendation_context = _build_recommendation_context(results)
    submitted_at = datetime.utcnow().replace(microsecond=0).isoformat() + "Z"
    submitted_at_display = datetime.utcnow().strftime("%b %d, %Y")

    return {
        "submitted_at": submitted_at,
        "submitted_at_display": submitted_at_display,
        "summary": _build_summary(results),
        "requires_immediate_attention": requires_immediate_attention,
        "alerts": alerts,
        "questionnaire_results": results,
        "recommendation_context": recommendation_context,
    }
