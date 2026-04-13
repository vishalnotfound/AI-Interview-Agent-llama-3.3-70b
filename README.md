# AI Interview Agent

## Overview

The AI Interview Agent is an application designed to facilitate mock interviews using AI. It leverages advanced natural language processing techniques to simulate interview scenarios for job seekers to prepare effectively.

## Features
- **Realistic Interview Simulations**: Engage in lifelike interview scenarios with AI.
- **Feedback Mechanism**: Receive constructive feedback on your responses.
- **Customizable Interviews**: Customize the interview based on specific job roles and industries.

## Frontend Setup Instructions

### Prerequisites
1. **Node.js** (version 14 or later): Make sure you have Node.js installed on your machine. You can download it from [Node.js official website](https://nodejs.org/).
2. **npm** (Node Package Manager): npm comes bundled with Node.js.
3. **Git**: Ensure Git is installed for version control.

### Cloning the Repository
1. Open your terminal/command prompt.
2. Clone the repository:
   ```bash
   git clone https://github.com/vishalnotfound/AI-Interview-Agent-llama-3.3-70b.git
   cd AI-Interview-Agent-llama-3.3-70b
   ```

### Installing Dependencies
Run the following command to install the required dependencies:
```bash
npm install
```

### Running the Application
To start the frontend application, use:
```bash
npm start
```
This will start the application on `http://localhost:3000`.

### Building for Production
If you would like to create an optimized build for production, run:
```bash
npm run build
```
This will generate static files in the `build` directory.

### Additional Configuration
The application may require additional configuration for connecting to the backend API. Please refer to the backend documentation for details on API endpoints and authentication.

### Troubleshooting
- **Dependencies Errors**: If you encounter errors during installation, try deleting the `node_modules` folder and the `package-lock.json` file, then run `npm install` again.
- **Port Issues**: If `3000` is in use, you might need to run the app on a different port by specifying the port in your start script.

## Contributing
Contributions are welcome! Please read the [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute to this project.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.