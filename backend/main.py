import uuid
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models.schemas import EvaluateRequest
from services.resume_parser import parse_resume
from services.groq_service import (
    validate_resume,
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

    # Validate that the document is actually a resume
    try:
        if not validate_resume(resume_text):
            raise HTTPException(
                status_code=400,
                detail="The uploaded document does not appear to be a resume or CV. "
                       "Please upload a valid resume (PDF or DOCX) containing your "
                       "name, skills, experience, or education.",
            )
    except HTTPException:
        raise
    except Exception:
        pass  # If validation itself fails, proceed anyway

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
async def submit_answer(req: EvaluateRequest):
    """Accept an answer, generate next question or final report after 5 questions."""
    session_id = req.session_id
    current_question = req.current_question
    current_answer = req.current_answer

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

    # Use server-side session history as the source of truth
    # (the frontend may send stale data due to closure issues)
    server_prev_questions = session["questions"][:-1]  # all except the current one
    server_prev_answers = session["answers"][:-1]       # all except the one just added

    # Otherwise generate next question
    try:
        next_q = generate_next_question(
            resume_text=session["resume_text"],
            previous_questions=server_prev_questions,
            previous_answers=server_prev_answers,
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
