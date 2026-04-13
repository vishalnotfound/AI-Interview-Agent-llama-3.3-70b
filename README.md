# AI Interview Agent LLaMA 3.3 70B

## Project Overview
The AI Interview Agent is designed to simulate interview scenarios and provide feedback to the candidates. Leveraging advanced natural language processing techniques, this agent can conduct interviews, assess responses, and provide relevant guidance and feedback.
It has a score card as well after the completion of the interview and it suggest what candidate should improve.
Interview start after the candidate uploads its resume and hit the start interview button.

## Features
- **Realistic Interview Scenarios**: Various roles and scenarios to choose from.
- - **Question generation based on last answer**: Agent uses RAG to generate the next question on whatever the uesr has responded in real time.
- **Feedback Mechanism**: Instant feedback on performance with recommendations.
- **User-Friendly Interface**: Simple and intuitive frontend.

## Frontend Setup
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/vishalnotfound/AI-Interview-Agent-llama-3.3-70b.git
   cd AI-Interview-Agent-llama-3.3-70b
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Run the Application**:
   ```bash
   npm run dev
   ```

## Backend Setup
1. **Clone the Repository** (same as frontend):
   ```bash
   git clone https://github.com/vishalnotfound/AI-Interview-Agent-llama-3.3-70b.git
   cd AI-Interview-Agent-llama-3.3-70b
   ```
2. **Install Backend Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
3. **Setup Environment Variables**:
   Create a `.env` file in the root directory and add necessary environment variables:
   ```
   DATABASE_URL=<your_database_url>
   SECRET_KEY=<your_secret_key>
   ```
4. **Run the Backend**:
   ```bash
   uvicorn main:app --reload
   ```
## Conclusion
This project serves as a powerful tool for interview preparation. Please explore the available features and provide feedback for future improvements.
