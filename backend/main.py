import uuid
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from services.resume_parser import parse_resume
from services.groq_service import (
    generate_first_question,
    generate_next_question,
    generate_final_report,
)

app = FastAPI(title="AI Interview Prep API")

# CORS — allow the Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session     
sessions: dict = {}

TOTAL_QUESTIONS = 5


@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    """Parse resume, create session, and generate the first interview question."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided.")

    try:
        file_bytes = await file.read()
        resume_text = parse_resume(file_bytes, file.filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to parse resume file.")

    try:
        first_question = generate_first_question(resume_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI API error: {str(e)}")

    session_id = str(uuid.uuid4())
    sessions[session_id] = {
        "resume_text": resume_text,
        "questions": [first_question],
        "answers": [],
    }

    return {"session_id": session_id, "first_question": first_question}


@app.post("/submit-answer")
async def submit_answer(req: dict):
    """Accept an answer, generate next question or final report after 5 questions."""
    session_id = req.get("session_id")
    current_question = req.get("current_question", "")
    current_answer = req.get("current_answer", "")
    previous_questions = req.get("previous_questions", [])
    previous_answers = req.get("previous_answers", [])

    session = sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    # Store the answer
    session["answers"].append(current_answer)
    question_number = len(session["answers"])

    # If all questions answered → generate final report
    if question_number >= TOTAL_QUESTIONS:
        try:
            report = generate_final_report(
                resume_text=session["resume_text"],
                questions=session["questions"],
                answers=session["answers"],
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Final report error: {str(e)}")

        return {
            "question_count": question_number,
            "final_report": report,
        }

    # Otherwise generate next question
    try:
        next_q = generate_next_question(
            resume_text=session["resume_text"],
            previous_questions=previous_questions,
            previous_answers=previous_answers,
            current_question=current_question,
            current_answer=current_answer,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI API error: {str(e)}")

    session["questions"].append(next_q)

    return {
        "next_question": next_q,
        "question_count": question_number,
    }
