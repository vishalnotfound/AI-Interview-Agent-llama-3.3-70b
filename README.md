# AI Interview Agent LLaMA 3.3 70B

## Project Overview
The AI Interview Agent is designed to simulate interview scenarios and provide feedback for both candidates and interviewers. Leveraging advanced natural language processing techniques, this agent can conduct interviews, assess responses, and provide relevant guidance.

## Features
- **Realistic Interview Scenarios**: Various roles and scenarios to choose from.
- **Feedback Mechanism**: Instant feedback on performance with recommendations.
- **User-Friendly Interface**: Simple and intuitive frontend.
- **Customizability**: Options for both interviewers and candidates to customize settings.

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
   npm start
   ```
   Access the application at `http://localhost:3000`.

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
   python app.py
   ```

## API Endpoints
- **`GET /api/interview`**: Fetch available interview scenarios.
- **`POST /api/interview/start`**: Start a new interview session.
- **`POST /api/interview/submit`**: Submit responses for assessment.
- **`GET /api/feedback`**: Retrieve feedback based on submitted responses.

## Troubleshooting
- **Issue**: App not starting.
  - **Solution**: Ensure all dependencies are installed and environment variables are set correctly.
- **Issue**: API call fails.
  - **Solution**: Check network connection and validate API endpoint.

## Project Structure
```
AI-Interview-Agent-llama-3.3-70b/
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── public/
│   ├── src/
│   └── package.json
└── README.md
```

## Conclusion
This project serves as a powerful tool for interview preparation. Please explore the available features and provide feedback for future improvements.